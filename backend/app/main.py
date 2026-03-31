from pathlib import Path

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import Settings, get_settings
from app.database import get_db_session
from app.schemas.system import SystemReadinessResponse
from app.services.readiness_service import ReadinessService
from app.routers.attachments import router as attachments_router
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.businesses import router as businesses_router
from app.routers.events import router as events_router
from app.routers.expenses import router as expenses_router
from app.routers.incomes import router as incomes_router
from app.routers.inventory import router as inventory_router
from app.routers.leads import router as leads_router
from app.routers.paypal import router as paypal_router
from app.routers.stats import router as stats_router
from app.routers.tasks import router as tasks_router
from app.routers.team import router as team_router
from app.routers.webhook import router as webhook_router
from app.scheduler import scheduler_lifespan


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with scheduler_lifespan():
        yield


app = FastAPI(title="Barowo CRM API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"], response_model=SystemReadinessResponse)
async def readinesscheck() -> SystemReadinessResponse:
    settings: Settings = get_settings()
    async for db in get_db_session():
        return await ReadinessService(db, settings).build_report()
    raise RuntimeError("Database session is unavailable for readiness check")


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(businesses_router)
app.include_router(events_router)
app.include_router(leads_router)
app.include_router(tasks_router)
app.include_router(stats_router)
app.include_router(expenses_router)
app.include_router(incomes_router)
app.include_router(inventory_router)
app.include_router(team_router)
app.include_router(attachments_router)
app.include_router(paypal_router)
app.include_router(webhook_router)

uploads_dir = Path(get_settings().uploads_dir)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
