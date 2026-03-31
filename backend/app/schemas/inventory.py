import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class InventoryItemCreate(BaseModel):
    name: str
    sku: str | None = None
    unit: str = "pcs"
    current_quantity: Decimal = Decimal("0")
    min_quantity: Decimal = Decimal("0")
    notes: str | None = None


class InventoryItemUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    unit: str | None = None
    min_quantity: Decimal | None = None
    notes: str | None = None
    is_active: bool | None = None


class InventoryMovementCreate(BaseModel):
    movement_type: str
    quantity: Decimal
    lead_id: uuid.UUID | None = None
    note: str | None = None


class LeadInventoryRequirementCreate(BaseModel):
    item_id: uuid.UUID
    required_quantity: Decimal
    note: str | None = None


class LeadInventoryRequirementUpdate(BaseModel):
    required_quantity: Decimal | None = None
    note: str | None = None


class InventoryTemplateCreate(BaseModel):
    name: str
    event_type_match: str | None = None
    note: str | None = None
    items: list[dict]


class InventoryTemplateUpdate(BaseModel):
    name: str | None = None
    event_type_match: str | None = None
    note: str | None = None
    items: list[dict] | None = None


class InventoryTemplateApplyRequest(BaseModel):
    lead_id: uuid.UUID


class InventoryItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    name: str
    sku: str | None = None
    unit: str
    current_quantity: Decimal
    reserved_quantity: Decimal
    available_quantity: Decimal
    min_quantity: Decimal
    notes: str | None = None
    is_active: bool
    created_at: datetime
    low_stock: bool


class InventoryMovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    item_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    created_by: uuid.UUID
    movement_type: str
    quantity: Decimal
    note: str | None = None
    created_at: datetime


class LeadInventoryRequirementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    lead_id: uuid.UUID
    item_id: uuid.UUID
    required_quantity: Decimal
    note: str | None = None
    created_at: datetime


class InventoryTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    name: str
    event_type_match: str | None = None
    note: str | None = None
    items: list[dict]
    created_at: datetime


class InventoryItemListResponse(BaseModel):
    items: list[InventoryItemOut]


class InventoryMovementListResponse(BaseModel):
    items: list[InventoryMovementOut]


class LeadInventoryRequirementListResponse(BaseModel):
    items: list[LeadInventoryRequirementOut]


class InventoryTemplateListResponse(BaseModel):
    items: list[InventoryTemplateOut]


class InventoryTemplateApplyResult(BaseModel):
    requirements_created: int
    reserved_units: Decimal
    missing_units: Decimal
    prep_task_created: bool
    restock_task_created: bool
    message: str
