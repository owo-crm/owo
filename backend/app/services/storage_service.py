import uuid
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.config import Config as BotoConfig
from fastapi import HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse, Response

from app.config import get_settings
from app.models.lead_attachment import LeadAttachment


class AttachmentStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.backend = self.settings.attachments_storage_backend.lower()
        self.upload_root = Path(self.settings.uploads_dir).resolve()
        self.attachments_root = self.upload_root / "lead-attachments"
        self.presigned_ttl = self.settings.attachments_s3_presigned_ttl_seconds
        self._client = None

        if self.backend == "local":
            self.attachments_root.mkdir(parents=True, exist_ok=True)

    def _ensure_s3_client(self):
        if self.backend != "s3":
            return None
        if self._client is not None:
            return self._client
        missing = [
            name
            for name, value in (
                ("ATTACHMENTS_S3_BUCKET", self.settings.attachments_s3_bucket),
                ("ATTACHMENTS_S3_ACCESS_KEY_ID", self.settings.attachments_s3_access_key_id),
                ("ATTACHMENTS_S3_SECRET_ACCESS_KEY", self.settings.attachments_s3_secret_access_key),
            )
            if not value
        ]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"S3 attachment storage is not configured. Missing: {', '.join(missing)}",
            )
        self._client = boto3.client(
            "s3",
            endpoint_url=self.settings.attachments_s3_endpoint_url or None,
            region_name=self.settings.attachments_s3_region or None,
            aws_access_key_id=self.settings.attachments_s3_access_key_id,
            aws_secret_access_key=self.settings.attachments_s3_secret_access_key,
            config=BotoConfig(s3={"addressing_style": "path" if self.settings.attachments_s3_force_path_style else "auto"}),
        )
        return self._client

    def build_key(self, *, business_id: uuid.UUID, lead_id: uuid.UUID, filename: str) -> str:
        suffix = Path(filename).suffix.lower()
        return f"lead-attachments/{business_id}/{lead_id}/{uuid.uuid4().hex}{suffix}"

    def build_internal_content_url(self, *, lead_uid: str, attachment_id: uuid.UUID) -> str:
        return f"/api/v1/leads/{lead_uid}/attachments/{attachment_id}/content"

    def store(self, *, key: str, content: bytes, content_type: str | None) -> str:
        if self.backend == "s3":
            client = self._ensure_s3_client()
            put_kwargs = {
                "Bucket": self.settings.attachments_s3_bucket,
                "Key": key,
                "Body": content,
            }
            if content_type:
                put_kwargs["ContentType"] = content_type
            client.put_object(**put_kwargs)
            return key

        target_path = self.upload_root / key
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(content)
        return str(target_path)

    def delete(self, storage_path: str) -> None:
        if self._looks_like_local_file(storage_path):
            file_path = Path(storage_path)
            if file_path.exists():
                file_path.unlink()
            return

        if self.backend == "s3":
            client = self._ensure_s3_client()
            client.delete_object(Bucket=self.settings.attachments_s3_bucket, Key=storage_path)
            return

        file_path = Path(storage_path)
        if file_path.exists():
            file_path.unlink()

    def content_response(self, *, attachment: LeadAttachment, download: bool = False) -> Response:
        if self._looks_like_local_file(attachment.storage_path):
            file_kwargs = {
                "path": attachment.storage_path,
                "media_type": attachment.content_type or "application/octet-stream",
                "filename": attachment.original_name if download else None,
                "content_disposition_type": "attachment" if download else "inline",
            }
            return FileResponse(**file_kwargs)

        if self.backend == "s3":
            client = self._ensure_s3_client()
            disposition_type = "attachment" if download else "inline"
            params = {
                "Bucket": self.settings.attachments_s3_bucket,
                "Key": attachment.storage_path,
                "ResponseContentDisposition": f'{disposition_type}; filename="{quote(attachment.original_name)}"',
            }
            if attachment.content_type:
                params["ResponseContentType"] = attachment.content_type
            signed_url = client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=self.presigned_ttl,
            )
            return RedirectResponse(url=signed_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

        file_kwargs = {
            "path": attachment.storage_path,
            "media_type": attachment.content_type or "application/octet-stream",
            "filename": attachment.original_name if download else None,
            "content_disposition_type": "attachment" if download else "inline",
        }
        return FileResponse(**file_kwargs)

    @staticmethod
    def _looks_like_local_file(storage_path: str) -> bool:
        path = Path(storage_path)
        return path.is_absolute() or path.exists()
