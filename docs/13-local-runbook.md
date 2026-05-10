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

Important for lead notes:
- If `POST /api/v1/leads/{uid}/notes` returns `LEAD_NOTES_NOT_READY`, run the two commands above again and restart `npm run dev`.

Important for automation scenarios:
- `automation_scenarios` and `automation_runs` are created by the same migration deploy step.
- If automation endpoints fail with schema errors, rerun:
  - `npm run prisma:migrate:deploy`
  - `npm run prisma:generate`

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
5. automation scenarios list
6. automation runs read
7. automation dry-run
8. task `create`
9. task `done`
10. read events
11. ingest idempotency (`website_form`, `api`)
12. early-access submit + filtered stats/comparisons query

## 7) One-pass quality gate

Run everything in one command:

```powershell
npm run quality:week3
```

This runs:
- `lint`
- `build`
- `integration e2e`

## 7.1) Wave A pre-review gate

For CRM core feature blocks, use:

```powershell
npm run quality:wave-a
```

This includes:
- `lint`
- `build`
- `integration e2e`
- copy-quality scan for broken text encoding artifacts

## 8) Admin Survey intent

`/admin/survey` is **analytics-first**, not processing workflow:
- priority is majority/comparative insight (winner/share/margin by question);
- breakdowns and recent submissions are secondary supporting views.

## 9) Automation V1 scope

`/app/settings` now includes `Automation` tab:
- simple `When / If / Then` wizard on scenario cards;
- enable/disable scenarios;
- dry-run test for selected lead (no mutations);
- last run status (`succeeded | failed | skipped`) and error.

Current V1 limits:
- immediate reactions only (no delayed scheduler jobs);
- at most 2 enabled conditions per scenario;
- linear action chain only.

## 10) Stop local Postgres

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
- `LEAD_NOTES_NOT_READY` on notes create:
  - `npm run prisma:migrate:deploy`
  - `npm run prisma:generate`
  - restart `npm run dev`
