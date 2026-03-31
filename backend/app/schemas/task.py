import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import TaskOut


class TaskCreate(BaseModel):
    business_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    title: str
    description: str | None = None
    deadline: datetime | None = None
    assigned_to: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    lead_id: uuid.UUID | None = None
    title: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    assigned_to: uuid.UUID | None = None
    done_at: datetime | None = None


class TaskListResponse(BaseModel):
    items: list[TaskOut]
