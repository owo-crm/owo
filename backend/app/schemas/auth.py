import uuid

from pydantic import BaseModel

from app.schemas.common import BusinessOut, UserOut


class AuthValidateRequest(BaseModel):
    initData: str


class AuthValidateResponse(BaseModel):
    user: UserOut
    businesses: list[BusinessOut]
    active_business_id: uuid.UUID | None = None
    token: str
