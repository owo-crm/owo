import uuid

from pydantic import BaseModel

from app.schemas.common import LeadAttachmentOut


class LeadAttachmentsResponse(BaseModel):
    items: list[LeadAttachmentOut]


class LeadAttachmentDeleteResponse(BaseModel):
    deleted_attachment_id: uuid.UUID
    message: str
