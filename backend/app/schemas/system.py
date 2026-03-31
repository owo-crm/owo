from pydantic import BaseModel


class ReadinessCheckResult(BaseModel):
    name: str
    status: str
    detail: str


class SystemReadinessResponse(BaseModel):
    status: str
    environment: str
    base_url: str | None = None
    base_url_public: bool
    mini_app_url: str | None = None
    checks: list[ReadinessCheckResult]
