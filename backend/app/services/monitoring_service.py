from datetime import UTC, datetime

from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.models.lead import Lead
from app.models.task import Task
from app.services.event_service import DomainEvent, EventService
from app.services.expense_service import ExpenseService


class MonitoringService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def materialize_recurring_expenses(self) -> int:
        result = await self.db.execute(
            select(distinct(Expense.business_id)).where(
                Expense.expense_type == "recurring",
                Expense.is_template.is_(True),
                Expense.recurring_active.is_(True),
                Expense.archived_at.is_(None),
            )
        )
        business_ids = [business_id for business_id in result.scalars().all() if business_id]
        for business_id in business_ids:
            await ExpenseService(self.db).materialize_due_recurring_expenses(business_id)
        return len(business_ids)

    async def scan_overdue_tasks(self) -> int:
        now = datetime.now(UTC)
        result = await self.db.execute(
            select(Task, Lead.uid, Lead.name)
            .outerjoin(Lead, Lead.id == Task.lead_id)
            .where(
                Task.done_at.is_(None),
                Task.deadline.is_not(None),
                Task.deadline < now,
            )
        )

        event_service = EventService(self.db)
        count = 0
        for task, lead_uid, lead_name in result.all():
            deadline = task.deadline
            if deadline is None:
                continue
            overdue_hours = max(1, int((now - deadline).total_seconds() // 3600))
            emitted = await event_service.emit(
                DomainEvent(
                    business_id=task.business_id,
                    event_type="task_overdue_detected",
                    entity_type="task",
                    entity_id=task.id,
                    lead_id=task.lead_id,
                    task_id=task.id,
                    triggered_by_user_id=task.assigned_to or task.created_by,
                    dedupe_key=f"task_overdue:{task.id}:{deadline.isoformat()}",
                    payload={
                        "task": {
                            "id": str(task.id),
                            "title": task.title,
                            "lead_id": str(task.lead_id) if task.lead_id else None,
                            "lead_uid": lead_uid,
                            "lead_name": lead_name,
                            "assigned_to": str(task.assigned_to) if task.assigned_to else None,
                            "deadline": deadline.isoformat(),
                            "overdue_hours": overdue_hours,
                        }
                    },
                )
            )
            if emitted is not None:
                count += 1

        if count:
            await self.db.commit()
        return count

    async def process_pending_event_deliveries(self) -> int:
        return await EventService(self.db).process_pending_deliveries()
