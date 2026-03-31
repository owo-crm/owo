import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.common import ExpenseOut
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseUpdate
from app.services.business_service import BusinessService
from app.services.expense_service import ExpenseService
from app.utils.permissions import can_manage_expenses, can_view_expenses

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
    expense_type: str = Query(default="all", pattern="^(all|one_time|recurring)$"),
    lead_id: uuid.UUID | None = Query(default=None),
) -> ExpenseListResponse:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_view_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to expenses.")
    items = await ExpenseService(db).list_expenses(
        business_id=business_id,
        expense_type=expense_type,
        lead_id=lead_id,
    )
    return ExpenseListResponse(items=[ExpenseOut.model_validate(item) for item in items])


@router.get("/recurring-plans", response_model=ExpenseListResponse)
async def list_recurring_plans(
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> ExpenseListResponse:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_view_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to expenses.")
    items = await ExpenseService(db).list_recurring_templates(business_id)
    return ExpenseListResponse(items=[ExpenseOut.model_validate(item) for item in items])


@router.post("", response_model=ExpenseOut)
async def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> ExpenseOut:
    if payload.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="business_id mismatch")
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot create expenses.")
    expense = await ExpenseService(db).create_expense(current_user.id, payload)
    return ExpenseOut.model_validate(expense)


@router.patch("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: uuid.UUID,
    payload: ExpenseUpdate,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> ExpenseOut:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update expenses.")
    service = ExpenseService(db)
    expense = await service.get_expense(business_id, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return ExpenseOut.model_validate(await service.update_expense(expense, payload))


@router.post("/{expense_id}/pause", response_model=ExpenseOut)
async def pause_recurring_plan(
    expense_id: uuid.UUID,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> ExpenseOut:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot pause recurring plans.")
    service = ExpenseService(db)
    expense = await service.get_expense(business_id, expense_id)
    if expense is None or not expense.is_template or expense.expense_type != "recurring":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring plan not found")
    return ExpenseOut.model_validate(await service.pause_recurring_template(expense))


@router.post("/{expense_id}/resume", response_model=ExpenseOut)
async def resume_recurring_plan(
    expense_id: uuid.UUID,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> ExpenseOut:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot resume recurring plans.")
    service = ExpenseService(db)
    expense = await service.get_expense(business_id, expense_id)
    if expense is None or not expense.is_template or expense.expense_type != "recurring":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring plan not found")
    return ExpenseOut.model_validate(await service.resume_recurring_template(expense))


@router.post("/{expense_id}/archive", response_model=ExpenseOut)
async def archive_recurring_plan(
    expense_id: uuid.UUID,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> ExpenseOut:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot archive recurring plans.")
    service = ExpenseService(db)
    expense = await service.get_expense(business_id, expense_id)
    if expense is None or not expense.is_template or expense.expense_type != "recurring":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring plan not found")
    return ExpenseOut.model_validate(await service.archive_recurring_template(expense))


@router.delete("/{expense_id}", response_model=dict)
async def delete_expense(
    expense_id: uuid.UUID,
    _: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> dict:
    member = await BusinessService(db).get_member(business_id, _.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_manage_expenses(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete expenses.")
    service = ExpenseService(db)
    expense = await service.get_expense(business_id, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    await service.delete_expense(expense)
    return {"deleted": str(expense_id)}
