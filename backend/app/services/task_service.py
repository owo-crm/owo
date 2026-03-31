import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.event_service import DomainEvent, EventService


class TaskService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_tasks(self, business_id: uuid.UUID, lead_id: uuid.UUID | None = None) -> list[Task]:
        return await self.list_tasks_filtered(business_id, lead_id=lead_id)

    async def list_tasks_filtered(
        self,
        business_id: uuid.UUID,
        *,
        lead_id: uuid.UUID | None = None,
        state: str = "open",
        assigned_to: uuid.UUID | None = None,
        visible_user_id: uuid.UUID | None = None,
    ) -> list[Task]:
        query = (
            select(Task, Lead.uid, Lead.name)
            .outerjoin(Lead, Lead.id == Task.lead_id)
            .where(Task.business_id == business_id)
        )
        if visible_user_id:
            query = query.where(Task.assigned_to == visible_user_id)
        if lead_id:
            query = query.where(Task.lead_id == lead_id)
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
        if state == "open":
            query = query.where(Task.done_at.is_(None))
        elif state == "done":
            query = query.where(Task.done_at.is_not(None))
        elif state == "overdue":
            query = query.where(Task.done_at.is_(None), Task.deadline.is_not(None), Task.deadline < datetime.now(UTC))
        query = query.order_by(Task.done_at.is_not(None), Task.deadline.asc().nulls_last(), Task.created_at.desc())
        result = await self.db.execute(query)
        items: list[Task] = []
        for task, lead_uid, lead_name in result.all():
            setattr(task, "lead_uid", lead_uid)
            setattr(task, "lead_name", lead_name)
            items.append(task)
        return items

    async def create_task(self, created_by: uuid.UUID, payload: TaskCreate) -> Task:
        task = Task(
            business_id=payload.business_id,
            lead_id=payload.lead_id,
            created_by=created_by,
            assigned_to=payload.assigned_to,
            title=payload.title,
            description=payload.description,
            deadline=payload.deadline,
        )
        self.db.add(task)
        await self.db.flush()
        await EventService(self.db).emit(
            DomainEvent(
                business_id=task.business_id,
                event_type="task_created",
                entity_type="task",
                entity_id=task.id,
                lead_id=task.lead_id,
                task_id=task.id,
                triggered_by_user_id=created_by,
                payload=self._task_event_payload(task, changed_fields=["title", "assigned_to", "deadline"]),
            )
        )
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def get_task(self, business_id: uuid.UUID, task_id: uuid.UUID) -> Task | None:
        result = await self.db.execute(
            select(Task, Lead.uid, Lead.name)
            .outerjoin(Lead, Lead.id == Task.lead_id)
            .where(Task.business_id == business_id, Task.id == task_id)
        )
        row = result.one_or_none()
        if row is None:
            return None
        task, lead_uid, lead_name = row
        setattr(task, "lead_uid", lead_uid)
        setattr(task, "lead_name", lead_name)
        return task

    async def update_task(
        self,
        task: Task,
        payload: TaskUpdate,
        *,
        triggered_by_user_id: uuid.UUID | None = None,
    ) -> Task:
        old_done_at = task.done_at
        changed_fields: list[str] = []
        for key, value in payload.model_dump(exclude_unset=True, mode="python").items():
            if getattr(task, key) != value:
                changed_fields.append(key)
            setattr(task, key, value)
        if changed_fields:
            event_service = EventService(self.db)
            if old_done_at is None and task.done_at is not None:
                await event_service.emit(
                    DomainEvent(
                        business_id=task.business_id,
                        event_type="task_done",
                        entity_type="task",
                        entity_id=task.id,
                        lead_id=task.lead_id,
                        task_id=task.id,
                        triggered_by_user_id=triggered_by_user_id,
                        payload=self._task_event_payload(task, changed_fields=["done_at"]),
                    )
                )
            remaining_fields = [field for field in changed_fields if field != "done_at"]
            if remaining_fields:
                await event_service.emit(
                    DomainEvent(
                        business_id=task.business_id,
                        event_type="task_updated",
                        entity_type="task",
                        entity_id=task.id,
                        lead_id=task.lead_id,
                        task_id=task.id,
                        triggered_by_user_id=triggered_by_user_id,
                        payload=self._task_event_payload(task, changed_fields=remaining_fields),
                    )
                )
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete_task(self, task: Task, *, triggered_by_user_id: uuid.UUID | None = None) -> None:
        await EventService(self.db).emit(
            DomainEvent(
                business_id=task.business_id,
                event_type="task_deleted",
                entity_type="task",
                entity_id=task.id,
                lead_id=task.lead_id,
                task_id=task.id,
                triggered_by_user_id=triggered_by_user_id,
                payload=self._task_event_payload(task, changed_fields=[]),
            )
        )
        await self.db.delete(task)
        await self.db.commit()

    async def mark_done(self, task: Task, *, triggered_by_user_id: uuid.UUID | None = None) -> Task:
        was_open = task.done_at is None
        task.done_at = datetime.now(UTC)
        if was_open:
            await EventService(self.db).emit(
                DomainEvent(
                    business_id=task.business_id,
                    event_type="task_done",
                    entity_type="task",
                    entity_id=task.id,
                    lead_id=task.lead_id,
                    task_id=task.id,
                    triggered_by_user_id=triggered_by_user_id,
                    payload=self._task_event_payload(task, changed_fields=["done_at"]),
                )
            )
        await self.db.commit()
        await self.db.refresh(task)
        return task

    def _task_event_payload(self, task: Task, *, changed_fields: list[str]) -> dict[str, Any]:
        return {
            "changed_fields": changed_fields,
            "task": {
                "id": str(task.id),
                "lead_id": str(task.lead_id) if task.lead_id else None,
                "assigned_to": str(task.assigned_to) if task.assigned_to else None,
                "title": task.title,
                "description": task.description,
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "done_at": task.done_at.isoformat() if task.done_at else None,
            },
        }
