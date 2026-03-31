import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.common import LeadOut
from app.schemas.lead import LeadCreate, LeadListResponse, LeadUpdate
from app.services.business_service import BusinessService
from app.services.lead_service import LeadService
from app.utils.permissions import (
    can_assign_leads,
    can_delete_leads,
    can_edit_all_leads,
    can_edit_own_leads,
    can_manage_expenses,
    can_view_all_leads,
    can_view_own_leads,
)

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.get("", response_model=LeadListResponse)
async def list_leads(
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    assigned: str | None = Query(default="all", pattern="^(all|assigned|unassigned)$"),
    search: str | None = Query(default=None),
    status_scope: str | None = Query(default="all", pattern="^(all|active|won|lost|follow_up)$"),
    sort_by: str = Query(default="received_at", pattern="^(received_at|last_interaction)$"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> LeadListResponse:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_lead_access = can_view_all_leads(role, custom_permissions)
    own_lead_access = can_view_own_leads(role, custom_permissions)
    if role == "observer" and not full_lead_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot access leads.")
    if role == "member" and not own_lead_access and not full_lead_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to leads.")
    items, total = await LeadService(db).list_leads(
        business_id=business_id,
        page=page,
        page_size=page_size,
        status=status,
        assigned_filter=assigned,
        search=search,
        visible_user_id=current_user.id if role == "member" and not full_lead_access else None,
        status_scope=status_scope,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return LeadListResponse(
        items=[LeadOut.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=LeadOut)
async def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> LeadOut:
    if payload.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="business_id mismatch")

    lead = await LeadService(db).create_lead(payload, triggered_by_user_id=current_user.id)
    return LeadOut.model_validate(lead)


@router.get("/{uid}", response_model=LeadOut)
async def get_lead(
    uid: str,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> LeadOut:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_lead_access = can_view_all_leads(role, custom_permissions)
    own_lead_access = can_view_own_leads(role, custom_permissions)
    if role == "observer" and not full_lead_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot access leads.")
    if role == "member" and not own_lead_access and not full_lead_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to leads.")
    lead = await LeadService(db).get_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if role == "member" and not full_lead_access and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only access their own leads.")
    return LeadOut.model_validate(lead)


@router.patch("/{uid}", response_model=LeadOut)
async def update_lead(
    uid: str,
    payload: LeadUpdate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> LeadOut:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_lead_access = can_edit_all_leads(role, custom_permissions)
    own_lead_access = can_edit_own_leads(role, custom_permissions)
    can_manage_lead_expenses = can_manage_expenses(role, custom_permissions)
    if role == "observer" and not full_lead_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot update leads.")
    if role == "member" and not own_lead_access and not full_lead_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit leads.")
    service = LeadService(db)
    lead = await service.get_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if role == "member" and not full_lead_access and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only update their own leads.")
    if role == "member" and not full_lead_access:
        if "assigned_to" in payload.model_fields_set and payload.assigned_to != lead.assigned_to and not can_assign_leads(role, custom_permissions):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members cannot reassign leads.")
    if "contract_value" in payload.model_fields_set and not can_manage_lead_expenses:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members cannot edit lead profit.")
    updated = await service.update_lead(lead, payload, triggered_by_user_id=current_user.id)
    return LeadOut.model_validate(updated)


@router.delete("/{uid}", response_model=dict)
async def delete_lead(
    uid: str,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> dict:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_delete_leads(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only manager and above can delete leads.")
    service = LeadService(db)
    lead = await service.get_by_uid(business_id, uid)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    await service.delete_lead(lead, triggered_by_user_id=current_user.id)
    return {"deleted": uid}
