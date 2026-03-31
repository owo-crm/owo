import uuid
from datetime import UTC, datetime
from fastapi import Depends, Header, HTTPException, Query, Request, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db_session
from app.models.business_member import BusinessMember
from app.models.subscription import Subscription
from app.models.user import User
from app.services.user_service import UserService


async def get_db(db: AsyncSession = Depends(get_db_session)) -> AsyncSession:
    return db


def get_app_settings() -> Settings:
    return get_settings()


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing user_id")

    user = await UserService(db).get_by_id(uuid.UUID(str(user_id)))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User from token was not found")

    return user


async def get_business_id(
    request: Request,
    query_business_id: uuid.UUID | None = Query(default=None, alias="business_id"),
) -> uuid.UUID:
    if query_business_id:
        return query_business_id

    path_value = request.path_params.get("business_id")
    if path_value:
        return uuid.UUID(str(path_value))

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="business_id is required")


async def require_active_sub(
    business_id: uuid.UUID = Depends(get_business_id),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> uuid.UUID:
    member_query = select(BusinessMember).where(
        BusinessMember.business_id == business_id,
        BusinessMember.user_id == current_user.id,
    )
    member_result = await db.execute(member_query)
    member = member_result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this business")

    subscription_query = select(Subscription).where(Subscription.business_id == business_id)
    subscription_result = await db.execute(subscription_query)
    subscription = subscription_result.scalar_one_or_none()
    if subscription is None:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Subscription not found")

    now = datetime.now(UTC)
    if subscription.plan == "trial" and subscription.trial_ends_at and subscription.trial_ends_at < now:
        subscription.status = "expired"
        await db.commit()
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="trial_expired")

    if subscription.plan == "monthly" and subscription.status != "active":
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="subscription_inactive")

    return business_id


async def require_platform_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_platform_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Platform admin access required")
    return current_user


def require_role(*allowed_roles: str):
    async def _dependency() -> tuple[str, ...]:
        return allowed_roles

    return _dependency
