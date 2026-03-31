import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.common import IncomeOut
from app.schemas.income import IncomeCreate, IncomeListResponse, IncomeUpdate
from app.services.business_service import BusinessService
from app.services.income_service import IncomeService
from app.utils.permissions import can_manage_expenses, can_view_expenses

router = APIRouter(prefix="/api/v1/incomes", tags=["incomes"])


@router.get("", response_model=IncomeListResponse)
async def list_incomes(
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
    lead_id: uuid.UUID | None = Query(default=None),
) -> IncomeListResponse:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_view_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to income history.")
    items = await IncomeService(db).list_incomes(business_id=business_id, lead_id=lead_id)
    return IncomeListResponse(items=[IncomeOut.model_validate(item) for item in items])


@router.post("", response_model=IncomeOut)
async def create_income(
    payload: IncomeCreate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> IncomeOut:
    if payload.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="business_id mismatch")
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot create income records.")
    income = await IncomeService(db).create_income(current_user.id, payload)
    return IncomeOut.model_validate(income)


@router.patch("/{income_id}", response_model=IncomeOut)
async def update_income(
    income_id: uuid.UUID,
    payload: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> IncomeOut:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update income records.")
    service = IncomeService(db)
    income = await service.get_income(business_id, income_id)
    if income is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    return IncomeOut.model_validate(await service.update_income(income, payload))


@router.delete("/{income_id}", response_model=dict)
async def delete_income(
    income_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> dict:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete income records.")
    service = IncomeService(db)
    income = await service.get_income(business_id, income_id)
    if income is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    await service.delete_income(income)
    return {"deleted": str(income_id)}
