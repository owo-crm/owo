import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business
from app.models.business_member import BusinessMember
from app.models.lead_status import LeadStatus
from app.models.subscription import Subscription
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.automation import AutomationSettingsOut, default_automation_settings
from app.schemas.business import BusinessCreate, BusinessUpdate
from app.schemas.common import BusinessMemberUserOut
from app.schemas.event import NotificationSettingsOut, default_notification_settings

DEFAULT_STATUSES = [
    {"name": "new", "color": "#3b82f6", "position": 0},
    {"name": "waiting_for_call", "color": "#f59e0b", "position": 1, "requires_follow_up": True},
    {"name": "won", "color": "#22c55e", "position": 2, "is_won": True, "hide_from_active": True},
    {"name": "failed", "color": "#ef4444", "position": 3, "is_lost": True, "hide_from_active": True},
]


class BusinessService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_for_user(self, user_id: uuid.UUID) -> list[Business]:
        query = (
            select(Business)
            .join(BusinessMember, BusinessMember.business_id == Business.id)
            .where(BusinessMember.user_id == user_id)
            .order_by(Business.created_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_for_owner(self, owner: User, payload: BusinessCreate) -> Business:
        business = Business(
            owner_user_id=owner.id,
            name=payload.name,
            business_mode=payload.business_mode,
            sheet_id=payload.sheet_id,
            sheet_verified=False,
            sheet_tab_name="Sheet1",
            sheet_column_mapping=payload.sheet_column_mapping,
            enabled_modules=payload.enabled_modules,
            automation_settings=(payload.automation_settings.model_dump(mode="python") if payload.automation_settings else default_automation_settings()),
            notification_settings=(payload.notification_settings.model_dump(mode="python") if payload.notification_settings else default_notification_settings()),
        )
        self.db.add(business)
        await self.db.flush()

        self.db.add(
            BusinessMember(
                business_id=business.id,
                user_id=owner.id,
                role="owner",
                position="Owner",
                custom_permissions=["billing", "team.manage", "leads.manage", "dashboard.finance"],
            )
        )
        self.db.add(
            Subscription(
                business_id=business.id,
                plan="trial",
                status="active",
                trial_ends_at=datetime.now(UTC) + timedelta(days=7),
            )
        )

        for status_config in DEFAULT_STATUSES:
            self.db.add(
                LeadStatus(
                    business_id=business.id,
                    name=status_config["name"],
                    color=status_config["color"],
                    position=status_config["position"],
                    is_default=True,
                    is_won=status_config.get("is_won", False),
                    is_lost=status_config.get("is_lost", False),
                    requires_follow_up=status_config.get("requires_follow_up", False),
                    hide_from_active=status_config.get("hide_from_active", False),
                )
            )

        session = await self.db.get(UserSession, owner.id)
        if session is None:
            self.db.add(UserSession(user_id=owner.id, active_business_id=business.id))
        else:
            session.active_business_id = business.id

        await self.db.commit()
        await self.db.refresh(business)
        return business

    async def update_business(self, business: Business, payload: BusinessUpdate) -> Business:
        if payload.name is not None:
            business.name = payload.name
        if payload.business_mode is not None:
            business.business_mode = payload.business_mode
        if payload.sheet_id is not None:
            business.sheet_id = payload.sheet_id
            business.sheet_verified = False
        if payload.sheet_tab_name is not None:
            business.sheet_tab_name = payload.sheet_tab_name
        if payload.sheet_column_mapping is not None:
            business.sheet_column_mapping = payload.sheet_column_mapping
        if payload.enabled_modules is not None:
            business.enabled_modules = payload.enabled_modules
        if payload.automation_settings is not None:
            merged_automation_settings = AutomationSettingsOut.model_validate(
                {
                    **default_automation_settings(),
                    **(business.automation_settings or {}),
                    **payload.automation_settings.model_dump(exclude_unset=True, mode="python"),
                }
            )
            business.automation_settings = merged_automation_settings.model_dump(mode="python")
        if payload.notification_settings is not None:
            merged_settings = NotificationSettingsOut.model_validate(
                {
                    **default_notification_settings(),
                    **(business.notification_settings or {}),
                    **payload.notification_settings.model_dump(exclude_unset=True, mode="python"),
                }
            )
            business.notification_settings = merged_settings.model_dump(mode="python")

        await self.db.commit()
        await self.db.refresh(business)
        return business

    async def get_for_user(self, business_id: uuid.UUID, user_id: uuid.UUID) -> Business | None:
        query = (
            select(Business)
            .join(BusinessMember, BusinessMember.business_id == Business.id)
            .where(Business.id == business_id, BusinessMember.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_sheet_mapping(self, business: Business, mapping: dict[str, str | None]) -> Business:
        cleaned_mapping = {key: value for key, value in mapping.items() if value}
        business.sheet_column_mapping = cleaned_mapping
        await self.db.commit()
        await self.db.refresh(business)
        return business

    async def list_members(self, business_id: uuid.UUID) -> list[BusinessMemberUserOut]:
        query = (
            select(BusinessMember, User)
            .join(User, User.id == BusinessMember.user_id)
            .where(BusinessMember.business_id == business_id)
            .order_by(BusinessMember.created_at.asc())
        )
        result = await self.db.execute(query)
        items: list[BusinessMemberUserOut] = []
        for member, user in result.all():
            display_name = (
                " ".join(part for part in [user.first_name, user.last_name] if part).strip()
                or user.username
                or f"User {user.telegram_id}"
            )
            items.append(
                BusinessMemberUserOut(
                    id=member.id,
                    role=member.role,
                    position=member.position,
                    custom_permissions=list(member.custom_permissions or []),
                    user_id=user.id,
                    display_name=display_name,
                    username=user.username,
                    first_name=user.first_name,
                    last_name=user.last_name,
                )
            )
        return items

    async def list_lead_statuses(self, business_id: uuid.UUID) -> list[LeadStatus]:
        result = await self.db.execute(
            select(LeadStatus)
            .where(LeadStatus.business_id == business_id)
            .order_by(LeadStatus.position.asc(), LeadStatus.name.asc())
        )
        return list(result.scalars().all())

    async def replace_lead_statuses(self, business_id: uuid.UUID, items: list[dict]) -> list[LeadStatus]:
        existing = await self.list_lead_statuses(business_id)
        existing_by_id = {status.id: status for status in existing}
        seen_ids: set[uuid.UUID] = set()

        for item in items:
            is_won = item.get("is_won", False)
            is_lost = item.get("is_lost", False) if not is_won else False
            hide_from_active = item.get("hide_from_active", False) or is_won or is_lost
            status_id = item.get("id")
            if status_id and status_id in existing_by_id:
                current = existing_by_id[status_id]
                current.name = item["name"]
                current.color = item.get("color") or "#888888"
                current.position = item["position"]
                current.is_default = item.get("is_default", False)
                current.is_won = is_won
                current.is_lost = is_lost
                current.requires_follow_up = item.get("requires_follow_up", False)
                current.hide_from_active = hide_from_active
                seen_ids.add(status_id)
            else:
                self.db.add(
                    LeadStatus(
                        business_id=business_id,
                        name=item["name"],
                        color=item.get("color") or "#888888",
                        position=item["position"],
                        is_default=item.get("is_default", False),
                        is_won=is_won,
                        is_lost=is_lost,
                        requires_follow_up=item.get("requires_follow_up", False),
                        hide_from_active=hide_from_active,
                    )
                )

        for current in existing:
            if current.id not in seen_ids and all(item.get("id") != current.id for item in items):
                await self.db.delete(current)

        await self.db.commit()
        return await self.list_lead_statuses(business_id)

    async def get_member_role(self, business_id: uuid.UUID, user_id: uuid.UUID) -> str | None:
        result = await self.db.execute(
            select(BusinessMember.role).where(
                BusinessMember.business_id == business_id,
                BusinessMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_member(self, business_id: uuid.UUID, user_id: uuid.UUID) -> BusinessMember | None:
        result = await self.db.execute(
            select(BusinessMember).where(
                BusinessMember.business_id == business_id,
                BusinessMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def count_members_with_role(self, business_id: uuid.UUID, role: str) -> int:
        result = await self.db.execute(
            select(BusinessMember).where(
                BusinessMember.business_id == business_id,
                BusinessMember.role == role,
            )
        )
        return len(list(result.scalars().all()))

    async def invite_member(
        self,
        business_id: uuid.UUID,
        telegram_id: int,
        role: str,
        position: str | None = None,
        custom_permissions: list[str] | None = None,
    ) -> BusinessMemberUserOut:
        user_result = await self.db.execute(select(User).where(User.telegram_id == telegram_id))
        user = user_result.scalar_one_or_none()
        if user is None:
            raise ValueError("User with this Telegram ID was not found. They need to launch the bot first.")

        member_result = await self.db.execute(
            select(BusinessMember).where(
                BusinessMember.business_id == business_id,
                BusinessMember.user_id == user.id,
            )
        )
        member = member_result.scalar_one_or_none()
        if member is None:
            member = BusinessMember(
                business_id=business_id,
                user_id=user.id,
                role=role,
                position=position,
                custom_permissions=custom_permissions or [],
            )
            self.db.add(member)
        else:
            member.role = role
            member.position = position
            member.custom_permissions = custom_permissions or []

        await self.db.commit()
        return await self._member_out(member, user)

    async def update_member_role(
        self,
        business_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
        position: str | None = None,
        custom_permissions: list[str] | None = None,
    ) -> BusinessMemberUserOut | None:
        result = await self.db.execute(
            select(BusinessMember, User)
            .join(User, User.id == BusinessMember.user_id)
            .where(BusinessMember.business_id == business_id, BusinessMember.user_id == user_id)
        )
        row = result.one_or_none()
        if row is None:
            return None
        member, user = row
        member.role = role
        member.position = position
        member.custom_permissions = custom_permissions or []
        await self.db.commit()
        return await self._member_out(member, user)

    async def remove_member(self, business_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(BusinessMember).where(
                BusinessMember.business_id == business_id,
                BusinessMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if member is None:
            return False
        await self.db.delete(member)
        await self.db.commit()
        return True

    async def _member_out(self, member: BusinessMember, user: User) -> BusinessMemberUserOut:
        display_name = (
            " ".join(part for part in [user.first_name, user.last_name] if part).strip()
            or user.username
            or f"User {user.telegram_id}"
        )
        return BusinessMemberUserOut(
            id=member.id,
            role=member.role,
            position=member.position,
            custom_permissions=list(member.custom_permissions or []),
            user_id=user.id,
            display_name=display_name,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
        )

    async def set_sheet_verification(
        self,
        business: Business,
        sheet_id: str,
        verified: bool,
        sheet_tab_name: str | None = None,
    ) -> Business:
        business.sheet_id = sheet_id
        business.sheet_verified = verified
        if sheet_tab_name:
            business.sheet_tab_name = sheet_tab_name
        business.sheet_last_synced_at = None
        if not verified:
            business.sheet_column_mapping = {}
        await self.db.commit()
        await self.db.refresh(business)
        return business

    async def mark_sheet_synced(self, business: Business) -> Business:
        business.sheet_last_synced_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(business)
        return business
