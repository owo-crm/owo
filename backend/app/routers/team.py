import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.team import (
    TeamActionResponse,
    TeamDeleteResponse,
    TeamInviteCreate,
    TeamMembersResponse,
    TeamRoleUpdate,
)
from app.services.business_service import BusinessService
from app.utils.permissions import can_manage_team

router = APIRouter(prefix="/api/v1/team", tags=["team"])
TEAM_MANAGE_ROLES = {"owner", "admin"}
EDITABLE_TEAM_ROLES = {"owner", "admin", "manager", "member", "observer"}


async def require_team_manager(
    business_id: uuid.UUID = Depends(require_active_sub),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> uuid.UUID:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    if not can_manage_team(role, member.custom_permissions if member else []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage the team.",
        )
    return business_id


@router.get("", response_model=TeamMembersResponse)
async def list_team(
    business_id: uuid.UUID = Depends(require_active_sub),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamMembersResponse:
    return TeamMembersResponse(items=await BusinessService(db).list_members(business_id))


@router.post("/invite", response_model=TeamActionResponse)
async def invite_team_member(
    payload: TeamInviteCreate,
    business_id: uuid.UUID = Depends(require_team_manager),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamActionResponse:
    if payload.role not in EDITABLE_TEAM_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    current_role = await BusinessService(db).get_member_role(business_id, current_user.id)
    if payload.role == "owner" and current_role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can grant owner access.")

    try:
        item = await BusinessService(db).invite_member(
            business_id,
            payload.telegram_id,
            payload.role,
            payload.position,
            payload.custom_permissions,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return TeamActionResponse(item=item, message="Team member added successfully.")


@router.delete("/{user_id}", response_model=TeamDeleteResponse)
async def remove_team_member(
    user_id: uuid.UUID,
    business_id: uuid.UUID = Depends(require_team_manager),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamDeleteResponse:
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove yourself.")
    target_member = await BusinessService(db).get_member(business_id, user_id)
    if target_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    current_role = await BusinessService(db).get_member_role(business_id, current_user.id)
    if target_member.role == "owner" and current_role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can remove another owner.")
    if target_member.role == "owner":
        owner_count = await BusinessService(db).count_members_with_role(business_id, "owner")
        if owner_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Business must have at least one owner.")
    removed = await BusinessService(db).remove_member(business_id, user_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    return TeamDeleteResponse(deleted_user_id=user_id, message="Team member removed.")


@router.patch("/{user_id}/role", response_model=TeamActionResponse)
async def update_team_member_role(
    user_id: uuid.UUID,
    payload: TeamRoleUpdate,
    business_id: uuid.UUID = Depends(require_team_manager),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamActionResponse:
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update your own role manually in admin flow.")
    if payload.role not in EDITABLE_TEAM_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    service = BusinessService(db)
    current_role = await service.get_member_role(business_id, current_user.id)
    existing_member = await service.get_member(business_id, user_id)
    if existing_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    if payload.role == "owner" and current_role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can grant owner access.")
    if existing_member.role == "owner" and current_role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can change another owner.")
    if existing_member.role == "owner" and payload.role != "owner":
        owner_count = await service.count_members_with_role(business_id, "owner")
        if owner_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Business must have at least one owner.")

    item = await service.update_member_role(
        business_id,
        user_id,
        payload.role,
        payload.position,
        payload.custom_permissions,
    )
    return TeamActionResponse(item=item, message="Team role updated.")
