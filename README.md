# Barowo CRM

Initial project scaffold based on `barowo_crm_documentation.md`.

## Credentials

Fill local secrets in `.env` using `.env.example` as the template.

## Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Migrations

```powershell
cd backend
.venv\Scripts\python -m alembic upgrade head
```

Healthcheck:

```text
GET http://localhost:8000/health
```

Readiness report:

```text
GET http://localhost:8000/health/ready
```

## Local auth testing

For local development, `POST /api/v1/auth/validate` accepts `initData` in the form `debug:123456`.
This creates or updates a local user with Telegram ID `123456` without requiring a real Telegram Mini App signature.

## Platform admin

To mark a Telegram user as a global platform admin, add their Telegram numeric ID to
`PLATFORM_ADMIN_TELEGRAM_IDS` in `.env`, for example:

```text
PLATFORM_ADMIN_TELEGRAM_IDS=123456789,987654321
```

The backend uses Telegram `telegram_id` from bot or Mini App auth to decide whether to expose the admin panel.

## Production readiness

There is now a production checklist and readiness flow in:

- [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
- [`STAGING_REVIEW_CHECKLIST.md`](./STAGING_REVIEW_CHECKLIST.md)
- [`REVIEW_HANDOFF.md`](./REVIEW_HANDOFF.md)
- [`RAILWAY_STAGING_DEPLOY.md`](./RAILWAY_STAGING_DEPLOY.md)

Quick local readiness script:

```powershell
cd backend
.\.venv\Scripts\python scripts\production_readiness_check.py
```
