import uuid
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.business import Business
from app.models.business_event import BusinessEvent
from app.models.business_member import BusinessMember
from app.models.user import User
from app.schemas.event import normalize_notification_settings
from app.services.automation_service import AutomationService
from app.services.bot_service import BotService
from app.services.email_service import EmailService


@dataclass(slots=True)
class DomainEvent:
    business_id: uuid.UUID
    event_type: str
    entity_type: str
    entity_id: uuid.UUID | None = None
    lead_id: uuid.UUID | None = None
    task_id: uuid.UUID | None = None
    triggered_by_user_id: uuid.UUID | None = None
    payload: dict[str, Any] = field(default_factory=dict)
    dedupe_key: str | None = None


class EventService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        settings = get_settings()
        self.bot_service = BotService(settings)
        self.email_service = EmailService(settings)
        self._pending_dedupe_keys: set[tuple[uuid.UUID, str]] = set()

    async def emit(self, event: DomainEvent) -> BusinessEvent | None:
        if event.dedupe_key:
            dedupe_marker = (event.business_id, event.dedupe_key)
            if dedupe_marker in self._pending_dedupe_keys:
                return None
            existing = await self.db.execute(
                select(BusinessEvent.id).where(
                    BusinessEvent.business_id == event.business_id,
                    BusinessEvent.dedupe_key == event.dedupe_key,
                )
            )
            if existing.scalar_one_or_none() is not None:
                return None
            self._pending_dedupe_keys.add(dedupe_marker)

        requested_channels = await self._resolve_requested_channels(event.business_id, event.event_type)
        record = BusinessEvent(
            business_id=event.business_id,
            event_type=event.event_type,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            lead_id=event.lead_id,
            task_id=event.task_id,
            triggered_by_user_id=event.triggered_by_user_id,
            payload=event.payload,
            delivered_channels=[],
            delivery_state="pending" if requested_channels else "not_requested",
            dedupe_key=event.dedupe_key,
        )
        self.db.add(record)
        await AutomationService(self.db).process_event(event.event_type, event.payload, event.business_id)
        return record

    async def process_pending_deliveries(self, *, limit: int = 25) -> int:
        result = await self.db.execute(
            select(BusinessEvent)
            .where(BusinessEvent.delivery_state.in_(["pending", "partially_delivered"]))
            .order_by(BusinessEvent.created_at.asc())
            .limit(limit)
        )
        events = list(result.scalars().all())
        delivered_count = 0

        for record in events:
            requested_channels = await self._resolve_requested_channels(record.business_id, record.event_type)
            if not requested_channels:
                record.delivery_state = "not_requested"
                continue

            delivered_channels = list(record.delivered_channels or [])
            delivery_failed = False

            if "telegram_internal" in requested_channels and "telegram_internal" not in delivered_channels:
                telegram_ids = await self._resolve_internal_telegram_recipients(record)
                delivered = await self.bot_service.deliver_event(
                    event_type=record.event_type,
                    payload=record.payload,
                    recipient_telegram_ids=telegram_ids,
                )
                if delivered:
                    delivered_channels.append("telegram_internal")
                elif telegram_ids:
                    delivery_failed = True

            record.delivered_channels = delivered_channels
            if delivered_channels and len(delivered_channels) == len(requested_channels):
                record.delivery_state = "delivered"
                delivered_count += 1
            elif delivered_channels:
                record.delivery_state = "partially_delivered"
            elif delivery_failed:
                record.delivery_state = "failed"
            else:
                record.delivery_state = "not_requested"

        if events:
            await self.db.commit()
        return delivered_count

    async def list_events(
        self,
        *,
        business_id: uuid.UUID,
        limit: int = 20,
        event_type: str | None = None,
    ) -> list[BusinessEvent]:
        query = select(BusinessEvent).where(BusinessEvent.business_id == business_id)
        if event_type:
            query = query.where(BusinessEvent.event_type == event_type)
        query = query.order_by(BusinessEvent.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def _resolve_requested_channels(self, business_id: uuid.UUID, event_type: str) -> list[str]:
        business = await self.db.get(Business, business_id)
        if business is None:
            return []
        settings = normalize_notification_settings(business.notification_settings)
        if not settings.notifications_enabled or event_type not in settings.notify_on:
            return []

        channels: list[str] = []
        if settings.telegram_internal_enabled and self.bot_service.is_configured():
            channels.append("telegram_internal")
        if settings.client_email_enabled and self.email_service.is_configured():
            channels.append("client_email")
        return channels

    async def _resolve_internal_telegram_recipients(self, record: BusinessEvent) -> list[int]:
        recipient_user_ids: set[uuid.UUID] = set()
        payload = record.payload if isinstance(record.payload, dict) else {}
        lead_payload = payload.get("lead") if isinstance(payload.get("lead"), dict) else {}
        task_payload = payload.get("task") if isinstance(payload.get("task"), dict) else {}

        assigned_from_lead = self._uuid_from_payload(lead_payload.get("assigned_to"))
        assigned_from_task = self._uuid_from_payload(task_payload.get("assigned_to"))

        if record.event_type in {"lead_assigned", "task_created", "task_overdue_detected", "task_done"}:
            if assigned_from_task:
                recipient_user_ids.add(assigned_from_task)
            if assigned_from_lead:
                recipient_user_ids.add(assigned_from_lead)

        managers_result = await self.db.execute(
            select(BusinessMember.user_id, User.telegram_id)
            .join(User, User.id == BusinessMember.user_id)
            .where(
                BusinessMember.business_id == record.business_id,
                BusinessMember.role.in_(["owner", "admin", "manager"]),
            )
        )
        manager_rows = list(managers_result.all())

        if record.event_type not in {"lead_assigned", "task_created", "task_done"}:
            recipient_user_ids.update(user_id for user_id, _telegram_id in manager_rows)
        elif not recipient_user_ids:
            recipient_user_ids.update(user_id for user_id, _telegram_id in manager_rows)

        if record.triggered_by_user_id and len(recipient_user_ids) > 1:
            recipient_user_ids.discard(record.triggered_by_user_id)

        users_result = await self.db.execute(
            select(User.telegram_id).where(User.id.in_(recipient_user_ids))
        )
        direct_ids = [telegram_id for telegram_id in users_result.scalars().all() if telegram_id]

        manager_ids = [telegram_id for _user_id, telegram_id in manager_rows if telegram_id and _user_id in recipient_user_ids]
        return list(dict.fromkeys([*direct_ids, *manager_ids]))

    def _uuid_from_payload(self, value: Any) -> uuid.UUID | None:
        if not value:
            return None
        try:
            return uuid.UUID(str(value))
        except ValueError:
            return None


def decimal_to_string(value: Any) -> Any:
    if value is None:
        return None
    return str(value)


def compact_list(values: Sequence[str | None]) -> list[str]:
    return [value for value in values if value]
