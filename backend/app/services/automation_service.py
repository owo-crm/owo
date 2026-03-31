import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business
from app.models.lead import Lead
from app.models.lead_status import LeadStatus
from app.models.task import Task
from app.schemas.automation import normalize_automation_settings
from app.schemas.lead import LeadUpdate
from app.schemas.task import TaskCreate


class AutomationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def process_event(self, event_type: str, payload: dict, business_id: uuid.UUID) -> None:
        business = await self.db.get(Business, business_id)
        if business is None:
            return
        settings = normalize_automation_settings(business.automation_settings)
        if not settings.automations_enabled:
            return

        if event_type == "lead_created":
            await self._handle_lead_created(business, payload, settings)
        elif event_type == "lead_status_changed" and settings.create_task_for_follow_up_stages:
            await self._handle_follow_up_stage(business, payload, settings)

    async def _handle_lead_created(self, business: Business, payload: dict, settings) -> None:
        lead = await self._resolve_lead(payload)
        if lead is None:
            return
        from app.services.lead_service import LeadService

        if settings.assign_new_leads_to_owner and lead.assigned_to is None:
            lead = await LeadService(self.db).update_lead(
                lead,
                LeadUpdate(assigned_to=business.owner_user_id),
                triggered_by_user_id=business.owner_user_id,
                event_source="automation",
            )

        if settings.create_task_on_new_lead:
            await self._ensure_follow_up_task(business, lead, settings, reason="new_lead")

        if settings.create_task_for_follow_up_stages and await self._lead_requires_follow_up(lead):
            await self._ensure_follow_up_task(business, lead, settings, reason="follow_up_stage")

    async def _handle_follow_up_stage(self, business: Business, payload: dict, settings) -> None:
        lead = await self._resolve_lead(payload)
        if lead is None or not await self._lead_requires_follow_up(lead):
            return
        await self._ensure_follow_up_task(business, lead, settings, reason="follow_up_stage")

    async def _resolve_lead(self, payload: dict) -> Lead | None:
        lead_payload = payload.get("lead")
        if not isinstance(lead_payload, dict):
            return None
        lead_id = lead_payload.get("id")
        if not lead_id:
            return None
        return await self.db.get(Lead, uuid.UUID(str(lead_id)))

    async def _lead_requires_follow_up(self, lead: Lead) -> bool:
        result = await self.db.execute(
            select(LeadStatus.requires_follow_up).where(
                LeadStatus.business_id == lead.business_id,
                LeadStatus.name == lead.status,
            )
        )
        return bool(result.scalar_one_or_none())

    async def _ensure_follow_up_task(self, business: Business, lead: Lead, settings, *, reason: str) -> None:
        open_tasks_result = await self.db.execute(
            select(Task.id).where(
                Task.business_id == business.id,
                Task.lead_id == lead.id,
                Task.done_at.is_(None),
            )
        )
        if open_tasks_result.scalar_one_or_none() is not None:
            return

        assignee = lead.assigned_to or business.owner_user_id
        deadline = datetime.now(UTC) + timedelta(hours=max(settings.follow_up_task_deadline_hours, 1))
        title = settings.follow_up_task_title.replace("{lead_name}", lead.name or "lead")
        description = "Auto-created from automation rules."
        if reason == "follow_up_stage":
            description = "Auto-created because this lead moved into a follow-up stage."
        elif reason == "new_lead":
            description = "Auto-created for a newly created lead."

        from app.services.task_service import TaskService

        await TaskService(self.db).create_task(
            business.owner_user_id,
            TaskCreate(
                business_id=business.id,
                lead_id=lead.id,
                assigned_to=assignee,
                title=title,
                description=description,
                deadline=deadline,
            ),
        )
