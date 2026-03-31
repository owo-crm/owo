import calendar
import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.services.event_service import DomainEvent, EventService, decimal_to_string

VALID_RECURRING_INTERVALS = {"weekly", "monthly", "quarterly"}


def _add_months(value: date, months: int = 1) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(value.day, last_day)
    return date(year, month, day)


def _normalize_interval(interval: str | None) -> str:
    return interval if interval in VALID_RECURRING_INTERVALS else "monthly"


def _advance_due_date(value: date, interval: str | None) -> date:
    normalized = _normalize_interval(interval)
    if normalized == "weekly":
        return value + timedelta(days=7)
    if normalized == "quarterly":
        return _add_months(value, 3)
    return _add_months(value, 1)


class ExpenseService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def materialize_due_recurring_expenses(self, business_id: uuid.UUID, *, today: date | None = None) -> None:
        current_day = today or date.today()
        event_service = EventService(self.db)
        templates_result = await self.db.execute(
            select(Expense).where(
                Expense.business_id == business_id,
                Expense.expense_type == "recurring",
                Expense.is_template.is_(True),
                Expense.recurring_active.is_(True),
                Expense.archived_at.is_(None),
                Expense.next_due_date.is_not(None),
            )
        )
        templates = list(templates_result.scalars().all())
        has_changes = False

        for template in templates:
            next_due = template.next_due_date
            while next_due and next_due <= current_day:
                existing_result = await self.db.execute(
                    select(Expense).where(
                        Expense.parent_recurring_id == template.id,
                        Expense.date == next_due,
                    )
                )
                existing = existing_result.scalar_one_or_none()
                if existing is None:
                    occurrence = Expense(
                        business_id=template.business_id,
                        lead_id=template.lead_id,
                        created_by=template.created_by,
                        expense_type="recurring",
                        is_template=False,
                        recurring_interval=template.recurring_interval,
                        next_due_date=None,
                        recurring_active=True,
                        archived_at=None,
                        parent_recurring_id=template.id,
                        title=template.title,
                        amount=template.amount,
                        description=template.description,
                        date=next_due,
                    )
                    self.db.add(occurrence)
                    await self.db.flush()
                    await event_service.emit(
                        DomainEvent(
                            business_id=template.business_id,
                            event_type="recurring_plan_due",
                            entity_type="expense",
                            entity_id=template.id,
                            lead_id=template.lead_id,
                            triggered_by_user_id=template.created_by,
                            dedupe_key=f"recurring_plan_due:{template.id}:{next_due.isoformat()}",
                            payload=self._expense_event_payload(
                                template,
                                extra={
                                    "occurrence_id": str(occurrence.id),
                                    "occurrence_date": next_due.isoformat(),
                                },
                            ),
                        )
                    )
                    has_changes = True
                next_due = _advance_due_date(next_due, template.recurring_interval)
                template.next_due_date = next_due
                has_changes = True

        if has_changes:
            await self.db.commit()

    async def list_expenses(
        self,
        business_id: uuid.UUID,
        *,
        expense_type: str | None = None,
        lead_id: uuid.UUID | None = None,
    ) -> list[Expense]:
        await self.materialize_due_recurring_expenses(business_id)
        query = select(Expense).where(
            Expense.business_id == business_id,
            Expense.is_template.is_(False),
        )
        if expense_type and expense_type != "all":
            query = query.where(Expense.expense_type == expense_type)
        if lead_id:
            query = query.where(Expense.lead_id == lead_id)
        query = query.order_by(Expense.date.desc(), Expense.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_recurring_templates(self, business_id: uuid.UUID) -> list[Expense]:
        await self.materialize_due_recurring_expenses(business_id)
        result = await self.db.execute(
            select(Expense).where(
                Expense.business_id == business_id,
                Expense.expense_type == "recurring",
                Expense.is_template.is_(True),
                Expense.archived_at.is_(None),
            ).order_by(Expense.title.asc())
        )
        return list(result.scalars().all())

    async def create_expense(self, created_by: uuid.UUID, payload: ExpenseCreate) -> Expense:
        if payload.expense_type == "recurring":
            expense = Expense(
                business_id=payload.business_id,
                lead_id=payload.lead_id,
                created_by=created_by,
                expense_type="recurring",
                is_template=True,
                recurring_interval=_normalize_interval(payload.recurring_interval),
                next_due_date=payload.date,
                recurring_active=True,
                archived_at=None,
                parent_recurring_id=None,
                title=payload.title,
                amount=payload.amount,
                description=payload.description,
                date=payload.date,
            )
        else:
            expense = Expense(
                business_id=payload.business_id,
                lead_id=payload.lead_id,
                created_by=created_by,
                expense_type=payload.expense_type,
                is_template=False,
                recurring_interval=None,
                next_due_date=None,
                recurring_active=True,
                archived_at=None,
                parent_recurring_id=None,
                title=payload.title,
                amount=payload.amount,
                description=payload.description,
                date=payload.date,
            )
        self.db.add(expense)
        await self.db.flush()
        await EventService(self.db).emit(
            DomainEvent(
                business_id=expense.business_id,
                event_type="expense_created",
                entity_type="expense",
                entity_id=expense.id,
                lead_id=expense.lead_id,
                triggered_by_user_id=created_by,
                payload=self._expense_event_payload(expense),
            )
        )
        await self.db.commit()
        await self.db.refresh(expense)
        if expense.is_template:
            await self.materialize_due_recurring_expenses(payload.business_id)
            refreshed = await self.get_expense(payload.business_id, expense.id)
            if refreshed is not None:
                expense = refreshed
        return expense

    async def get_expense(self, business_id: uuid.UUID, expense_id: uuid.UUID) -> Expense | None:
        result = await self.db.execute(
            select(Expense).where(Expense.business_id == business_id, Expense.id == expense_id)
        )
        return result.scalar_one_or_none()

    async def update_expense(self, expense: Expense, payload: ExpenseUpdate) -> Expense:
        values = payload.model_dump(exclude_unset=True, mode="python")
        for key, value in values.items():
            if key == "date" and expense.is_template:
                expense.date = value
                expense.next_due_date = value
                continue
            if key == "recurring_interval":
                value = _normalize_interval(value)
            setattr(expense, key, value)
        if expense.expense_type != "recurring":
            expense.is_template = False
            expense.recurring_interval = None
            expense.next_due_date = None
            expense.recurring_active = True
            expense.archived_at = None
            expense.parent_recurring_id = None
        elif expense.is_template:
            expense.recurring_interval = _normalize_interval(expense.recurring_interval)
        await self.db.commit()
        await self.db.refresh(expense)
        if expense.is_template:
            await self.materialize_due_recurring_expenses(expense.business_id)
            refreshed = await self.get_expense(expense.business_id, expense.id)
            if refreshed is not None:
                expense = refreshed
        return expense

    async def delete_expense(self, expense: Expense) -> None:
        if expense.is_template:
            occurrences_result = await self.db.execute(
                select(Expense).where(Expense.parent_recurring_id == expense.id)
            )
            for occurrence in list(occurrences_result.scalars().all()):
                await self.db.delete(occurrence)
        await self.db.delete(expense)
        await self.db.commit()

    async def stats_snapshot(self, business_id: uuid.UUID) -> list[Expense]:
        await self.materialize_due_recurring_expenses(business_id)
        result = await self.db.execute(
            select(Expense).where(
                Expense.business_id == business_id,
                Expense.is_template.is_(False),
            )
        )
        return list(result.scalars().all())

    async def pause_recurring_template(self, expense: Expense) -> Expense:
        expense.recurring_active = False
        await EventService(self.db).emit(
            DomainEvent(
                business_id=expense.business_id,
                event_type="recurring_plan_paused",
                entity_type="expense",
                entity_id=expense.id,
                lead_id=expense.lead_id,
                triggered_by_user_id=expense.created_by,
                payload=self._expense_event_payload(expense),
            )
        )
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def resume_recurring_template(self, expense: Expense) -> Expense:
        expense.recurring_active = True
        if expense.archived_at is not None:
            expense.archived_at = None
        if expense.next_due_date is None:
            expense.next_due_date = expense.date
        await EventService(self.db).emit(
            DomainEvent(
                business_id=expense.business_id,
                event_type="recurring_plan_resumed",
                entity_type="expense",
                entity_id=expense.id,
                lead_id=expense.lead_id,
                triggered_by_user_id=expense.created_by,
                payload=self._expense_event_payload(expense),
            )
        )
        await self.db.commit()
        await self.db.refresh(expense)
        await self.materialize_due_recurring_expenses(expense.business_id)
        refreshed = await self.get_expense(expense.business_id, expense.id)
        return refreshed if refreshed is not None else expense

    async def archive_recurring_template(self, expense: Expense) -> Expense:
        expense.recurring_active = False
        expense.archived_at = datetime.now(UTC)
        await EventService(self.db).emit(
            DomainEvent(
                business_id=expense.business_id,
                event_type="recurring_plan_archived",
                entity_type="expense",
                entity_id=expense.id,
                lead_id=expense.lead_id,
                triggered_by_user_id=expense.created_by,
                payload=self._expense_event_payload(expense),
            )
        )
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    def _expense_event_payload(self, expense: Expense, *, extra: dict[str, Any] | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "expense": {
                "id": str(expense.id),
                "lead_id": str(expense.lead_id) if expense.lead_id else None,
                "title": expense.title,
                "amount": decimal_to_string(expense.amount),
                "date": expense.date.isoformat(),
                "expense_type": expense.expense_type,
                "is_template": expense.is_template,
                "recurring_interval": expense.recurring_interval,
                "next_due_date": expense.next_due_date.isoformat() if expense.next_due_date else None,
                "recurring_active": expense.recurring_active,
            }
        }
        if extra:
            payload.update(extra)
        return payload
