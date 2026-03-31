import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.inventory import (
    LeadInventoryRequirementCreate,
    LeadInventoryRequirementListResponse,
    LeadInventoryRequirementOut,
    LeadInventoryRequirementUpdate,
    InventoryTemplateApplyRequest,
    InventoryTemplateApplyResult,
    InventoryTemplateCreate,
    InventoryTemplateListResponse,
    InventoryTemplateOut,
    InventoryTemplateUpdate,
    InventoryItemCreate,
    InventoryItemListResponse,
    InventoryItemOut,
    InventoryItemUpdate,
    InventoryMovementCreate,
    InventoryMovementListResponse,
    InventoryMovementOut,
)
from app.services.business_service import BusinessService
from app.services.inventory_service import InventoryService
from app.utils.permissions import can_manage_inventory, can_view_inventory

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


def _item_out(item) -> InventoryItemOut:
    available_quantity = item.current_quantity - item.reserved_quantity
    return InventoryItemOut(
        id=item.id,
        business_id=item.business_id,
        name=item.name,
        sku=item.sku,
        unit=item.unit,
        current_quantity=item.current_quantity,
        reserved_quantity=item.reserved_quantity,
        available_quantity=available_quantity,
        min_quantity=item.min_quantity,
        notes=item.notes,
        is_active=item.is_active,
        created_at=item.created_at,
        low_stock=available_quantity <= item.min_quantity,
    )


async def _resolve_business_access(business_id: uuid.UUID, current_user: User, db: AsyncSession):
    business_service = BusinessService(db)
    business = await business_service.get_for_user(business_id, current_user.id)
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    if "inventory" not in (business.enabled_modules or []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inventory module is not enabled for this business")
    member = await business_service.get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    return business, role, custom_permissions


@router.get("/items", response_model=InventoryItemListResponse)
async def list_inventory_items(
    business_id: uuid.UUID = Query(...),
    include_inactive: bool = Query(default=False),
    search: str = Query(default=""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryItemListResponse:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_view_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view inventory.")
    items = await InventoryService(db).list_items(business_id, include_inactive=include_inactive, search=search.strip())
    return InventoryItemListResponse(items=[_item_out(item) for item in items])


@router.post("/items", response_model=InventoryItemOut)
async def create_inventory_item(
    payload: InventoryItemCreate,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryItemOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot create inventory items.")
    item = await InventoryService(db).create_item(business_id, payload, triggered_by_user_id=current_user.id)
    return _item_out(item)


@router.patch("/items/{item_id}", response_model=InventoryItemOut)
async def update_inventory_item(
    item_id: uuid.UUID,
    payload: InventoryItemUpdate,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryItemOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update inventory items.")
    service = InventoryService(db)
    item = await service.get_item(business_id, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    updated = await service.update_item(item, payload, triggered_by_user_id=current_user.id)
    return _item_out(updated)


@router.get("/movements", response_model=InventoryMovementListResponse)
async def list_inventory_movements(
    business_id: uuid.UUID = Query(...),
    item_id: uuid.UUID | None = Query(default=None),
    lead_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryMovementListResponse:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_view_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view inventory movements.")
    items = await InventoryService(db).list_movements(business_id, item_id=item_id, lead_id=lead_id)
    return InventoryMovementListResponse(items=[InventoryMovementOut.model_validate(item) for item in items])


@router.post("/items/{item_id}/movements", response_model=InventoryMovementOut)
async def create_inventory_movement(
    item_id: uuid.UUID,
    payload: InventoryMovementCreate,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryMovementOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory movements.")
    service = InventoryService(db)
    item = await service.get_item(business_id, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    try:
        movement = await service.add_movement(business_id, item, current_user.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return InventoryMovementOut.model_validate(movement)


@router.get("/requirements", response_model=LeadInventoryRequirementListResponse)
async def list_lead_inventory_requirements(
    business_id: uuid.UUID = Query(...),
    lead_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeadInventoryRequirementListResponse:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_view_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view inventory requirements.")
    items = await InventoryService(db).list_requirements(business_id, lead_id)
    return LeadInventoryRequirementListResponse(items=[LeadInventoryRequirementOut.model_validate(item) for item in items])


@router.post("/requirements", response_model=LeadInventoryRequirementOut)
async def create_lead_inventory_requirement(
    payload: LeadInventoryRequirementCreate,
    business_id: uuid.UUID = Query(...),
    lead_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeadInventoryRequirementOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory requirements.")
    item = await InventoryService(db).create_requirement(business_id, lead_id, payload)
    return LeadInventoryRequirementOut.model_validate(item)


@router.patch("/requirements/{requirement_id}", response_model=LeadInventoryRequirementOut)
async def update_lead_inventory_requirement(
    requirement_id: uuid.UUID,
    payload: LeadInventoryRequirementUpdate,
    business_id: uuid.UUID = Query(...),
    lead_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeadInventoryRequirementOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory requirements.")
    service = InventoryService(db)
    requirement = await service.get_requirement(business_id, lead_id, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory requirement not found")
    updated = await service.update_requirement(requirement, payload)
    return LeadInventoryRequirementOut.model_validate(updated)


@router.delete("/requirements/{requirement_id}")
async def delete_lead_inventory_requirement(
    requirement_id: uuid.UUID,
    business_id: uuid.UUID = Query(...),
    lead_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory requirements.")
    service = InventoryService(db)
    requirement = await service.get_requirement(business_id, lead_id, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory requirement not found")
    await service.delete_requirement(requirement)
    return {"message": "Inventory requirement removed."}


@router.get("/templates", response_model=InventoryTemplateListResponse)
async def list_inventory_templates(
    business_id: uuid.UUID = Query(...),
    event_type_match: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryTemplateListResponse:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_view_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view inventory templates.")
    items = await InventoryService(db).list_templates(business_id, event_type_match=event_type_match.strip() if event_type_match else None)
    return InventoryTemplateListResponse(items=[InventoryTemplateOut.model_validate(item) for item in items])


@router.post("/templates", response_model=InventoryTemplateOut)
async def create_inventory_template(
    payload: InventoryTemplateCreate,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryTemplateOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory templates.")
    item = await InventoryService(db).create_template(business_id, payload)
    return InventoryTemplateOut.model_validate(item)


@router.delete("/templates/{template_id}")
async def delete_inventory_template(
    template_id: uuid.UUID,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory templates.")
    service = InventoryService(db)
    template = await service.get_template(business_id, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory template not found")
    await service.delete_template(template)
    return {"message": "Inventory template removed."}


@router.patch("/templates/{template_id}", response_model=InventoryTemplateOut)
async def update_inventory_template(
    template_id: uuid.UUID,
    payload: InventoryTemplateUpdate,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryTemplateOut:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage inventory templates.")
    service = InventoryService(db)
    template = await service.get_template(business_id, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory template not found")
    updated = await service.update_template(template, payload)
    return InventoryTemplateOut.model_validate(updated)


@router.post("/templates/{template_id}/apply", response_model=InventoryTemplateApplyResult)
async def apply_inventory_template(
    template_id: uuid.UUID,
    payload: InventoryTemplateApplyRequest,
    business_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryTemplateApplyResult:
    _business, role, custom_permissions = await _resolve_business_access(business_id, current_user, db)
    if not can_manage_inventory(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot apply inventory templates.")
    service = InventoryService(db)
    template = await service.get_template(business_id, template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory template not found")
    try:
        result = await service.apply_template(
            business_id,
            payload.lead_id,
            template,
            current_user.id,
        )
    except ValueError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return InventoryTemplateApplyResult(**result)
