import uuid
import re
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory_item import InventoryItem
from app.models.inventory_movement import InventoryMovement
from app.models.inventory_template import InventoryTemplate
from app.models.lead import Lead
from app.models.lead_inventory_requirement import LeadInventoryRequirement
from app.models.task import Task
from app.services.event_service import DomainEvent, EventService, decimal_to_string


class InventoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_items(self, business_id: uuid.UUID, include_inactive: bool = False, search: str = "") -> list[InventoryItem]:
        query = (
            select(InventoryItem)
            .where(InventoryItem.business_id == business_id)
            .order_by(InventoryItem.created_at.desc())
        )
        if not include_inactive:
            query = query.where(InventoryItem.is_active.is_(True))
        if search:
            like = f"%{search.lower()}%"
            query = query.where((InventoryItem.name.ilike(like)) | (InventoryItem.sku.ilike(like)))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_item(self, business_id: uuid.UUID, item_id: uuid.UUID) -> InventoryItem | None:
        result = await self.db.execute(
            select(InventoryItem).where(
                InventoryItem.business_id == business_id,
                InventoryItem.id == item_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_lead(self, business_id: uuid.UUID, lead_id: uuid.UUID) -> Lead | None:
        result = await self.db.execute(
            select(Lead).where(
                Lead.business_id == business_id,
                Lead.id == lead_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_item(self, business_id: uuid.UUID, payload, *, triggered_by_user_id: uuid.UUID | None = None) -> InventoryItem:
        item = InventoryItem(
            business_id=business_id,
            name=payload.name,
            sku=payload.sku,
            unit=payload.unit,
            current_quantity=payload.current_quantity,
            reserved_quantity=Decimal("0"),
            min_quantity=payload.min_quantity,
            notes=payload.notes,
        )
        self.db.add(item)
        await self.db.flush()
        await self._emit_low_stock_if_needed(item, triggered_by_user_id=triggered_by_user_id)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_item(self, item: InventoryItem, payload, *, triggered_by_user_id: uuid.UUID | None = None) -> InventoryItem:
        if payload.name is not None:
            item.name = payload.name
        if payload.sku is not None:
            item.sku = payload.sku
        if payload.unit is not None:
            item.unit = payload.unit
        if payload.min_quantity is not None:
            item.min_quantity = payload.min_quantity
        if payload.notes is not None:
            item.notes = payload.notes
        if payload.is_active is not None:
            item.is_active = payload.is_active
        await self._emit_low_stock_if_needed(item, triggered_by_user_id=triggered_by_user_id)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def list_movements(
        self,
        business_id: uuid.UUID,
        item_id: uuid.UUID | None = None,
        lead_id: uuid.UUID | None = None,
    ) -> list[InventoryMovement]:
        query = (
            select(InventoryMovement)
            .where(InventoryMovement.business_id == business_id)
            .order_by(InventoryMovement.created_at.desc())
        )
        if item_id:
            query = query.where(InventoryMovement.item_id == item_id)
        if lead_id:
            query = query.where(InventoryMovement.lead_id == lead_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_movement(self, business_id: uuid.UUID, item: InventoryItem, created_by: uuid.UUID, payload) -> InventoryMovement:
        quantity = Decimal(payload.quantity)
        movement_type = payload.movement_type
        current_quantity = Decimal(item.current_quantity)
        reserved_quantity = Decimal(item.reserved_quantity)
        available_quantity = current_quantity - reserved_quantity

        if quantity < 0:
            raise ValueError("Quantity must be positive.")

        if movement_type == "stock_in":
            item.current_quantity = current_quantity + quantity
        elif movement_type == "stock_out":
            next_quantity = current_quantity - quantity
            if next_quantity < 0:
                raise ValueError("Stock out cannot make quantity negative.")
            if next_quantity < reserved_quantity:
                raise ValueError("Stock out would cut into reserved stock.")
            item.current_quantity = next_quantity
        elif movement_type == "adjustment":
            if quantity < reserved_quantity:
                raise ValueError("Adjustment cannot set stock below reserved quantity.")
            item.current_quantity = quantity
        elif movement_type == "reserve":
            if not payload.lead_id:
                raise ValueError("Reserve movement should be linked to a lead.")
            if available_quantity < quantity:
                raise ValueError("Not enough available stock to reserve.")
            item.reserved_quantity = reserved_quantity + quantity
        elif movement_type == "release":
            if reserved_quantity < quantity:
                raise ValueError("Cannot release more than currently reserved.")
            item.reserved_quantity = reserved_quantity - quantity
        elif movement_type == "use":
            if reserved_quantity >= quantity:
                item.reserved_quantity = reserved_quantity - quantity
                item.current_quantity = current_quantity - quantity
            elif available_quantity >= quantity:
                item.current_quantity = current_quantity - quantity
            else:
                raise ValueError("Not enough stock to use this quantity.")
        else:
            raise ValueError("Unsupported movement type.")

        movement = InventoryMovement(
            business_id=business_id,
            item_id=item.id,
            lead_id=payload.lead_id,
            created_by=created_by,
            movement_type=movement_type,
            quantity=quantity,
            note=payload.note,
        )
        self.db.add(movement)
        await self.db.flush()
        await self._emit_low_stock_if_needed(item, triggered_by_user_id=created_by)
        await self.db.commit()
        await self.db.refresh(movement)
        await self.db.refresh(item)
        return movement

    async def list_requirements(self, business_id: uuid.UUID, lead_id: uuid.UUID) -> list[LeadInventoryRequirement]:
        result = await self.db.execute(
            select(LeadInventoryRequirement)
            .where(
                LeadInventoryRequirement.business_id == business_id,
                LeadInventoryRequirement.lead_id == lead_id,
            )
            .order_by(LeadInventoryRequirement.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_requirement(self, business_id: uuid.UUID, lead_id: uuid.UUID, payload) -> LeadInventoryRequirement:
        requirement = LeadInventoryRequirement(
            business_id=business_id,
            lead_id=lead_id,
            item_id=payload.item_id,
            required_quantity=payload.required_quantity,
            note=payload.note,
        )
        self.db.add(requirement)
        await self.db.commit()
        await self.db.refresh(requirement)
        return requirement

    async def get_requirement(
        self,
        business_id: uuid.UUID,
        lead_id: uuid.UUID,
        requirement_id: uuid.UUID,
    ) -> LeadInventoryRequirement | None:
        result = await self.db.execute(
            select(LeadInventoryRequirement).where(
                LeadInventoryRequirement.business_id == business_id,
                LeadInventoryRequirement.lead_id == lead_id,
                LeadInventoryRequirement.id == requirement_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_requirement(self, requirement: LeadInventoryRequirement, payload) -> LeadInventoryRequirement:
        if payload.required_quantity is not None:
            requirement.required_quantity = payload.required_quantity
        if payload.note is not None:
            requirement.note = payload.note
        await self.db.commit()
        await self.db.refresh(requirement)
        return requirement

    async def delete_requirement(self, requirement: LeadInventoryRequirement) -> None:
        await self.db.delete(requirement)
        await self.db.commit()

    async def list_templates(
        self,
        business_id: uuid.UUID,
        event_type_match: str | None = None,
    ) -> list[InventoryTemplate]:
        query = (
            select(InventoryTemplate)
            .where(InventoryTemplate.business_id == business_id)
            .order_by(InventoryTemplate.created_at.desc())
        )
        if event_type_match:
            query = query.where(InventoryTemplate.event_type_match.ilike(event_type_match))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_template(self, business_id: uuid.UUID, payload) -> InventoryTemplate:
        template = InventoryTemplate(
            business_id=business_id,
            name=payload.name,
            event_type_match=payload.event_type_match,
            note=payload.note,
            items=payload.items,
        )
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def get_template(self, business_id: uuid.UUID, template_id: uuid.UUID) -> InventoryTemplate | None:
        result = await self.db.execute(
            select(InventoryTemplate).where(
                InventoryTemplate.business_id == business_id,
                InventoryTemplate.id == template_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_template(self, template: InventoryTemplate, payload) -> InventoryTemplate:
        if payload.name is not None:
            template.name = payload.name
        if payload.event_type_match is not None:
            template.event_type_match = payload.event_type_match
        if payload.note is not None:
            template.note = payload.note
        if payload.items is not None:
            template.items = payload.items
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def delete_template(self, template: InventoryTemplate) -> None:
        await self.db.delete(template)
        await self.db.commit()

    async def apply_template(
        self,
        business_id: uuid.UUID,
        lead_id: uuid.UUID,
        template: InventoryTemplate,
        created_by: uuid.UUID,
        assigned_to: uuid.UUID | None = None,
    ) -> dict[str, object]:
        lead = await self.get_lead(business_id, lead_id)
        if lead is None:
            raise ValueError("Lead not found.")

        event_service = EventService(self.db)
        requirements_created = 0
        reserved_units = Decimal("0")
        missing_units = Decimal("0")
        prep_lines: list[str] = []
        restock_lines: list[str] = []
        touched_items: dict[uuid.UUID, InventoryItem] = {}

        for template_item in template.items:
            item_id_raw = template_item.get("item_id")
            required_quantity_raw = template_item.get("required_quantity")
            if not item_id_raw or required_quantity_raw in (None, ""):
                continue

            try:
                item_id = uuid.UUID(str(item_id_raw))
            except ValueError as exc:
                raise ValueError("Inventory template contains an invalid item id.") from exc

            item = await self.get_item(business_id, item_id)
            if item is None:
                raise ValueError("One of the inventory items from this template no longer exists.")

            required_quantity = Decimal(str(required_quantity_raw))
            if required_quantity <= 0:
                continue

            requirement = LeadInventoryRequirement(
                business_id=business_id,
                lead_id=lead_id,
                item_id=item_id,
                required_quantity=required_quantity,
                note=template_item.get("note"),
            )
            self.db.add(requirement)
            requirements_created += 1

            current_quantity = Decimal(item.current_quantity)
            reserved_quantity = Decimal(item.reserved_quantity)
            available_quantity = max(Decimal("0"), current_quantity - reserved_quantity)
            reserve_now = min(required_quantity, available_quantity)
            missing_now = max(Decimal("0"), required_quantity - reserve_now)

            if reserve_now > 0:
                item.reserved_quantity = reserved_quantity + reserve_now
                self.db.add(
                    InventoryMovement(
                        business_id=business_id,
                        item_id=item.id,
                        lead_id=lead_id,
                        created_by=created_by,
                        movement_type="reserve",
                        quantity=reserve_now,
                        note=template_item.get("note") or f"Auto-reserved from template {template.name}",
                    )
                )
                reserved_units += reserve_now
                prep_lines.append(f"{item.name}: {reserve_now} {item.unit} reserved")
                touched_items[item.id] = item

            if missing_now > 0:
                missing_units += missing_now
                restock_lines.append(f"{item.name}: {missing_now} {item.unit} missing")
                touched_items[item.id] = item

        open_tasks_result = await self.db.execute(
            select(Task).where(
                Task.business_id == business_id,
                Task.lead_id == lead_id,
                Task.done_at.is_(None),
            )
        )
        open_tasks = list(open_tasks_result.scalars().all())

        prep_task_created = False
        restock_task_created = False
        has_open_prep_task = any(
            re.search(r"prepare reserved|reserved inventory|prepare inventory", task.title, re.IGNORECASE)
            for task in open_tasks
        )
        has_open_restock_task = any(
            re.search(r"restock missing inventory", task.title, re.IGNORECASE)
            for task in open_tasks
        )

        task_owner = assigned_to or lead.assigned_to

        if prep_lines and not has_open_prep_task:
            prep_title = (
                f"Prepare reserved item: {prep_lines[0].split(':')[0]}"
                if len(prep_lines) == 1
                else f"Prepare {len(prep_lines)} reserved inventory items"
            )
            self.db.add(
                Task(
                    business_id=business_id,
                    lead_id=lead_id,
                    created_by=created_by,
                    assigned_to=task_owner,
                    title=prep_title,
                    description="; ".join(prep_lines),
                )
            )
            prep_task_created = True

        if restock_lines and not has_open_restock_task:
            self.db.add(
                Task(
                    business_id=business_id,
                    lead_id=lead_id,
                    created_by=created_by,
                    assigned_to=task_owner,
                    title="Restock missing inventory for this lead",
                    description="; ".join(restock_lines),
                )
            )
            restock_task_created = True

        await event_service.emit(
            DomainEvent(
                business_id=business_id,
                event_type="inventory_template_applied",
                entity_type="inventory_template",
                entity_id=template.id,
                lead_id=lead_id,
                triggered_by_user_id=created_by,
                payload={
                    "template": {
                        "id": str(template.id),
                        "name": template.name,
                        "event_type_match": template.event_type_match,
                    },
                    "lead": {
                        "id": str(lead.id),
                        "uid": lead.uid,
                        "name": lead.name,
                    },
                    "requirements_created": requirements_created,
                    "reserved_units": decimal_to_string(reserved_units),
                    "missing_units": decimal_to_string(missing_units),
                },
            )
        )
        if missing_units > 0:
            await event_service.emit(
                DomainEvent(
                    business_id=business_id,
                    event_type="inventory_missing_detected",
                    entity_type="lead",
                    entity_id=lead_id,
                    lead_id=lead_id,
                    triggered_by_user_id=created_by,
                    dedupe_key=f"inventory_missing:{lead_id}:{template.id}:{'|'.join(sorted(restock_lines))}",
                    payload={
                        "template_id": str(template.id),
                        "lead_uid": lead.uid,
                        "missing_units": decimal_to_string(missing_units),
                        "missing_lines": restock_lines,
                    },
                )
            )
        for touched_item in touched_items.values():
            await self._emit_low_stock_if_needed(touched_item, triggered_by_user_id=created_by)

        await self.db.commit()

        message = (
            f"Template applied. {reserved_units} units reserved and {missing_units} still missing."
            if missing_units > 0
            else f"Template applied. {reserved_units} units reserved for this lead."
        )

        return {
            "requirements_created": requirements_created,
            "reserved_units": reserved_units,
            "missing_units": missing_units,
            "prep_task_created": prep_task_created,
            "restock_task_created": restock_task_created,
            "message": message,
        }

    async def _emit_low_stock_if_needed(
        self,
        item: InventoryItem,
        *,
        triggered_by_user_id: uuid.UUID | None,
    ) -> None:
        available_quantity = Decimal(item.current_quantity) - Decimal(item.reserved_quantity)
        if Decimal(item.min_quantity) <= Decimal("0") or available_quantity > Decimal(item.min_quantity):
            return
        await EventService(self.db).emit(
            DomainEvent(
                business_id=item.business_id,
                event_type="inventory_low_stock_detected",
                entity_type="inventory_item",
                entity_id=item.id,
                triggered_by_user_id=triggered_by_user_id,
                dedupe_key=f"inventory_low_stock:{item.id}:{decimal_to_string(available_quantity)}:{decimal_to_string(item.min_quantity)}",
                payload={
                    "item": {
                        "id": str(item.id),
                        "name": item.name,
                        "sku": item.sku,
                        "unit": item.unit,
                        "available_quantity": decimal_to_string(available_quantity),
                        "reserved_quantity": decimal_to_string(item.reserved_quantity),
                        "min_quantity": decimal_to_string(item.min_quantity),
                    }
                },
            )
        )
