import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.dependencies import get_app_settings, get_current_user, get_db
from app.models.user import User
from app.schemas.business import (
    BusinessCreate,
    BusinessListResponse,
    BusinessMemberListResponse,
    LeadStatusListResponse,
    LeadStatusUpdateItem,
    BusinessUpdate,
    SheetMappingSuggestionResponse,
    SheetColumnMappingUpdate,
    BusinessVerifySheetRequest,
    SheetVerificationResponse,
    SheetSyncResponse,
    SheetTabsResponse,
)
from app.schemas.common import BusinessOut, LeadStatusOut
from app.services.business_service import BusinessService
from app.services.sheet_ingestion_service import SheetIngestionService
from app.services.sheet_service import SheetService
from app.utils.permissions import can_manage_team

router = APIRouter(prefix="/api/v1/businesses", tags=["businesses"])


@router.get("", response_model=BusinessListResponse)
async def list_businesses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BusinessListResponse:
    items = await BusinessService(db).list_for_user(current_user.id)
    return BusinessListResponse(items=[BusinessOut.model_validate(item) for item in items])


@router.get("/{business_id}/members", response_model=BusinessMemberListResponse)
async def list_business_members(
    business_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BusinessMemberListResponse:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    return BusinessMemberListResponse(items=await service.list_members(business_id))


@router.get("/{business_id}/lead-statuses", response_model=LeadStatusListResponse)
async def list_lead_statuses(
    business_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeadStatusListResponse:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    items = await service.list_lead_statuses(business_id)
    return LeadStatusListResponse(items=[LeadStatusOut.model_validate(item) for item in items])


@router.put("/{business_id}/lead-statuses", response_model=LeadStatusListResponse)
async def update_lead_statuses(
    business_id: uuid.UUID,
    payload: list[LeadStatusUpdateItem],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeadStatusListResponse:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    member = await service.get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_team(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot edit lead statuses.")
    items = await service.replace_lead_statuses(
        business_id,
        [item.model_dump(mode="python") for item in payload],
    )
    return LeadStatusListResponse(items=[LeadStatusOut.model_validate(item) for item in items])


@router.post("", response_model=BusinessOut)
async def create_business(
    payload: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BusinessOut:
    business = await BusinessService(db).create_for_owner(current_user, payload)
    return BusinessOut.model_validate(business)


@router.patch("/{business_id}", response_model=BusinessOut)
async def update_business(
    business_id: uuid.UUID,
    payload: BusinessUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BusinessOut:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    member = await service.get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_team(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update business settings.")

    updated_business = await service.update_business(business, payload)
    return BusinessOut.model_validate(updated_business)


@router.post("/{business_id}/verify-sheet", response_model=SheetVerificationResponse)
async def verify_sheet(
    business_id: uuid.UUID,
    payload: BusinessVerifySheetRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> SheetVerificationResponse:
    business_service = BusinessService(db)
    business = await business_service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    sheet_id = payload.sheet_id or business.sheet_id or ""
    sheet_tab_name = payload.sheet_tab_name
    if sheet_tab_name is None and business.sheet_verified and business.sheet_id == sheet_id:
        sheet_tab_name = business.sheet_tab_name or None
    service = SheetService(settings)
    verified, message, sheet_title, available_tabs, selected_tab_name = await service.verify_sheet(
        sheet_id,
        sheet_tab_name,
    )
    await business_service.set_sheet_verification(business, sheet_id, verified, selected_tab_name)
    return SheetVerificationResponse(
        business_id=business_id,
        verified=verified,
        sheet_title=sheet_title,
        available_tabs=available_tabs,
        selected_tab_name=selected_tab_name,
        message=message,
    )


@router.get("/{business_id}/sheet-tabs", response_model=SheetTabsResponse)
async def get_sheet_tabs(
    business_id: uuid.UUID,
    sheet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> SheetTabsResponse:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    selected_tab_name = business.sheet_tab_name if business.sheet_verified and business.sheet_id == sheet_id else None
    sheet_title, available_tabs, selected_tab_name, message = await SheetService(settings).get_sheet_tabs(
        sheet_id,
        selected_tab_name,
    )
    if not available_tabs and message != "Sheet tabs loaded successfully.":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return SheetTabsResponse(
        business_id=business_id,
        sheet_title=sheet_title,
        available_tabs=available_tabs,
        selected_tab_name=selected_tab_name,
    )


@router.get("/{business_id}/sheet-mapping/suggestions", response_model=SheetMappingSuggestionResponse)
async def get_sheet_mapping_suggestions(
    business_id: uuid.UUID,
    sheet_id: str,
    sheet_tab_name: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> SheetMappingSuggestionResponse:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    selected_tab_name = sheet_tab_name
    if selected_tab_name is None and business.sheet_verified and business.sheet_id == sheet_id:
        selected_tab_name = business.sheet_tab_name or None
    sheet_title, selected_tab_name, headers, suggested_mapping, message = await SheetService(settings).suggest_mapping(
        sheet_id,
        selected_tab_name,
    )
    return SheetMappingSuggestionResponse(
        business_id=business_id,
        sheet_title=sheet_title,
        selected_tab_name=selected_tab_name,
        headers=headers,
        suggested_mapping=suggested_mapping,
        message=message,
    )


@router.put("/{business_id}/sheet-mapping", response_model=BusinessOut)
async def update_sheet_mapping(
    business_id: uuid.UUID,
    payload: SheetColumnMappingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BusinessOut:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    updated_business = await service.update_sheet_mapping(business, payload.model_dump())
    return BusinessOut.model_validate(updated_business)


@router.post("/{business_id}/sync-sheet", response_model=SheetSyncResponse)
async def sync_sheet(
    business_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> SheetSyncResponse:
    service = BusinessService(db)
    business = await service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")

    result = await SheetIngestionService(db, SheetService(settings)).sync_sheet(
        business_id,
        triggered_by_user_id=current_user.id,
    )
    if result["message"] == "Sheet sync completed successfully.":
        business = await service.mark_sheet_synced(business)
    return SheetSyncResponse(
        business_id=business_id,
        sheet_title=result.get("sheet_title"),
        selected_tab_name=result.get("selected_tab_name"),
        rows_processed=result["rows_processed"],
        created_count=result["created_count"],
        updated_count=result.get("updated_count", 0),
        skipped_count=result["skipped_count"],
        skipped_reasons=result.get("skipped_reasons", {}),
        sheet_last_synced_at=business.sheet_last_synced_at,
        message=result["message"],
    )
