# OWO CRM Landing

## Local development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Early access form and email
The form submits to `POST /api/early-access`.

Current behavior:
- Saves submission to local JSON files in `data/`.
- Sends internal notification email (and optional user confirmation) via Resend.
- Exposes stats at `GET /api/early-access/stats`.
- Includes admin page at `/admin/survey` (use `?token=...` if token protection is enabled).

Setup:
1. Copy `.env.example` to `.env`.
2. Fill SMTP and inbox values.
3. Restart the dev server.

Required env keys:
- `RESEND_API_KEY`
- `RESEND_FROM`
- `EARLY_ACCESS_NOTIFY_TO`

Optional:
- `EARLY_ACCESS_SEND_CONFIRMATION` (`true`/`false`)
- `EARLY_ACCESS_STATS_TOKEN` (protects stats API/admin page)

## Build checks
```bash
npm run lint
npm run build
```
