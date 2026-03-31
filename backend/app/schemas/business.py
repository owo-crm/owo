import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.automation import AutomationSettingsOut, AutomationSettingsUpdate
from app.schemas.common import BusinessMemberUserOut, BusinessOut
from app.schemas.common import LeadStatusOut
from app.schemas.event import NotificationSettingsOut, NotificationSettingsUpdate


class BusinessCreate(BaseModel):
    name: str
    business_mode: str = "general_sales"
    sheet_id: str | None = None
    sheet_column_mapping: dict[str, str] = Field(default_factory=dict)
    enabled_modules: list[str] = Field(default_factory=list)
    automation_settings: AutomationSettingsOut = Field(default_factory=AutomationSettingsOut)
    notification_settings: NotificationSettingsOut = Field(default_factory=NotificationSettingsOut)


class BusinessUpdate(BaseModel):
    name: str | None = None
    business_mode: str | None = None
    sheet_id: str | None = None
    sheet_tab_name: str | None = None
    sheet_column_mapping: dict[str, str] | None = None
    enabled_modules: list[str] | None = None
    automation_settings: AutomationSettingsUpdate | None = None
    notification_settings: NotificationSettingsUpdate | None = None


class BusinessVerifySheetRequest(BaseModel):
    sheet_id: str | None = None
    sheet_tab_name: str | None = None


class SheetTabsResponse(BaseModel):
    business_id: uuid.UUID
    sheet_title: str | None = None
    available_tabs: list[str]
    selected_tab_name: str | None = None


class SheetMappingSuggestionResponse(BaseModel):
    business_id: uuid.UUID
    sheet_title: str | None = None
    selected_tab_name: str | None = None
    headers: list[str]
    suggested_mapping: dict[str, str]
    message: str


class SheetColumnMappingUpdate(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: str | None = None
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    event_date: str | None = None
    event_type: str | None = None
    notes: str | None = None


class BusinessListResponse(BaseModel):
    items: list[BusinessOut]


class BusinessMemberListResponse(BaseModel):
    items: list[BusinessMemberUserOut]


class LeadStatusUpdateItem(BaseModel):
    id: uuid.UUID | None = None
    name: str
    color: str = "#888888"
    position: int
    is_default: bool = False
    is_won: bool = False
    is_lost: bool = False
    requires_follow_up: bool = False
    hide_from_active: bool = False


class LeadStatusListResponse(BaseModel):
    items: list[LeadStatusOut]


class SheetVerificationResponse(BaseModel):
    business_id: uuid.UUID
    verified: bool
    sheet_title: str | None = None
    available_tabs: list[str]
    selected_tab_name: str | None = None
    message: str


class SheetSyncResponse(BaseModel):
    business_id: uuid.UUID
    sheet_title: str | None = None
    selected_tab_name: str | None = None
    rows_processed: int
    created_count: int
    updated_count: int
    skipped_count: int
    skipped_reasons: dict[str, int]
    sheet_last_synced_at: datetime | None = None
    message: str
