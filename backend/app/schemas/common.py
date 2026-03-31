import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.automation import AutomationSettingsOut
from app.schemas.event import BusinessEventOut, NotificationSettingsOut


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORMModel):
    id: uuid.UUID
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language: str
    is_platform_admin: bool
    created_at: datetime


class BusinessMemberUserOut(ORMModel):
    id: uuid.UUID
    role: str
    position: str | None = None
    custom_permissions: list[str]
    user_id: uuid.UUID
    display_name: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class BusinessOut(ORMModel):
    id: uuid.UUID
    owner_user_id: uuid.UUID
    name: str
    business_mode: str
    sheet_id: str | None = None
    sheet_verified: bool
    sheet_tab_name: str
    sheet_column_mapping: dict
    enabled_modules: list[str]
    automation_settings: AutomationSettingsOut
    notification_settings: NotificationSettingsOut
    sheet_last_synced_at: datetime | None = None
    created_at: datetime


class LeadStatusOut(ORMModel):
    id: uuid.UUID
    business_id: uuid.UUID
    name: str
    color: str
    position: int
    is_default: bool
    is_won: bool
    is_lost: bool
    requires_follow_up: bool
    hide_from_active: bool


class LeadOut(ORMModel):
    id: uuid.UUID
    uid: str
    business_id: uuid.UUID
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    event_date: date | None = None
    event_type: str | None = None
    status: str
    assigned_to: uuid.UUID | None = None
    contract_value: Decimal | None = None
    notes: str | None = None
    next_call_at: datetime | None = None
    call_history: list[dict]
    source: str
    custom_fields: dict
    notified_at: datetime | None = None
    merged_existing: bool = False
    merge_message: str | None = None
    created_at: datetime
    updated_at: datetime


class TaskOut(ORMModel):
    id: uuid.UUID
    business_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    lead_uid: str | None = None
    lead_name: str | None = None
    created_by: uuid.UUID
    assigned_to: uuid.UUID | None = None
    title: str
    description: str | None = None
    deadline: datetime | None = None
    done_at: datetime | None = None
    created_at: datetime


class ExpenseOut(ORMModel):
    id: uuid.UUID
    business_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    created_by: uuid.UUID
    expense_type: str
    is_template: bool
    recurring_interval: str | None = None
    next_due_date: date | None = None
    recurring_active: bool
    archived_at: datetime | None = None
    parent_recurring_id: uuid.UUID | None = None
    title: str
    amount: Decimal
    description: str | None = None
    date: date
    created_at: datetime


class IncomeOut(ORMModel):
    id: uuid.UUID
    business_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    created_by: uuid.UUID
    title: str
    amount: Decimal
    description: str | None = None
    date: date
    created_at: datetime


class LeadAttachmentOut(ORMModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    business_id: uuid.UUID
    uploaded_by: uuid.UUID | None = None
    original_name: str
    content_type: str | None = None
    size_bytes: int
    storage_path: str
    public_url: str
    created_at: datetime
