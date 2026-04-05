# API Contracts

Status: Active  
Owner: Backend  
Last updated: 2026-04-02

## Contract Rules

- All operational APIs are business-scoped unless explicitly platform-level.
- Telegram-backed auth remains the current identity path.
- One backend domain core serves both Web and Telegram surfaces.
- Contracts preserve product semantics first and implementation convenience
  second.
- Business logic must not fork by client surface.

## Auth

Base route group:
- `/api/v1/auth`

### `POST /api/v1/auth/validate`

Purpose:
- validate Telegram Mini App `initData` or debug init data
- create/update user
- resolve accessible businesses
- resolve active business
- mint bearer token

Canonical response shape:
- authenticated user
- accessible businesses
- `active_business_id`
- token

Current Week 3 implementation note:
- supports Telegram `initData` parsing path
- supports controlled dev bypass path for local bootstrap

## Business Context

Base route group:
- `/api/v1/businesses`

Primary routes:
- `GET /api/v1/businesses`
- `POST /api/v1/businesses`
- `PATCH /api/v1/businesses/{business_id}`
- `GET /api/v1/businesses/{business_id}/members`
- `GET /api/v1/businesses/{business_id}/lead-statuses`
- `PUT /api/v1/businesses/{business_id}/lead-statuses`

Canonical scope:
- business metadata
- team membership visibility
- lead stage catalog
- business-scoped settings blocks

## Lead Source Setup And Ingestion

Lead intake is one canonical pipeline with multiple entry channels.

Current canonical source families:
- manual create
- Google Sheet
- website form
- API ingestion

### Google Sheet setup and sync

These routes belong to business setup, not to a separate import subsystem.

Primary routes:
- `POST /api/v1/businesses/{business_id}/verify-sheet`
- `GET /api/v1/businesses/{business_id}/sheet-tabs`
- `GET /api/v1/businesses/{business_id}/sheet-mapping/suggestions`
- `PUT /api/v1/businesses/{business_id}/sheet-mapping`
- `POST /api/v1/businesses/{business_id}/sync-sheet`

Canonical response semantics for sync:
- human-readable result message
- processed, created, updated, and skipped counts
- skipped reason summary
- last sync timestamp

### Website form and API ingestion

These routes belong to lead ingestion, not to a separate CRM branch.

Primary route families:
- `POST /api/v1/ingest/website-form/{source_key}`
- `POST /api/v1/ingest/api/{source_key}`

Canonical behavior:
- validate source identity
- map source fields into canonical lead fields
- run normal dedupe logic
- emit the same downstream events and automation side effects as manual and
  sheet-created leads

Canonical response semantics:
- accepted or rejected result
- dedupe-aware lead outcome
- optional warnings for partial field mapping or missing optional context

Current Week 3 implementation note:
- idempotency is enforced per source key and idempotency hash before lead write

## Leads

Base route group:
- `/api/v1/leads`

Primary routes:
- `GET /api/v1/leads`
- `POST /api/v1/leads`
- `GET /api/v1/leads/{uid}`
- `PATCH /api/v1/leads/{uid}`
- `DELETE /api/v1/leads/{uid}`

Canonical behavior:
- list supports filtering by status, assignment, scope, search, and sort
- create may merge into an existing lead because dedupe is canonical behavior
- detail returns the full lead context used by operators
- update may emit events and downstream automation side effects

Current Week 3 implementation note:
- list/detail responses include next-task projection for operational visibility

## Tasks

Base route group:
- `/api/v1/tasks`

Primary routes:
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/{task_id}`
- `DELETE /api/v1/tasks/{task_id}`
- `POST /api/v1/tasks/{task_id}/done`

Canonical behavior:
- open/done state is derived from `done_at`
- task actions are event-producing domain actions

Current Week 3 implementation note:
- `POST /api/v1/tasks/{task_id}/done` writes `done_at` and emits `task.done`

## Events

Base route group:
- `/api/v1/events`

Primary routes:
- `GET /api/v1/events`

Canonical audience:
- management
- automation debugging
- operational visibility

Current Week 3 implementation note:
- event list currently ships as read-only operational feed for shell stats/debug

## Team

Base route group:
- `/api/v1/team`

Primary routes:
- `GET /api/v1/team`
- `POST /api/v1/team/invite`
- `PATCH /api/v1/team/{user_id}/role`
- `DELETE /api/v1/team/{user_id}`

Canonical behavior:
- business-scoped membership management
- role and custom-permission updates

## Attachments

Primary routes:
- `GET /api/v1/attachments`
- `POST /api/v1/attachments`
- `DELETE /api/v1/attachments/{attachment_id}`
- `GET /api/v1/attachments/{attachment_id}/content`

Canonical rule:
- attachment content is accessed separately from main lead payloads

## Finance

### Expenses

Primary routes:
- `GET /api/v1/expenses`
- `GET /api/v1/expenses/recurring-plans`
- `POST /api/v1/expenses`
- `PATCH /api/v1/expenses/{expense_id}`
- `POST /api/v1/expenses/{expense_id}/pause`
- `POST /api/v1/expenses/{expense_id}/resume`
- `POST /api/v1/expenses/{expense_id}/archive`
- `DELETE /api/v1/expenses/{expense_id}`

### Incomes

Primary routes:
- `GET /api/v1/incomes`
- `POST /api/v1/incomes`
- `PATCH /api/v1/incomes/{income_id}`
- `DELETE /api/v1/incomes/{income_id}`

### Stats

Primary routes:
- `GET /api/v1/stats/summary`
- `GET /api/v1/stats/by_period`
- `GET /api/v1/stats/expenses`

## Inventory

Base route group:
- `/api/v1/inventory`

Primary routes:
- `GET /api/v1/inventory/items`
- `POST /api/v1/inventory/items`
- `PATCH /api/v1/inventory/items/{item_id}`
- `GET /api/v1/inventory/movements`
- `POST /api/v1/inventory/items/{item_id}/movements`
- `GET /api/v1/inventory/requirements`
- `POST /api/v1/inventory/requirements`
- `PATCH /api/v1/inventory/requirements/{requirement_id}`
- `DELETE /api/v1/inventory/requirements/{requirement_id}`
- `GET /api/v1/inventory/templates`
- `POST /api/v1/inventory/templates`
- `PATCH /api/v1/inventory/templates/{template_id}`
- `DELETE /api/v1/inventory/templates/{template_id}`
- `POST /api/v1/inventory/templates/{template_id}/apply`

## Platform And Secondary Ops

The current backend also includes:
- admin
- billing/payments
- webhook-oriented routes

These matter for context, but they should not distort the MVP core contract
pack.

## Cross-Surface Rules

The following must remain true in implementation:

1. Web and Telegram Mini App use the same backend core.
2. permissions are server-enforced, not UI-only
3. sheet sync stays a setup flow, not a daily operator dashboard
4. all ingestion channels converge into the same lead-domain behavior
5. event generation remains downstream of domain services, not route handlers
6. response wording may evolve, but route intent should stay stable
