import uuid

from app.config import Settings
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserService:
    def __init__(self, db: AsyncSession, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.db.get(User, user_id)

    async def get_or_create_from_telegram(self, telegram_user: dict) -> User:
        telegram_id = int(telegram_user["id"])
        query = select(User).where(
            or_(User.telegram_id == telegram_id, User.username == telegram_user.get("username"))
        )
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                telegram_id=telegram_id,
                username=telegram_user.get("username"),
                first_name=telegram_user.get("first_name"),
                last_name=telegram_user.get("last_name"),
                language=telegram_user.get("language_code") or "en",
                is_platform_admin=self._is_platform_admin(telegram_id),
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            return user

        user.username = telegram_user.get("username") or user.username
        user.first_name = telegram_user.get("first_name") or user.first_name
        user.last_name = telegram_user.get("last_name") or user.last_name
        user.language = telegram_user.get("language_code") or user.language or "en"
        user.is_platform_admin = self._is_platform_admin(telegram_id)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    def _is_platform_admin(self, telegram_id: int) -> bool:
        if self.settings is None:
            return False
        return telegram_id in self.settings.platform_admin_ids()
