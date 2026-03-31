# Production Readiness

This project is now ready for a first practical production pass without enabling client email.

## 1. Minimum environment

Set these values before real deployment:

```env
BASE_URL=https://your-public-api-domain
MINI_APP_URL=https://your-public-miniapp-domain
BOT_TOKEN=...
BOT_WEBHOOK_SECRET=...
JWT_SECRET=...
PLATFORM_ADMIN_TELEGRAM_IDS=123456789
```

If attachments should stay production-safe, use S3-compatible storage:

```env
ATTACHMENTS_STORAGE_BACKEND=s3
ATTACHMENTS_S3_BUCKET=...
ATTACHMENTS_S3_REGION=auto
ATTACHMENTS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
ATTACHMENTS_S3_ACCESS_KEY_ID=...
ATTACHMENTS_S3_SECRET_ACCESS_KEY=...
ATTACHMENTS_S3_FORCE_PATH_STYLE=true
```

## 2. Readiness checks

Public health endpoints:

- `GET /health`
- `GET /health/ready`

Platform admin endpoint:

- `GET /api/v1/admin/system/readiness`

Local script:

```powershell
cd backend
.\.venv\Scripts\python scripts\production_readiness_check.py
```

## 3. Telegram bot setup

Once `BASE_URL`, `MINI_APP_URL`, `BOT_TOKEN`, and `BOT_WEBHOOK_SECRET` are configured:

1. Open Barowo as a platform admin.
2. Go to `Settings -> Admin`.
3. Review `System readiness`.
4. Use `Sync full setup` in the Telegram block.

That action will:

- sync webhook
- sync bot commands
- set the Mini App menu button

## 4. Current runtime policy

- internal Telegram delivery is ready
- client email is still foundation-only
- no automatic client email should be enabled yet because real lead emails exist in the database

## 5. Recommended next production steps

1. Finish real S3/R2 setup.
2. Deploy backend behind public HTTPS.
3. Deploy miniapp behind public HTTPS.
4. Run readiness check.
5. Sync Telegram setup from admin.
6. Do a smoke test:
   - Mini App auth
   - lead creation
   - task creation/completion
   - event log
   - Telegram inbox/commands
   - attachment upload/open
