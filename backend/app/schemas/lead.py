import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import LeadOut


class LeadCreate(BaseModel):
    business_id: uuid.UUID
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    event_date: date | None = None
    event_type: str | None = None
    status: str | None = None
    assigned_to: uuid.UUID | None = None
    contract_value: Decimal | None = None
    notes: str | None = None
    next_call_at: datetime | None = None
    source: str = "manual"
    custom_fields: dict = Field(default_factory=dict)


class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    event_date: date | None = None
    event_type: str | None = None
    status: str | None = None
    assigned_to: uuid.UUID | None = None
    contract_value: Decimal | None = None
    notes: str | None = None
    next_call_at: datetime | None = None
    call_history: list[dict] | None = None
    custom_fields: dict | None = None


class LeadListResponse(BaseModel):
    items: list[LeadOut]
    page: int
    page_size: int
    total: int
