from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import SessionLocal
from app.services.monitoring_service import MonitoringService


scheduler = AsyncIOScheduler()


async def run_operational_checks() -> None:
    async with SessionLocal() as db:
        service = MonitoringService(db)
        await service.materialize_recurring_expenses()
        await service.scan_overdue_tasks()
        await service.process_pending_event_deliveries()


def _configure_jobs() -> None:
    scheduler.add_job(
        run_operational_checks,
        "interval",
        minutes=15,
        id="operational-checks",
        replace_existing=True,
        max_instances=1,
    )


@asynccontextmanager
async def scheduler_lifespan():
    if not scheduler.running:
        _configure_jobs()
        scheduler.start()
    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)
