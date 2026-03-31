import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.lead import Lead
from app.models.lead_attachment import LeadAttachment
from app.services.storage_service import AttachmentStorageService

MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_ATTACHMENT_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".heif",
    ".pdf",
    ".txt",
    ".csv",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
}


class AttachmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.settings = get_settings()
        self.storage = AttachmentStorageService()

    async def list_for_lead(self, business_id: uuid.UUID, lead_id: uuid.UUID) -> list[LeadAttachment]:
        result = await self.db.execute(
            select(LeadAttachment)
            .where(
                LeadAttachment.business_id == business_id,
                LeadAttachment.lead_id == lead_id,
            )
            .order_by(LeadAttachment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_lead_by_uid(self, business_id: uuid.UUID, lead_uid: str) -> Lead | None:
        result = await self.db.execute(
            select(Lead).where(Lead.business_id == business_id, Lead.uid == lead_uid)
        )
        return result.scalar_one_or_none()

    async def upload_for_lead(
        self,
        *,
        business_id: uuid.UUID,
        lead: Lead,
        uploaded_by: uuid.UUID | None,
        file: UploadFile,
    ) -> LeadAttachment:
        original_name = file.filename or "attachment"
        suffix = self._get_suffix(original_name)
        if suffix not in ALLOWED_ATTACHMENT_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, HEIC, PDF, TXT, CSV, DOC, DOCX, XLS, XLSX.",
            )

        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty.",
            )
        if len(content) > MAX_ATTACHMENT_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is too large. Maximum size is 10 MB.",
            )
        object_key = self.storage.build_key(business_id=business_id, lead_id=lead.id, filename=original_name)
        storage_path = self.storage.store(key=object_key, content=content, content_type=file.content_type)
        attachment = LeadAttachment(
            business_id=business_id,
            lead_id=lead.id,
            uploaded_by=uploaded_by,
            original_name=original_name,
            content_type=file.content_type,
            size_bytes=len(content),
            storage_path=storage_path,
            public_url="",
        )
        self.db.add(attachment)
        await self.db.commit()
        await self.db.refresh(attachment)
        attachment.public_url = self.storage.build_internal_content_url(lead_uid=lead.uid, attachment_id=attachment.id)
        await self.db.commit()
        await self.db.refresh(attachment)
        return attachment

    async def get_attachment(
        self,
        business_id: uuid.UUID,
        lead_id: uuid.UUID,
        attachment_id: uuid.UUID,
    ) -> LeadAttachment | None:
        result = await self.db.execute(
            select(LeadAttachment).where(
                LeadAttachment.business_id == business_id,
                LeadAttachment.lead_id == lead_id,
                LeadAttachment.id == attachment_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete_attachment(self, attachment: LeadAttachment) -> None:
        self.storage.delete(attachment.storage_path)
        await self.db.delete(attachment)
        await self.db.commit()

    def build_content_response(self, attachment: LeadAttachment, *, download: bool = False):
        return self.storage.content_response(attachment=attachment, download=download)

    @staticmethod
    def _get_suffix(filename: str) -> str:
        parts = filename.rsplit(".", 1)
        if len(parts) == 2:
            return f".{parts[1].lower()}"
        return ""
