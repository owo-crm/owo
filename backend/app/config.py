import json
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ROOT_ENV_FILE = PROJECT_ROOT / ".env"
BACKEND_ENV_FILE = PROJECT_ROOT / "backend" / ".env"


class Settings(BaseSettings):
    bot_token: str = ""
    bot_webhook_secret: str = ""
    mini_app_url: str = ""
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/barowo_crm"
    google_service_account_json: str = ""
    google_service_account_email: str = ""
    paypal_client_id: str = ""
    paypal_secret: str = ""
    paypal_plan_id: str = ""
    paypal_webhook_id: str = ""
    base_url: str = "http://localhost:8000"
    jwt_secret: str = "change-me"
    environment: str = "development"
    platform_admin_telegram_ids: str = ""
    uploads_dir: str = str(PROJECT_ROOT / "backend" / "uploads")
    attachments_storage_backend: str = "local"
    attachments_s3_bucket: str = ""
    attachments_s3_region: str = "auto"
    attachments_s3_endpoint_url: str = ""
    attachments_s3_access_key_id: str = ""
    attachments_s3_secret_access_key: str = ""
    attachments_s3_presigned_ttl_seconds: int = 3600
    attachments_s3_force_path_style: bool = False
    email_provider: str = ""
    email_from_address: str = ""
    email_from_name: str = ""
    email_reply_to: str = ""
    resend_api_key: str = ""
    cors_allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), str(BACKEND_ENV_FILE)),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    def google_service_account_dict(self) -> dict:
        raw_value = self.google_service_account_json.strip()
        if not raw_value:
            return {}

        json_path = Path(raw_value)
        if json_path.exists():
            return json.loads(json_path.read_text(encoding="utf-8"))

        return json.loads(raw_value)

    def platform_admin_ids(self) -> set[int]:
        items = [item.strip() for item in self.platform_admin_telegram_ids.split(",")]
        return {int(item) for item in items if item}

    def cors_origins(self) -> list[str]:
        items = [item.strip() for item in self.cors_allowed_origins.split(",") if item.strip()]
        return items or ["http://127.0.0.1:5173", "http://localhost:5173"]

    def is_base_url_public_https(self) -> bool:
        base_url = self.base_url.strip()
        if not base_url:
            return False
        parsed = urlparse(base_url)
        hostname = (parsed.hostname or "").lower()
        if parsed.scheme != "https":
            return False
        return hostname not in {"localhost", "127.0.0.1", "0.0.0.0"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
