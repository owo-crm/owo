from collections.abc import Sequence

from app.config import Settings


class EmailService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return bool(self.settings.email_provider and self.settings.email_from_address)

    async def deliver_event(
        self,
        *,
        event_type: str,
        payload: dict,
        recipients: Sequence[str] | None = None,
    ) -> bool:
        return False
