import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.system import SystemReadinessResponse


class AdminUserRow(BaseModel):
    id: uuid.UUID
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language: str
    created_at: datetime
    businesses_count: int


class AdminUsersResponse(BaseModel):
    items: list[AdminUserRow]


class TelegramBotStatusResponse(BaseModel):
    configured: bool
    base_url: str | None = None
    base_url_public: bool
    mini_app_url: str | None = None
    mini_app_configured: bool
    bot_id: int | None = None
    bot_username: str | None = None
    bot_display_name: str | None = None
    webhook_url: str | None = None
    expected_webhook_url: str | None = None
    webhook_matches_expected: bool = False
    webhook_has_secret: bool = False
    pending_update_count: int = 0
    last_error_message: str | None = None
    commands_count: int = 0
    commands_match_expected: bool = False
    menu_button_configured: bool = False
    menu_button_matches_expected: bool = False
    setup_ready: bool = False
    recommended_next_step: str | None = None


class TelegramBotActionResponse(BaseModel):
    ok: bool
    action: str
    message: str
    status: TelegramBotStatusResponse


class AdminSystemReadinessResponse(SystemReadinessResponse):
    pass
