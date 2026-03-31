from __future__ import annotations

import asyncio
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import get_settings
from app.database import get_db_session
from app.services.readiness_service import ReadinessService


async def main() -> None:
    settings = get_settings()
    async for db in get_db_session():
        report = await ReadinessService(db, settings).build_report()
        print(f"Status: {report.status}")
        print(f"Environment: {report.environment}")
        print(f"Base URL: {report.base_url or 'missing'}")
        print(f"Mini App URL: {report.mini_app_url or 'missing'}")
        print("")
        for check in report.checks:
            print(f"[{check.status.upper()}] {check.name}: {check.detail}")
        break


if __name__ == "__main__":
    asyncio.run(main())
