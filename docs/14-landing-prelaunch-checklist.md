# Landing Prelaunch Checklist (Lead Capture Mode)

This checklist is for the current phase where landing is used to collect and qualify early-access submissions.

## 1) Runtime readiness

- `DATABASE_URL` points to production Postgres.
- `AUTH_TOKEN_SECRET` set (24+ chars).
- `RESEND_API_KEY` and `RESEND_FROM` are valid.
- `EARLY_ACCESS_NOTIFY_TO` set to active team inboxes.
- `EARLY_ACCESS_SEND_CONFIRMATION=true`.
- `EARLY_ACCESS_STATS_TOKEN` set and stored securely.

## 2) Data and API smoke

- Run migrations: `npm run prisma:migrate:deploy`.
- Confirm `/api/early-access` accepts submit and returns `ok: true`.
- Confirm `/api/early-access/stats` is protected and accessible with token.
- Confirm DB rows appear in:
  - `survey_submissions`
  - `email_outbox`

## 3) Email delivery smoke

- Submit one test record with team email and a real user inbox.
- Verify both directions:
  - team notification sent
  - user confirmation sent
- Verify `email_outbox.status` transitions to `sent` (or `failed` with clear error).

## 4) Mobile UX smoke (critical)

- iPhone/Android common widths:
  - no horizontal overflow
  - no cut-off controls
  - step progress and controls visible
- `acquisitionChannel=Other` requires text before next/submit.
- EN default loads correctly; `?lang=pl` switches copy.

## 5) Analytics sanity

- Stats page shows:
  - totals
  - qualification slices
  - acquisition source breakdown
- Value labels are human-readable (not only raw codes).

## 6) Launch guardrails

- Keep one rollback point (previous deployment).
- Capture first 20 live submissions and validate:
  - data completeness
  - source distribution
  - email delivery success rate
- If delivery errors appear, disable confirmation temporarily via env and keep team notifications on.
