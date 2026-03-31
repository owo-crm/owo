from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.schemas.system import ReadinessCheckResult, SystemReadinessResponse


class ReadinessService:
    def __init__(self, db: AsyncSession, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    async def build_report(self) -> SystemReadinessResponse:
        checks: list[ReadinessCheckResult] = [
            await self._check_database(),
            self._check_base_url(),
            self._check_bot(),
            self._check_mini_app_url(),
            self._check_attachment_storage(),
        ]
        overall = "ok"
        if any(check.status == "fail" for check in checks):
            overall = "fail"
        elif any(check.status == "warn" for check in checks):
            overall = "warn"

        return SystemReadinessResponse(
            status=overall,
            environment=self.settings.environment,
            base_url=self.settings.base_url.strip() or None,
            base_url_public=self.settings.is_base_url_public_https(),
            mini_app_url=self.settings.mini_app_url.strip() or None,
            checks=checks,
        )

    async def _check_database(self) -> ReadinessCheckResult:
        try:
            await self.db.execute(text("SELECT 1"))
        except Exception as exc:
            return ReadinessCheckResult(name="database", status="fail", detail=f"Database connection failed: {exc}")
        return ReadinessCheckResult(name="database", status="ok", detail="Database connection is healthy.")

    def _check_base_url(self) -> ReadinessCheckResult:
        base_url = self.settings.base_url.strip()
        if not base_url:
            return ReadinessCheckResult(name="base_url", status="fail", detail="BASE_URL is missing.")
        if not self.settings.is_base_url_public_https():
            return ReadinessCheckResult(
                name="base_url",
                status="warn",
                detail="BASE_URL is not a public HTTPS URL yet.",
            )
        return ReadinessCheckResult(name="base_url", status="ok", detail="BASE_URL is public HTTPS.")

    def _check_bot(self) -> ReadinessCheckResult:
        if not self.settings.bot_token:
            return ReadinessCheckResult(name="telegram_bot", status="warn", detail="BOT_TOKEN is missing.")
        if not self.settings.bot_webhook_secret:
            return ReadinessCheckResult(
                name="telegram_bot",
                status="warn",
                detail="BOT_WEBHOOK_SECRET is missing. Webhook can work, but it is not secret-protected.",
            )
        return ReadinessCheckResult(name="telegram_bot", status="ok", detail="Telegram bot credentials are configured.")

    def _check_mini_app_url(self) -> ReadinessCheckResult:
        if not self.settings.mini_app_url.strip():
            return ReadinessCheckResult(
                name="mini_app_url",
                status="warn",
                detail="MINI_APP_URL is missing. Telegram menu button cannot open the Mini App yet.",
            )
        return ReadinessCheckResult(name="mini_app_url", status="ok", detail="MINI_APP_URL is configured.")

    def _check_attachment_storage(self) -> ReadinessCheckResult:
        backend = self.settings.attachments_storage_backend.lower()
        if backend == "local":
            uploads_dir = Path(self.settings.uploads_dir)
            try:
                uploads_dir.mkdir(parents=True, exist_ok=True)
            except Exception as exc:
                return ReadinessCheckResult(
                    name="attachment_storage",
                    status="fail",
                    detail=f"Local uploads directory is not writable: {exc}",
                )
            return ReadinessCheckResult(
                name="attachment_storage",
                status="warn",
                detail="Attachments are still on local storage. Good for dev, not ideal for production.",
            )

        missing = [
            name
            for name, value in (
                ("ATTACHMENTS_S3_BUCKET", self.settings.attachments_s3_bucket),
                ("ATTACHMENTS_S3_ACCESS_KEY_ID", self.settings.attachments_s3_access_key_id),
                ("ATTACHMENTS_S3_SECRET_ACCESS_KEY", self.settings.attachments_s3_secret_access_key),
            )
            if not value
        ]
        if missing:
            return ReadinessCheckResult(
                name="attachment_storage",
                status="fail",
                detail=f"S3 storage selected but missing: {', '.join(missing)}",
            )
        return ReadinessCheckResult(
            name="attachment_storage",
            status="ok",
            detail="S3-compatible attachment storage is configured.",
        )
