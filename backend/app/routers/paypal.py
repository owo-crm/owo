from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, require_active_sub

router = APIRouter(prefix="/api/v1/paypal", tags=["paypal"])


@router.post("/subscribe", response_model=dict)
async def create_paypal_subscription(_: dict = Depends(get_current_user), __: str = Depends(require_active_sub)) -> dict:
    return {"approval_url": "/paypal/approve"}


@router.post("/webhook", response_model=dict)
async def paypal_webhook(payload: dict) -> dict:
    return {"received": True, "event_type": payload.get("event_type")}
