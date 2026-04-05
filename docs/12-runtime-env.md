# Runtime Env Variables (Week 3)

This file is the canonical runtime env map for local/dev use in `OWOcrm`.

## Core Backend

- `DATABASE_URL` (required)
  - Postgres connection string used by Prisma and API runtime.
  - Local default used in this repo:
    - `postgresql://owocrm@127.0.0.1:5433/owocrm?schema=public`

- `AUTH_TOKEN_SECRET` (required in production, optional local)
  - HMAC secret for auth tokens (`/api/v1/auth/validate` session token).
  - Must be at least 24 chars in production.

- `AUTH_TOKEN_TTL_SECONDS` (optional)
  - Session token TTL in seconds.
  - Default: `86400`.

- `DEV_AUTH_BYPASS_TOKEN` (optional)
  - Enables debug bypass in production mode only if request header
    `x-dev-auth-token` matches.
  - In local `next dev`, debug bypass is already allowed without this token.

## Landing / Survey / Email

- `RESEND_API_KEY` (required for real email delivery)
- `RESEND_FROM` (required for real email delivery)
  - Example: `OWO CRM <hello@info.owocrm.com>`

- `EARLY_ACCESS_NOTIFY_TO` (optional)
  - Comma-separated team recipients for internal submission notifications.
  - Example: `ops@owocrm.com,founder@owocrm.com`

- `EARLY_ACCESS_SEND_CONFIRMATION` (optional)
  - Sends confirmation email to survey submitter.
  - Accepted truthy values: `1`, `true`, `yes`, `on`

- `EARLY_ACCESS_STATS_TOKEN` (optional but recommended)
  - Protects `/api/early-access/stats` endpoint.
  - Pass via `?token=...` or `x-admin-token` header.

## Local DB Script Overrides

Used by `scripts/db-local.mjs`:

- `OWO_DB_PORT` (default `5433`)
- `OWO_DB_USER` (default `owocrm`)
- `OWO_DB_NAME` (default `owocrm`)

## E2E Script

Used by `scripts/week3-e2e.mjs`:

- `WEEK3_BASE_URL` (default `http://127.0.0.1:3000`)
- `DEV_AUTH_BYPASS_TOKEN` (optional, for protected prod-mode auth testing)
- `EARLY_ACCESS_STATS_TOKEN` (optional; script can also read from `.env.local` / `.env`)
