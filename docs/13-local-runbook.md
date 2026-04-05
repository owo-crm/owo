# Local Runbook (Week 3)

This runbook is for `C:\dev\OWOcrm` only.
Execution mode: **one-pass local functional validation** (no preview/deploy focus).

## 1) Install deps

```powershell
cd C:\dev\OWOcrm
npm install
```

## 2) Start local Postgres

```powershell
npm run db:start
```

Notes:
- The script uses `.local-postgres/data` in the repo.
- Default endpoint: `127.0.0.1:5433`, db `owocrm`, user `owocrm`.

## 3) Run migrations + Prisma client

```powershell
npm run prisma:migrate:deploy
npm run prisma:generate
```

## 4) Seed MVP demo data

```powershell
npm run db:seed
```

Seed currently creates:
- 1 demo business (`owo-demo`)
- owner membership
- canonical lead statuses
- 5 ingestion sources
- 5 demo leads
- 3 open tasks
- seed marker event

## 5) Start app

```powershell
npm run dev
```

Open:
- `http://127.0.0.1:3000/` (landing)
- `http://127.0.0.1:3000/app` (product shell)

## 6) Week 3 e2e smoke

In a second terminal while app is running:

```powershell
cd C:\dev\OWOcrm
npm run week3:e2e
```

or:

```powershell
npm run test:integration
```

Expected flow:
1. `auth/validate`
2. lead `create`
3. lead `merge` (dedupe)
4. lead `patch`
5. task `create`
6. task `done`
7. read events
8. ingest idempotency (`website_form`, `api`)
9. early-access submit + filtered stats/comparisons query

## 7) One-pass quality gate

Run everything in one command:

```powershell
npm run quality:week3
```

This runs:
- `lint`
- `build`
- `integration e2e`

## 8) Admin Survey intent

`/admin/survey` is **analytics-first**, not processing workflow:
- priority is majority/comparative insight (winner/share/margin by question);
- breakdowns and recent submissions are secondary supporting views.

## 9) Stop local Postgres

```powershell
npm run db:stop
```

## Troubleshooting

- `AUTH_VALIDATE_FAILED`:
  - Check `DATABASE_URL` and that Postgres is reachable.
- `UNAUTHORIZED` on survey stats:
  - Add `EARLY_ACCESS_STATS_TOKEN` and pass token in query/header.
- Port `3000` busy:
  - Stop existing listener before running local smoke scripts.
