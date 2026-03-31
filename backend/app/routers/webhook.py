import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.dependencies import get_app_settings, get_db
from app.models.business import Business
from app.models.lead import Lead
from app.models.task import Task
from app.models.user import User
from app.models.user_session import UserSession
from app.services.bot_service import BotService
from app.services.event_service import EventService
from app.services.sheet_ingestion_service import SheetIngestionService
from app.services.sheet_service import SheetService

router = APIRouter(prefix="/webhook", tags=["webhooks"])


@router.post("/telegram", response_model=dict)
async def telegram_webhook(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
    telegram_secret: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> dict:
    if settings.bot_webhook_secret and telegram_secret != settings.bot_webhook_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Telegram webhook secret")

    message = payload.get("message") or {}
    text = str(message.get("text") or "").strip()
    chat = message.get("chat") or {}
    from_user = message.get("from") or {}
    telegram_id = chat.get("id") or from_user.get("id")
    if not telegram_id or not text.startswith("/"):
        return {"received": True, "update_id": payload.get("update_id")}

    bot_service = BotService(settings)
    command = text.split()[0].lower()
    if command == "/start":
        launch_hint = f"\nOpen Mini App: {settings.mini_app_url}" if settings.mini_app_url else ""
        await bot_service.send_plain_text(
            telegram_id=int(telegram_id),
            text="Barowo bot is connected.\nUse /help to see available commands." + launch_hint,
        )
    elif command == "/help":
        launch_hint = f"\nMini App: {settings.mini_app_url}" if settings.mini_app_url else ""
        await bot_service.send_plain_text(
            telegram_id=int(telegram_id),
            text=(
                "Available commands:\n"
                "/inbox - recent business events\n"
                "/today - your open and overdue tasks\n"
                "/tasks - latest open tasks in the active workspace\n"
                "/leads - latest leads in the active workspace\n"
                "/workspace - current active business\n"
                "/help - show this help"
                + launch_hint
            ),
        )
    elif command == "/inbox":
        user, business = await _resolve_user_and_business(db, int(telegram_id), bot_service)
        if user is None or business is None:
            return {"received": True, "update_id": payload.get("update_id")}
        events = await EventService(db).list_events(business_id=business.id, limit=5)
        if not events:
            text_out = "Inbox is empty right now."
        else:
            lines = [f"Recent events for {business.name}:"]
            for event in events:
                lines.append(f"- {event.event_type.replace('_', ' ')}")
            text_out = "\n".join(lines)
        await bot_service.send_plain_text(telegram_id=int(telegram_id), text=text_out)
    elif command == "/workspace":
        _user, business = await _resolve_user_and_business(db, int(telegram_id), bot_service)
        if business is None:
            return {"received": True, "update_id": payload.get("update_id")}
        await bot_service.send_plain_text(
            telegram_id=int(telegram_id),
            text=f"Active workspace:\n{business.name}",
        )
    elif command == "/today":
        user, business = await _resolve_user_and_business(db, int(telegram_id), bot_service)
        if user is None or business is None:
            return {"received": True, "update_id": payload.get("update_id")}
        open_tasks_result = await db.execute(
            select(Task, Lead.uid, Lead.name)
            .outerjoin(Lead, Lead.id == Task.lead_id)
            .where(
                Task.business_id == business.id,
                Task.assigned_to == user.id,
                Task.done_at.is_(None),
            )
            .order_by(Task.deadline.asc().nulls_last(), Task.created_at.desc())
        )
        rows = list(open_tasks_result.all())
        if not rows:
            await bot_service.send_plain_text(
                telegram_id=int(telegram_id),
                text=f"{business.name}\nNo open tasks assigned to you right now.",
            )
            return {"received": True, "update_id": payload.get("update_id")}
        now = datetime.now(UTC)
        overdue_count = sum(1 for task, _lead_uid, _lead_name in rows if task.deadline and task.deadline < now)
        lines = [f"{business.name}", f"Your open tasks: {len(rows)}", f"Overdue: {overdue_count}"]
        for task, lead_uid, lead_name in rows[:5]:
            suffix = f" ({lead_name or lead_uid})" if (lead_name or lead_uid) else ""
            lines.append(f"- {task.title}{suffix}")
        await bot_service.send_plain_text(telegram_id=int(telegram_id), text="\n".join(lines))
    elif command == "/tasks":
        _user, business = await _resolve_user_and_business(db, int(telegram_id), bot_service)
        if business is None:
            return {"received": True, "update_id": payload.get("update_id")}
        result = await db.execute(
            select(Task, Lead.uid, Lead.name)
            .outerjoin(Lead, Lead.id == Task.lead_id)
            .where(
                Task.business_id == business.id,
                Task.done_at.is_(None),
            )
            .order_by(Task.deadline.asc().nulls_last(), Task.created_at.desc())
            .limit(7)
        )
        rows = list(result.all())
        if not rows:
            await bot_service.send_plain_text(
                telegram_id=int(telegram_id),
                text=f"{business.name}\nNo open tasks in this workspace.",
            )
            return {"received": True, "update_id": payload.get("update_id")}
        lines = [f"Open tasks in {business.name}:"]
        for task, lead_uid, lead_name in rows:
            context = f" ({lead_name or lead_uid})" if (lead_name or lead_uid) else ""
            lines.append(f"- {task.title}{context}")
        await bot_service.send_plain_text(telegram_id=int(telegram_id), text="\n".join(lines))
    elif command == "/leads":
        _user, business = await _resolve_user_and_business(db, int(telegram_id), bot_service)
        if business is None:
            return {"received": True, "update_id": payload.get("update_id")}
        result = await db.execute(
            select(Lead)
            .where(Lead.business_id == business.id)
            .order_by(Lead.created_at.desc())
            .limit(7)
        )
        leads = list(result.scalars().all())
        if not leads:
            await bot_service.send_plain_text(
                telegram_id=int(telegram_id),
                text=f"{business.name}\nNo leads yet.",
            )
            return {"received": True, "update_id": payload.get("update_id")}
        lines = [f"Latest leads in {business.name}:"]
        for lead in leads:
            lines.append(f"- {(lead.name or 'Unnamed')} ({lead.uid}) - {lead.status}")
        await bot_service.send_plain_text(telegram_id=int(telegram_id), text="\n".join(lines))

    return {"received": True, "update_id": payload.get("update_id")}


async def _resolve_user_and_business(
    db: AsyncSession,
    telegram_id: int,
    bot_service: BotService,
) -> tuple[User | None, Business | None]:
    user_result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        await bot_service.send_plain_text(
            telegram_id=telegram_id,
            text="Open the Mini App first so I can connect you to your business workspace.",
        )
        return None, None

    session = await db.get(UserSession, user.id)
    if session is None or session.active_business_id is None:
        await bot_service.send_plain_text(
            telegram_id=telegram_id,
            text="No active business selected yet. Open the Mini App and choose a workspace first.",
        )
        return user, None

    business = await db.get(Business, session.active_business_id)
    if business is None:
        await bot_service.send_plain_text(
            telegram_id=telegram_id,
            text="The active workspace could not be found. Reopen the Mini App and choose your business again.",
        )
        return user, None
    return user, business


@router.post("/sheet/{business_id}", response_model=dict)
async def sheet_webhook(
    business_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> dict:
    row_data = payload.get("row_data", {})
    result = await SheetIngestionService(db, SheetService(settings)).ingest_row(business_id, row_data)
    return {
        "received": True,
        "business_id": str(business_id),
        **result,
    }
