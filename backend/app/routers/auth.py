from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings
from app.dependencies import get_app_settings, get_db
from app.models.business import Business
from app.models.business_member import BusinessMember
from app.models.user_session import UserSession
from app.schemas.auth import AuthValidateRequest, AuthValidateResponse
from app.schemas.common import BusinessOut, UserOut
from app.services.auth_service import (
    create_access_token,
    validate_telegram_init_data as validate_telegram_init_data_payload,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/validate", response_model=AuthValidateResponse)
async def validate_telegram_init_data(
    payload: AuthValidateRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_app_settings),
) -> AuthValidateResponse:
    try:
        telegram_user = validate_telegram_init_data_payload(payload.initData, settings)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = await UserService(db, settings).get_or_create_from_telegram(telegram_user)
    business_query = (
        select(Business)
        .join(BusinessMember, BusinessMember.business_id == Business.id)
        .where(BusinessMember.user_id == user.id)
        .order_by(Business.created_at.asc())
    )
    result = await db.execute(business_query)
    businesses = list(result.scalars().all())

    session = await db.get(UserSession, user.id)
    active_business_id = session.active_business_id if session else (businesses[0].id if businesses else None)

    token = create_access_token(str(user.id), user.telegram_id, settings)
    return AuthValidateResponse(
        user=UserOut.model_validate(user),
        businesses=[BusinessOut.model_validate(business) for business in businesses],
        active_business_id=active_business_id,
        token=token,
    )
