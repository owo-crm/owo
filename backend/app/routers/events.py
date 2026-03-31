import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.event import BusinessEventListResponse, BusinessEventOut
from app.services.business_service import BusinessService
from app.services.event_service import EventService
from app.utils.permissions import can_manage_team

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("", response_model=BusinessEventListResponse)
async def list_business_events(
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    event_type: str | None = Query(default=None),
) -> BusinessEventListResponse:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_team(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view business events.")

    items = await EventService(db).list_events(business_id=business_id, limit=limit, event_type=event_type)
    return BusinessEventListResponse(items=[BusinessEventOut.model_validate(item) for item in items])
