import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi import Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.attachment import LeadAttachmentDeleteResponse, LeadAttachmentsResponse
from app.schemas.common import LeadAttachmentOut
from app.services.attachment_service import AttachmentService
from app.services.business_service import BusinessService
from app.utils.permissions import (
    can_manage_all_attachments,
    can_manage_own_attachments,
    can_view_all_attachments,
    can_view_own_attachments,
)

router = APIRouter(prefix="/api/v1/leads/{uid}/attachments", tags=["attachments"])


@router.get("", response_model=LeadAttachmentsResponse)
async def list_attachments(
    uid: str,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> LeadAttachmentsResponse:
    service = AttachmentService(db)
    lead = await service.get_lead_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_attachment_access = can_view_all_attachments(role, custom_permissions)
    own_attachment_access = can_view_own_attachments(role, custom_permissions)
    if role == "observer" and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot access attachments.")
    if role == "member" and not own_attachment_access and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to attachments.")
    if role == "member" and not full_attachment_access and lead.assigned_to != _.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only access attachments on their own leads.")
    items = await service.list_for_lead(business_id, lead.id)
    return LeadAttachmentsResponse(items=[LeadAttachmentOut.model_validate(item) for item in items])


@router.post("", response_model=LeadAttachmentOut)
async def upload_attachment(
    uid: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> LeadAttachmentOut:
    service = AttachmentService(db)
    lead = await service.get_lead_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_attachment_access = can_manage_all_attachments(role, custom_permissions)
    own_attachment_access = can_manage_own_attachments(role, custom_permissions)
    if role == "observer" and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot upload attachments.")
    if role == "member" and not own_attachment_access and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to upload attachments.")
    if role == "member" and not full_attachment_access and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only upload attachments to their own leads.")
    attachment = await service.upload_for_lead(
        business_id=business_id,
        lead=lead,
        uploaded_by=current_user.id,
        file=file,
    )
    return LeadAttachmentOut.model_validate(attachment)


@router.delete("/{attachment_id}", response_model=LeadAttachmentDeleteResponse)
async def delete_attachment(
    uid: str,
    attachment_id: uuid.UUID,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> LeadAttachmentDeleteResponse:
    service = AttachmentService(db)
    lead = await service.get_lead_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_attachment_access = can_manage_all_attachments(role, custom_permissions)
    own_attachment_access = can_manage_own_attachments(role, custom_permissions)
    if role == "observer" and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot delete attachments.")
    if role == "member" and not own_attachment_access and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete attachments.")
    if role == "member" and not full_attachment_access and lead.assigned_to != _.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only delete attachments on their own leads.")
    attachment = await service.get_attachment(business_id, lead.id, attachment_id)
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    await service.delete_attachment(attachment)
    return LeadAttachmentDeleteResponse(
        deleted_attachment_id=attachment_id,
        message="Attachment deleted.",
    )


@router.get("/{attachment_id}/content")
async def get_attachment_content(
    uid: str,
    attachment_id: uuid.UUID,
    download: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
):
    service = AttachmentService(db)
    lead = await service.get_lead_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_attachment_access = can_view_all_attachments(role, custom_permissions)
    own_attachment_access = can_view_own_attachments(role, custom_permissions)
    if role == "observer" and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot access attachments.")
    if role == "member" and not own_attachment_access and not full_attachment_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to attachments.")
    if role == "member" and not full_attachment_access and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only access attachments on their own leads.")
    attachment = await service.get_attachment(business_id, lead.id, attachment_id)
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    return service.build_content_response(attachment, download=download)
