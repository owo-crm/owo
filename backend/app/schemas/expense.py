import uuid
from datetime import date as date_value
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import ExpenseOut


class ExpenseCreate(BaseModel):
    business_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    expense_type: str = "one_time"
    recurring_interval: str | None = None
    title: str
    amount: Decimal
    description: str | None = None
    date: date_value


class ExpenseUpdate(BaseModel):
    lead_id: uuid.UUID | None = None
    expense_type: str | None = None
    recurring_interval: str | None = None
    recurring_active: bool | None = None
    title: str | None = None
    amount: Decimal | None = None
    description: str | None = None
    date: date_value | None = None


class ExpenseListResponse(BaseModel):
    items: list[ExpenseOut]
