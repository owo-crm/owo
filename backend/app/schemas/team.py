import uuid

from pydantic import BaseModel, Field

from app.schemas.common import BusinessMemberUserOut


class TeamInviteCreate(BaseModel):
    telegram_id: int
    role: str = "member"
    position: str | None = None
    custom_permissions: list[str] = Field(default_factory=list)


class TeamRoleUpdate(BaseModel):
    role: str
    position: str | None = None
    custom_permissions: list[str] = Field(default_factory=list)


class TeamMembersResponse(BaseModel):
    items: list[BusinessMemberUserOut]


class TeamActionResponse(BaseModel):
    item: BusinessMemberUserOut
    message: str


class TeamDeleteResponse(BaseModel):
    deleted_user_id: uuid.UUID
    message: str
