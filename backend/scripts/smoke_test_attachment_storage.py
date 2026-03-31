from __future__ import annotations

import sys
import uuid

from botocore.exceptions import ClientError

from app.config import get_settings
from app.services.storage_service import AttachmentStorageService


def main() -> int:
    settings = get_settings()
    storage = AttachmentStorageService()

    if settings.attachments_storage_backend.lower() != "s3":
        print("ATTACHMENTS_STORAGE_BACKEND is not set to 's3'.")
        return 1

    client = storage._ensure_s3_client()
    key = f"smoke-tests/{uuid.uuid4().hex}.txt"
    body = b"Barowo attachment storage smoke test"

    print("Running attachment storage smoke test...")
    print(f"Bucket: {settings.attachments_s3_bucket}")
    print(f"Endpoint: {settings.attachments_s3_endpoint_url or 'AWS default'}")
    print(f"Object key: {key}")

    try:
        client.put_object(
            Bucket=settings.attachments_s3_bucket,
            Key=key,
            Body=body,
            ContentType="text/plain",
        )
        print("PUT ok")

        head = client.head_object(Bucket=settings.attachments_s3_bucket, Key=key)
        print(f"HEAD ok - stored {head.get('ContentLength', 0)} bytes")

        signed_url = client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.attachments_s3_bucket,
                "Key": key,
                "ResponseContentType": "text/plain",
            },
            ExpiresIn=settings.attachments_s3_presigned_ttl_seconds,
        )
        print("SIGNED URL ok")
        print(signed_url)

        client.delete_object(Bucket=settings.attachments_s3_bucket, Key=key)
        print("DELETE ok")

        try:
            client.head_object(Bucket=settings.attachments_s3_bucket, Key=key)
            print("Delete verification failed: object still exists.")
            return 1
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")
            if error_code in {"404", "NoSuchKey", "NotFound"}:
                print("Delete verification ok")
            else:
                raise

        print("Smoke test passed.")
        return 0
    except Exception as exc:  # pragma: no cover - helper script
        print(f"Smoke test failed: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
