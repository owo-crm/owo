# Staging Review Checklist

Use this checklist before asking another person to review the product.

## 1. Minimum staging prerequisites

The following must exist first:

- public HTTPS backend URL
- public HTTPS Mini App URL
- Telegram bot token
- Telegram webhook secret
- platform admin Telegram ID

Optional but strongly recommended:

- S3/R2 attachment storage

## 2. Environment values to prepare

At minimum:

```env
BASE_URL=https://your-public-api-domain
MINI_APP_URL=https://your-public-miniapp-domain
BOT_TOKEN=...
BOT_WEBHOOK_SECRET=...
JWT_SECRET=...
PLATFORM_ADMIN_TELEGRAM_IDS=123456789
```

For production-safe attachments:

```env
ATTACHMENTS_STORAGE_BACKEND=s3
ATTACHMENTS_S3_BUCKET=...
ATTACHMENTS_S3_REGION=auto
ATTACHMENTS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
ATTACHMENTS_S3_ACCESS_KEY_ID=...
ATTACHMENTS_S3_SECRET_ACCESS_KEY=...
ATTACHMENTS_S3_FORCE_PATH_STYLE=true
```

## 3. Before inviting a reviewer

Run:

```powershell
cd backend
.\.venv\Scripts\python scripts\production_readiness_check.py
```

Also verify:

- `GET /health`
- `GET /health/ready`

Then, as platform admin:

1. Open Mini App
2. Go to `Settings -> Admin`
3. Open `System readiness`
4. Use `Sync full setup` in the Telegram block

## 4. Smoke test before review

Complete this flow first.

### Auth and workspace

- Mini App opens
- auth works
- active workspace is selected

### Leads

- lead list loads
- search works
- stage filters work
- creating a lead works
- duplicate-safe creation behaves correctly

### Lead details

- lead details open
- status changes save
- owner changes save
- history loads
- attachments open correctly

### Tasks

- create task
- assign task
- complete task
- task updates appear consistently in `Tasks` and dashboard calendar

### Dashboard

- calendar loads
- money tabs load
- create income
- create expense
- recurring plans show correctly

### Inventory

- inventory tab opens if enabled
- stock item creation works
- movement creation works
- templates work

### Telegram

- `/start` works
- `/help` works
- `/inbox` works
- `/today` works
- `/tasks` works
- `/leads` works

## 5. Important runtime policy

Do **not** enable live client email during review.

Reason:

- there are real lead emails in the database
- review should stay internal-only

Email remains foundation-only until explicitly approved later.

## 6. What the reviewer should focus on

Ask them to pay attention to:

- missing CRM features
- awkward workflow
- duplicated information
- logic that feels too strict or too hidden
- what would block real daily use

## 7. What not to over-focus on yet

Do not spend the review mostly on:

- final colors
- typography polish
- final branding
- small spacing issues

Those matter, but the bigger value right now is finding:

- product gaps
- process gaps
- business logic gaps

## 8. Suggested review output format

Ask the reviewer to group feedback like this:

1. Must have before real usage
2. Important but can wait
3. Nice to have
4. Pure design polish

That will make the next “full finish” phase much easier.
