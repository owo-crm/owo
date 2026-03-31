import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


DEFAULT_NOTIFY_ON = [
    "lead_created",
    "lead_assigned",
    "lead_status_changed",
    "task_created",
    "task_done",
    "task_overdue_detected",
    "inventory_missing_detected",
    "inventory_low_stock_detected",
]


class NotificationSettingsOut(BaseModel):
    notifications_enabled: bool = False
    telegram_internal_enabled: bool = False
    client_email_enabled: bool = False
    notify_on: list[str] = Field(default_factory=lambda: list(DEFAULT_NOTIFY_ON))
    client_email_sender_name: str | None = None
    client_email_reply_to: str | None = None
    client_email_template_key: str | None = "new_lead_ack"


class NotificationSettingsUpdate(BaseModel):
    notifications_enabled: bool | None = None
    telegram_internal_enabled: bool | None = None
    client_email_enabled: bool | None = None
    notify_on: list[str] | None = None
    client_email_sender_name: str | None = None
    client_email_reply_to: str | None = None
    client_email_template_key: str | None = None


class BusinessEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    event_type: str
    entity_type: str
    entity_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None
    task_id: uuid.UUID | None = None
    triggered_by_user_id: uuid.UUID | None = None
    payload: dict[str, Any]
    delivered_channels: list[str]
    delivery_state: str
    dedupe_key: str | None = None
    created_at: datetime


class BusinessEventListResponse(BaseModel):
    items: list[BusinessEventOut]


def default_notification_settings() -> dict[str, Any]:
    return NotificationSettingsOut().model_dump(mode="python")


def normalize_notification_settings(value: dict[str, Any] | None) -> NotificationSettingsOut:
    base = default_notification_settings()
    if value:
        base.update(value)
    return NotificationSettingsOut.model_validate(base)
