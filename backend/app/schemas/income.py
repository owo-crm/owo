import uuid
from datetime import date as date_value
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import IncomeOut


class IncomeCreate(BaseModel):
    business_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    title: str
    amount: Decimal
    description: str | None = None
    date: date_value


class IncomeUpdate(BaseModel):
    lead_id: uuid.UUID | None = None
    title: str | None = None
    amount: Decimal | None = None
    description: str | None = None
    date: date_value | None = None


class IncomeListResponse(BaseModel):
    items: list[IncomeOut]
