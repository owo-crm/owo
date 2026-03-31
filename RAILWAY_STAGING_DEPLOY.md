# Railway Staging Deploy

This is the simplest way to get Barowo into a public staging state for review.

## Recommended structure

Create **three** Railway services inside one project:

1. `barowo-db`
   Railway Postgres
2. `barowo-backend`
   Root directory: `backend`
3. `barowo-miniapp`
   Root directory: `miniapp`

## 1. Database

Add a Railway Postgres service first.

Copy its connection string into the backend service as:

```env
DATABASE_URL=postgresql+asyncpg://...
```

## 2. Backend service

Use:

- service root: `backend`
- Dockerfile: `backend/Dockerfile`

Required environment:

```env
BASE_URL=https://your-backend-domain.up.railway.app
MINI_APP_URL=https://your-miniapp-domain.up.railway.app
BOT_TOKEN=...
BOT_WEBHOOK_SECRET=...
JWT_SECRET=...
PLATFORM_ADMIN_TELEGRAM_IDS=123456789
DATABASE_URL=postgresql+asyncpg://...
CORS_ALLOWED_ORIGINS=https://your-miniapp-domain.up.railway.app
```

Optional but recommended:

```env
ATTACHMENTS_STORAGE_BACKEND=s3
ATTACHMENTS_S3_BUCKET=...
ATTACHMENTS_S3_REGION=auto
ATTACHMENTS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
ATTACHMENTS_S3_ACCESS_KEY_ID=...
ATTACHMENTS_S3_SECRET_ACCESS_KEY=...
ATTACHMENTS_S3_FORCE_PATH_STYLE=true
```

What happens on start:

- migrations run automatically
- FastAPI starts on Railway `PORT`

## 3. Mini App service

Use:

- service root: `miniapp`
- Dockerfile: `miniapp/Dockerfile`

Required build variable:

```env
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app
```

This value is baked into the frontend build.

## 4. After both services are public

1. Open the backend:
   - `/health`
   - `/health/ready`
2. Open Mini App as platform admin.
3. Go to `Settings -> Admin`.
4. Check `System readiness`.
5. Use `Sync full setup` in the Telegram block.

That action will:

- sync the webhook
- sync the bot commands
- set the Mini App menu button

## 5. Staging safety rules

- do **not** enable live client email
- keep internal Telegram notifications only
- prefer S3/R2 for attachments if staging will be used by real people

## 6. Suggested first staging smoke test

1. Mini App opens
2. Login works
3. Business opens
4. Create a lead
5. Change lead stage
6. Create a task
7. Complete the task
8. Open dashboard
9. Add income and expense
10. Check event log
11. Run `/start`, `/help`, `/inbox`, `/today`, `/tasks`, `/leads`

## 7. If something fails

Check in this order:

1. `GET /health/ready`
2. `Settings -> Admin -> System readiness`
3. backend logs on Railway
4. `Sync full setup` result in admin

## 8. Why Railway here

Railway is a good staging choice for Barowo because:

- easy Postgres
- easy HTTPS public URLs
- good enough for quick internal review
- simple service split for backend and frontend

Official docs:

- [Railway docs](https://docs.railway.com/)
- [Railway Docker deployments](https://docs.railway.com/guides/dockerfiles)
