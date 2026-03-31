from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.config import Settings
from app.dependencies import get_app_settings
from app.dependencies import get_db, require_platform_admin
from app.models.business_member import BusinessMember
from app.models.user import User
from app.schemas.admin import (
    AdminSystemReadinessResponse,
    AdminUserRow,
    AdminUsersResponse,
    TelegramBotActionResponse,
    TelegramBotStatusResponse,
)
from app.services.bot_service import BotService
from app.services.readiness_service import ReadinessService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/users", response_model=AdminUsersResponse)
async def list_users(
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUsersResponse:
    query = (
        select(
            User.id,
            User.telegram_id,
            User.username,
            User.first_name,
            User.last_name,
            User.language,
            User.created_at,
            func.count(BusinessMember.business_id).label("businesses_count"),
        )
        .outerjoin(BusinessMember, BusinessMember.user_id == User.id)
        .group_by(
            User.id,
            User.telegram_id,
            User.username,
            User.first_name,
            User.last_name,
            User.language,
            User.created_at,
        )
        .order_by(User.created_at.desc())
    )
    result = await db.execute(query)
    items = [
        AdminUserRow(
            id=row.id,
            telegram_id=row.telegram_id,
            username=row.username,
            first_name=row.first_name,
            last_name=row.last_name,
            language=row.language,
            created_at=row.created_at,
            businesses_count=row.businesses_count,
        )
        for row in result
    ]
    return AdminUsersResponse(items=items)


@router.get("/system/readiness", response_model=AdminSystemReadinessResponse)
async def get_system_readiness(
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> AdminSystemReadinessResponse:
    return AdminSystemReadinessResponse.model_validate(
        (await ReadinessService(db, settings).build_report()).model_dump()
    )


@router.get("/telegram/status", response_model=TelegramBotStatusResponse)
async def get_telegram_status(
    _: User = Depends(require_platform_admin),
    settings: Settings = Depends(get_app_settings),
) -> TelegramBotStatusResponse:
    return await BotService(settings).get_runtime_status()


@router.post("/telegram/setup/sync", response_model=TelegramBotActionResponse)
async def sync_telegram_setup(
    _: User = Depends(require_platform_admin),
    settings: Settings = Depends(get_app_settings),
) -> TelegramBotActionResponse:
    return await BotService(settings).sync_setup()


@router.post("/telegram/webhook/sync", response_model=TelegramBotActionResponse)
async def sync_telegram_webhook(
    _: User = Depends(require_platform_admin),
    settings: Settings = Depends(get_app_settings),
) -> TelegramBotActionResponse:
    return await BotService(settings).sync_webhook()


@router.delete("/telegram/webhook", response_model=TelegramBotActionResponse)
async def clear_telegram_webhook(
    _: User = Depends(require_platform_admin),
    settings: Settings = Depends(get_app_settings),
) -> TelegramBotActionResponse:
    return await BotService(settings).clear_webhook()


@router.post("/telegram/commands/sync", response_model=TelegramBotActionResponse)
async def sync_telegram_commands(
    _: User = Depends(require_platform_admin),
    settings: Settings = Depends(get_app_settings),
) -> TelegramBotActionResponse:
    return await BotService(settings).sync_commands()
