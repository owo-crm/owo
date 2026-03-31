# Barowo CRM — Full Technical Documentation for AI Agents

> **Version:** 1.0  
> **Stack:** Python · FastAPI · PostgreSQL · aiogram 3.x · React (Telegram Mini App) · Railway · PayPal Subscriptions API  
> **Purpose:** This document is the single source of truth for all AI coding agents working on Barowo CRM. Read it entirely before writing any code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [Backend — FastAPI](#4-backend--fastapi)
5. [Telegram Bot — aiogram 3.x](#5-telegram-bot--aiogram-3x)
6. [Telegram Mini App — React](#6-telegram-mini-app--react)
7. [Google Sheets Integration](#7-google-sheets-integration)
8. [PayPal Subscriptions](#8-paypal-subscriptions)
9. [Google Docs / Drive Integration](#9-google-docs--drive-integration)
10. [Scheduler — Background Tasks](#10-scheduler--background-tasks)
11. [Multi-Tenancy & Business Context](#11-multi-tenancy--business-context)
12. [Authentication & Authorization](#12-authentication--authorization)
13. [Localization](#13-localization)
14. [Infrastructure — Railway Deployment](#14-infrastructure--railway-deployment)
15. [Environment Variables](#15-environment-variables)
16. [File & Folder Structure](#16-file--folder-structure)
17. [Key Business Rules](#17-key-business-rules)
18. [MVP Scope & Out-of-Scope](#18-mvp-scope--out-of-scope)
19. [Coding Conventions](#19-coding-conventions)

---

## 1. Project Overview

**Barowo CRM** is a multi-tenant SaaS CRM delivered entirely inside Telegram. It automates lead intake from Facebook Lead Ads via Google Sheets and provides a full CRM workflow via a Telegram Bot and a Telegram Mini App (WebApp).

**Core user flow:**
1. Business owner starts the Telegram Bot → registers → gets 7-day trial.
2. Owner connects their Google Sheet (Facebook Ads buffer) by sharing its ID and granting access to the system service account.
3. Facebook Lead Ads → Google Sheet → Barowo backend → PostgreSQL → Bot notification to all team members.
4. Owner and team manage leads, statistics, tasks in the Telegram Mini App.
5. After trial, owner subscribes via PayPal monthly billing.

**Target scale:** 100+ client businesses from launch.

---

## 2. Architecture Overview

```
Facebook Lead Ads
        │
        ▼
Client's Google Sheet  ◄──── client gives read access to service account
        │
        │  Apps Script onEdit trigger (HTTP POST, near real-time)
        │  + fallback polling every 10 min via APScheduler
        ▼
┌─────────────────────────────────────────────────────┐
│               FastAPI Backend (Railway)              │
│                                                     │
│  /webhook/telegram   ← Telegram Bot updates         │
│  /webhook/sheet/{business_id}  ← Sheet pushes       │
│  /api/v1/*           ← Mini App REST API            │
│                                                     │
│  Services:                                          │
│    LeadService  ─── PostgreSQL (Railway managed)    │
│    BotService   ─── aiogram 3.x                     │
│    SheetService ─── Google Sheets API               │
│    PayPalService ── PayPal REST API                 │
│    SchedulerService ─ APScheduler                   │
└─────────────────────────────────────────────────────┘
        │                        │
        ▼                        ▼
  Telegram Bot              Telegram Mini App
  (aiogram 3.x)             (React + Vite, hosted Railway/Cloudflare Pages)
  notifications, CSV        Leads / Statistics / Tasks / Settings tabs
```

**Key principle:** Every operation is scoped to a `business_id`. A user (identified by `telegram_id`) can own or be a member of multiple businesses. The active business context is stored in the Mini App state and in the bot session.

---

## 3. Database Schema

Use **PostgreSQL** (Railway managed Postgres). Use **SQLAlchemy 2.x async** with **Alembic** for migrations. All timestamps are UTC. UUIDs for primary keys everywhere (use `uuid-ossp` extension).

### 3.1 Table: `users`

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id   BIGINT UNIQUE NOT NULL,
    username      TEXT,
    first_name    TEXT,
    last_name     TEXT,
    language      TEXT NOT NULL DEFAULT 'en',  -- 'en' | 'pl'
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 Table: `businesses`

```sql
CREATE TABLE businesses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    sheet_id         TEXT,                   -- Google Sheet ID provided by client
    sheet_verified   BOOLEAN DEFAULT FALSE,  -- True after successful access check
    sheet_tab_name   TEXT DEFAULT 'Sheet1',  -- Tab name inside the Sheet
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 Table: `subscriptions`

```sql
CREATE TABLE subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan              TEXT NOT NULL DEFAULT 'trial',  -- 'trial' | 'monthly'
    status            TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'cancelled'
    trial_ends_at     TIMESTAMPTZ,
    paypal_sub_id     TEXT,                -- PayPal subscription ID
    current_period_end TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Rule:** When a business is created, immediately insert a `subscriptions` row with `plan='trial'`, `status='active'`, `trial_ends_at = now() + interval '7 days'`.

### 3.4 Table: `business_members`

```sql
CREATE TABLE business_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member'
    invited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id, user_id)
);
```

**Rule:** When a business is created, also insert a `business_members` row for the owner with `role='owner'`.

### 3.5 Table: `leads`

```sql
CREATE TABLE leads (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid              TEXT UNIQUE NOT NULL,        -- 8-char human-readable ID, e.g. "a3f9c1b2"
    business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    -- Core fields from Facebook / manual entry
    name             TEXT,
    phone            TEXT,
    email            TEXT,
    city             TEXT,
    event_date       DATE,
    event_type       TEXT,
    -- CRM fields
    status           TEXT NOT NULL DEFAULT 'new', -- see lead_statuses table or default set
    assigned_to      UUID REFERENCES users(id),
    contract_value   NUMERIC(12,2),
    notes            TEXT,
    next_call_at     TIMESTAMPTZ,
    call_history     JSONB DEFAULT '[]',          -- [{who, at}, ...]
    -- Meta
    source           TEXT DEFAULT 'facebook',     -- 'facebook' | 'manual'
    custom_fields    JSONB DEFAULT '{}',          -- dynamic fields from Sheet columns
    notified_at      TIMESTAMPTZ,                 -- when bot notification was sent
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_business_id ON leads(business_id);
CREATE INDEX idx_leads_status ON leads(business_id, status);
CREATE INDEX idx_leads_created_at ON leads(business_id, created_at);
```

**UID generation:** 8-char hex string from UUID, e.g. `uuid4().hex[:8]`. Must be unique — retry on collision.

### 3.6 Table: `lead_statuses`

```sql
CREATE TABLE lead_statuses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    color        TEXT NOT NULL DEFAULT '#888888',  -- hex color for Mini App UI
    position     INTEGER NOT NULL DEFAULT 0,       -- display order
    is_default   BOOLEAN DEFAULT FALSE,
    UNIQUE (business_id, name)
);
```

**Seed defaults on business creation:** `new`, `waiting_for_call`, `won`, `failed` — insert these four rows with `is_default=TRUE`.

### 3.7 Table: `tasks`

```sql
CREATE TABLE tasks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_by     UUID NOT NULL REFERENCES users(id),
    assigned_to    UUID REFERENCES users(id),      -- NULL = self
    title          TEXT NOT NULL,
    description    TEXT,
    deadline       TIMESTAMPTZ,
    done_at        TIMESTAMPTZ,                    -- NULL = not done
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_business_id ON tasks(business_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
```

### 3.8 Table: `expenses`

```sql
CREATE TABLE expenses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_by   UUID NOT NULL REFERENCES users(id),
    amount       NUMERIC(12,2) NOT NULL,
    description  TEXT,
    date         DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.9 Table: `audit_log`

```sql
CREATE TABLE audit_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id  UUID REFERENCES businesses(id) ON DELETE SET NULL,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    action       TEXT NOT NULL,      -- e.g. 'lead.create', 'lead.status_change', 'task.done'
    entity_id    UUID,               -- ID of the affected record
    meta         JSONB DEFAULT '{}', -- before/after values, extra context
    ts           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_business ON audit_log(business_id, ts DESC);
```

---

## 4. Backend — FastAPI

### 4.1 Structure

```
app/
├── main.py                  # FastAPI app init, routers, lifespan
├── database.py              # SQLAlchemy async engine, session factory
├── dependencies.py          # get_db, get_current_user, require_active_sub, require_role
├── models/                  # SQLAlchemy ORM models (one file per table)
├── schemas/                 # Pydantic v2 request/response schemas
├── routers/
│   ├── webhook.py           # POST /webhook/telegram, POST /webhook/sheet/{business_id}
│   ├── leads.py             # CRUD leads
│   ├── businesses.py        # business management
│   ├── tasks.py             # tasks CRUD
│   ├── stats.py             # statistics aggregation
│   ├── expenses.py          # expenses CRUD
│   ├── team.py              # team management
│   └── paypal.py            # PayPal webhook + subscription endpoints
├── services/
│   ├── lead_service.py
│   ├── sheet_service.py     # Google Sheets read + verification
│   ├── bot_service.py       # send notifications via bot
│   ├── paypal_service.py
│   ├── gdocs_service.py     # Google Docs contract generation
│   └── export_service.py    # CSV generation
└── scheduler.py             # APScheduler jobs
```

### 4.2 Webhooks

**Telegram webhook:**  
`POST /webhook/telegram` — receives all Telegram updates. Handled by aiogram dispatcher passed into FastAPI.

**Sheet push webhook:**  
`POST /webhook/sheet/{business_id}` — called by client's Apps Script `onEdit` trigger.  
- Validate `business_id` exists and has active subscription.
- Parse row data from request body.
- Deduplicate: check if lead with same `phone` + `business_id` created in last 24h already exists.
- Save to `leads`, send bot notification.

### 4.3 Mini App API

Base path: `/api/v1/`  
Auth: Telegram Mini App `initData` validation (HMAC-SHA256 against bot token). Parse on every request via `dependencies.py → get_current_user`.

All endpoints require active subscription check via `require_active_sub` dependency, except `/api/v1/businesses` (needed to onboard).

**Leads:**
```
GET    /api/v1/leads?business_id=&status=&search=&page=&page_size=
POST   /api/v1/leads
GET    /api/v1/leads/{uid}
PATCH  /api/v1/leads/{uid}
DELETE /api/v1/leads/{uid}
GET    /api/v1/leads/export/csv?business_id=   → returns .csv file
```

**Statistics:**
```
GET /api/v1/stats/summary?business_id=&from=&to=
    → { total_leads, won_leads, failed_leads, total_revenue, avg_deal_size, conversion_rate }
GET /api/v1/stats/by_period?business_id=&period=week|month|quarter|year
    → timeseries data for chart rendering
GET /api/v1/stats/expenses?business_id=&from=&to=
```

**Tasks:**
```
GET    /api/v1/tasks?business_id=&done=false
POST   /api/v1/tasks
PATCH  /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
POST   /api/v1/tasks/{id}/done
```

**Team:**
```
GET    /api/v1/team?business_id=
POST   /api/v1/team/invite    { business_id, telegram_id or username }
DELETE /api/v1/team/{user_id}?business_id=
PATCH  /api/v1/team/{user_id}/role
```

**Businesses:**
```
GET    /api/v1/businesses          → list businesses where user is member
POST   /api/v1/businesses          → create new business
PATCH  /api/v1/businesses/{id}
POST   /api/v1/businesses/{id}/verify-sheet  → checks Google Sheet access
```

**Lead Statuses:**
```
GET    /api/v1/lead-statuses?business_id=
POST   /api/v1/lead-statuses
PATCH  /api/v1/lead-statuses/{id}
DELETE /api/v1/lead-statuses/{id}
```

**Expenses:**
```
GET    /api/v1/expenses?business_id=&from=&to=
POST   /api/v1/expenses
DELETE /api/v1/expenses/{id}
```

### 4.4 Subscription Middleware

`require_active_sub` dependency:
1. Get `business_id` from query param or request body.
2. Query `subscriptions` for that business.
3. If `plan='trial'` and `trial_ends_at < now()` → set `status='expired'`, return HTTP 402 with `{"error": "trial_expired", "paypal_link": "..."}`.
4. If `plan='monthly'` and `status != 'active'` → return HTTP 402.
5. Otherwise continue.

---

## 5. Telegram Bot — aiogram 3.x

### 5.1 Commands

```
/start     — registration or welcome back, show main menu
/switch    — switch active business context (if user has multiple businesses)
/newbiz    — create a new business
/app       — send Mini App launch button
/export    — export leads as CSV (sends file)
/help      — help message
```

### 5.2 Registration Flow (`/start`)

```
/start
  └─ user exists? 
       NO → create user record → ask language (inline keyboard: EN | PL)
             → create first business (ask name)
             → create subscription (trial, 7 days)
             → ask for Google Sheet ID
             → explain: "Share your sheet with {SERVICE_ACCOUNT_EMAIL}, then paste Sheet ID"
             → verify sheet access → confirm or retry
             → onboarding complete → show main menu
       YES → show main menu with active business name
```

### 5.3 Multi-Business Context

- Bot stores `active_business_id` per user in a Redis cache or PostgreSQL `user_sessions` table.
- Every bot action (CSV export, notifications, etc.) uses the active business.
- `/switch` → shows inline keyboard listing all user's businesses → user selects one → update session.
- When user is invited to a team → they receive a bot message: "You've been added to {business_name} team."

### 5.4 Notifications

When a new lead is saved to the database, send a notification to **all `business_members`** of that business:

```
🔔 New Lead — {business_name}

👤 {name}
📞 {phone}
📧 {email}
📅 Event: {event_date} · {event_type}

[Open in App]   [Mark as Called]
```

The `[Open in App]` button opens Mini App deep-linked to that lead.  
The `[Mark as Called]` button is a callback that appends to `call_history` and sets `assigned_to` to the user who tapped it.

### 5.5 CSV Export

Command `/export` or button in bot:
1. Query all leads for active business, ordered by `created_at DESC`.
2. Generate CSV with columns: `uid, name, phone, email, city, event_date, event_type, status, assigned_to, contract_value, notes, created_at`.
3. Send as file: `leads_{business_name}_{YYYY-MM-DD}.csv`.

### 5.6 Trial Expiry Notification

Scheduler job (daily): for each business where `trial_ends_at` is between `now()` and `now() + 2 days`, send the owner a bot message explaining trial is ending with a PayPal subscription link.

### 5.7 Paywall Handling

If user tries to use `/export` or any bot feature with expired subscription, send:
```
⚠️ Your trial has ended.
Subscribe to continue using Barowo CRM.
[Subscribe — $X/month]
```
The button opens a PayPal subscription link.

---

## 6. Telegram Mini App — React

### 6.1 Tech Stack

- React 18 + Vite
- TypeScript
- TailwindCSS
- React Query (tanstack/query) for API calls and caching
- Zustand for global state (active business, user)
- Telegram WebApp JS SDK (`@twa-dev/sdk`)

### 6.2 Authentication

On Mini App load:
1. Read `window.Telegram.WebApp.initData` (string).
2. Send to `POST /api/v1/auth/validate` with `{ initData }`.
3. Backend validates HMAC and returns `{ user, businesses, active_business_id, token }`.
4. Store token in memory (not localStorage — not available in Mini App sandbox).
5. Attach `Authorization: Bearer {token}` to all subsequent requests.

### 6.3 Layout

The app uses a **bottom tab bar** with 4 tabs:

```
[ Leads ] [ Stats ] [ Tasks ] [ Settings ]
```

At the **top** of every tab: a business switcher dropdown showing the active business name. Tapping it opens a modal/sheet listing all businesses the user belongs to, with an "+ Add Business" option.

### 6.4 Tab 1 — Leads

**List view:**
- Paginated card list (infinite scroll), sorted by `created_at DESC` by default.
- Each card shows: name, phone, status badge (colored), event date, contract value.
- Filter bar: by status, by assigned user, by date range, by search (name/phone/email).
- Sort options: by date, by contract value, by status.
- FAB button (bottom right): "+ Add Lead" → opens lead creation form.

**Lead detail view (open on card tap):**
- All fields displayed with inline edit capability.
- Fields: name, phone, email, city, event_date, event_type, status (dropdown from `lead_statuses`), assigned_to (dropdown from team members), contract_value, notes, next_call_at.
- `custom_fields` JSONB: render as key-value pairs, editable.
- Call history section: list of `{who, at}` entries.
- Action buttons: "Mark as Called", "Delete Lead".
- Delete requires confirmation dialog.

**Add/Edit Lead form:**
- All core fields.
- Status defaults to the status with `is_default=TRUE` for this business.

### 6.5 Tab 2 — Statistics

**Summary cards (top):**
- Total Leads · Won Leads · Failed · Conversion Rate (won/total)
- Total Revenue · Average Deal Size

**Date range selector:** This week / This month / This quarter / This year / Custom range.

**Charts:**
- Line chart: leads over time (for selected period).
- Bar chart: revenue over time.
- Pie/donut chart: leads by status.

**Expenses section (bottom):**
- List of expenses for the period with total.
- "+ Add Expense" button → opens form (amount, description, date).
- Net revenue = total revenue - total expenses (displayed prominently).

### 6.6 Tab 3 — Tasks & Team

**Tasks sub-tab (default):**
- List of active (not done) tasks, sorted by deadline ASC.
- Each task card: title, deadline (highlighted red if overdue), assigned to (avatar/name).
- "+ Add Task" FAB → form: title, description, deadline (date+time picker), assign_to (self or team member dropdown).
- Swipe-to-complete or "Done" button on task card.
- "History" toggle: shows completed tasks with done_at timestamp.

**Team sub-tab:**
- List of current business members with role badges (owner / admin / member).
- Invite member button: user enters Telegram username or ID → backend sends them a bot invite notification.
- Owner/admin can change roles or remove members (cannot remove owner).
- Owner sees their own role as non-editable.

### 6.7 Tab 4 — Settings

**Sections:**
1. **Business** — edit business name, current Sheet ID, re-verify sheet access button.
2. **Language** — toggle EN / PL (updates user's `language` field, re-renders all i18n strings).
3. **Lead Statuses** — manage custom statuses: list with color swatches, add/edit/delete. Cannot delete statuses in use.
4. **Subscription** — shows current plan, trial end date or next billing date, "Manage Subscription" button (opens PayPal).
5. **Integrations** — Google Docs: input for contract template Google Doc ID. Google Drive: input for email offer template Doc ID.

---

## 7. Google Sheets Integration

### 7.1 Service Account Setup

- One Google Service Account for the entire system (stored credentials in env vars as JSON).
- Clients share their Sheet with the service account email (`GOOGLE_SERVICE_ACCOUNT_EMAIL`).
- Python uses `google-auth` + `gspread` libraries.

### 7.2 Sheet Verification

When client provides Sheet ID (via bot or Mini App settings):
1. Attempt to open the sheet using the service account.
2. Read headers from row 1.
3. If successful → set `sheet_verified=TRUE`, store `sheet_tab_name`.
4. If permission denied → return error: "Please share the sheet with {GOOGLE_SERVICE_ACCOUNT_EMAIL} first."
5. If sheet not found → return error: "Sheet ID not found. Double-check the ID."

### 7.3 Apps Script Push (client-side, onEdit trigger)

Provide clients with a copy-paste Apps Script snippet to install in their Sheet:

```javascript
// Install as onEdit trigger in client's Google Sheet
function onEdit(e) {
  const row = e.range.getRow();
  if (row <= 1) return; // skip header
  const sheet = e.source.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const data = {};
  headers.forEach((h, i) => { data[h] = values[i]; });
  
  UrlFetchApp.fetch("https://{BACKEND_URL}/webhook/sheet/{BUSINESS_ID}", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ row_data: data })
  });
}
```

The `BUSINESS_ID` is shown to the client in the Mini App Settings > Business tab after sheet verification.

### 7.4 Fallback Polling

APScheduler job: every 10 minutes, for each business with `sheet_verified=TRUE`:
1. Read all rows from their Sheet.
2. For each row where phone is not empty: check if a lead with that phone + business_id already exists in DB (created in last 30 days).
3. If not → create lead, notify team.
4. This handles cases where the onEdit trigger failed or wasn't installed.

### 7.5 Column Mapping

Standard Facebook Lead Ads columns map to lead fields:

| Sheet Column | Lead Field |
|---|---|
| `full_name` or `name` | `name` |
| `phone_number` or `phone` | `phone` |
| `email` | `email` |
| `city` | `city` |
| `event_date` | `event_date` |
| `event_type` or `event` | `event_type` |

All unrecognized columns → stored in `custom_fields` JSONB.  
Column matching is **case-insensitive** and ignores spaces/underscores.

---

## 8. PayPal Subscriptions

### 8.1 Setup

Use **PayPal REST API v2** (Business account).  
Libraries: `httpx` for async HTTP calls to PayPal.  
Credentials: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_PLAN_ID` (monthly plan pre-created in PayPal dashboard).

### 8.2 Subscription Flow

1. User clicks "Subscribe" in bot or Mini App.
2. Backend calls PayPal `POST /v1/billing/subscriptions` with `plan_id`, `subscriber.email_address`, `application_context.return_url`, `application_context.cancel_url`.
3. Return approval URL to user as a button.
4. User approves on PayPal → PayPal calls `POST /webhook/paypal` with event `BILLING.SUBSCRIPTION.ACTIVATED`.
5. Backend updates `subscriptions` row: `plan='monthly'`, `status='active'`, `paypal_sub_id={id}`, `current_period_end = now() + 30 days`.
6. Send confirmation to user via bot.

### 8.3 PayPal Webhook Events to Handle

| Event | Action |
|---|---|
| `BILLING.SUBSCRIPTION.ACTIVATED` | Set status=active, plan=monthly |
| `BILLING.SUBSCRIPTION.RENEWED` | Extend `current_period_end` by 30 days |
| `BILLING.SUBSCRIPTION.CANCELLED` | Set status=cancelled |
| `BILLING.SUBSCRIPTION.SUSPENDED` | Set status=expired, send bot warning |
| `PAYMENT.SALE.COMPLETED` | Log payment, update period_end |

### 8.4 PayPal Webhook Verification

Always verify PayPal webhook signature before processing:
- Use `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME`, `PAYPAL-CERT-URL`, `PAYPAL-TRANSMISSION-SIG` headers.
- Call PayPal `POST /v1/notifications/verify-webhook-signature` to confirm.
- Reject requests that fail verification with HTTP 400.

---

## 9. Google Docs / Drive Integration

### 9.1 Contract Generation (Google Docs)

Client provides a Google Doc template ID in Settings. The template contains placeholders like `{{name}}`, `{{phone}}`, `{{event_date}}`, `{{contract_value}}`, etc.

Flow when user triggers "Generate Contract" for a lead:
1. Copy the template Doc to a new file in Google Drive using Drive API.
2. Open the copy with Docs API, replace all `{{placeholder}}` text with lead field values.
3. Export the Doc as PDF via Drive API (`exportLinks['application/pdf']`).
4. Send PDF to user via Telegram Bot (`sendDocument`).
5. Log in `audit_log`.

Libraries: `google-api-python-client`, `google-auth`.

Placeholders to support by default:
`{{name}}`, `{{phone}}`, `{{email}}`, `{{city}}`, `{{event_date}}`, `{{event_type}}`, `{{contract_value}}`, `{{business_name}}`, `{{today_date}}`.

### 9.2 Email Offer (Google Drive)

Same flow as contract, but uses a different template Doc ID stored in `Settings > Integrations > Email Offer Template`. Output is also PDF. User receives it in Telegram and can forward to the lead.

---

## 10. Scheduler — Background Tasks

Use **APScheduler** (AsyncIOScheduler). Initialize in FastAPI `lifespan` context.

### Jobs

| Job | Interval | Description |
|---|---|---|
| `poll_all_sheets` | Every 10 min | Fallback sheet polling for all verified businesses |
| `check_trial_expiry` | Daily at 09:00 UTC | Send warning to owners whose trial ends in ≤2 days |
| `send_daily_summary` | Daily at 20:00 UTC (per business timezone — default UTC) | Send bot message: new leads today, tasks due today |
| `send_task_reminders` | Every 1 hour | Send bot reminder for tasks with deadline in next 1 hour, not yet done |
| `send_lead_call_reminders` | Every 1 hour | Send reminder for leads with `next_call_at` within next hour |
| `cleanup_expired_trials` | Daily at 01:00 UTC | Set status=expired for overdue trials, send notification |

---

## 11. Multi-Tenancy & Business Context

### Data isolation rule
Every database query that reads or writes business data **must** include `WHERE business_id = {id}`. No exceptions. This is enforced at the service layer, not just the API layer.

### User → Business relationship
- A `user` can be an owner of multiple businesses.
- A `user` can be a member (via `business_members`) of businesses they don't own.
- When a user is in multiple businesses, they have an **active business context**.

### Active business context — Bot
Stored in `user_sessions` table:
```sql
CREATE TABLE user_sessions (
    user_id             UUID PRIMARY KEY REFERENCES users(id),
    active_business_id  UUID REFERENCES businesses(id),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
```

### Active business context — Mini App
Stored in Zustand global store in-memory. On first load, default to the first business in the user's list. The business switcher dropdown in the top bar updates the store and triggers React Query cache invalidation for all business-scoped queries.

### Inviting team members
1. Owner/admin enters Telegram username or ID in Mini App Team tab.
2. Backend looks up user by `telegram_id` or `username` in `users` table.
3. If user exists → add `business_members` row with `role='member'`, send bot notification to new member.
4. If user not found → return error: "This user hasn't started Barowo bot yet. Ask them to message @BarowoBot first."

---

## 12. Authentication & Authorization

### Bot
Identity = Telegram `user_id` from the Update object. No JWT needed. Always call `get_or_create_user(telegram_id)` at the start of every handler.

### Mini App
1. Client sends `initData` (Telegram-signed string).
2. Backend validates: `HMAC-SHA256(data_check_string, SHA256(bot_token))` must match the `hash` field in initData. Reject if `auth_date` is older than 1 hour.
3. On valid initData, return a short-lived JWT (24h expiry). Mini App stores it in-memory and attaches to all requests.
4. JWT payload: `{ user_id, telegram_id, exp }`.

### Role-based access (Mini App & Bot)

| Action | Required Role |
|---|---|
| View leads, stats | member |
| Add/edit leads | member |
| Delete lead | admin or owner |
| Invite team member | admin or owner |
| Remove team member | admin or owner |
| Change team member role | owner only |
| Edit business settings | owner only |
| Delete business | owner only |

---

## 13. Localization

### Languages
- `en` — English (default)
- `pl` — Polish

### Implementation
- All user-facing strings in bot and Mini App are stored in translation files.
- Bot: use a simple `get_text(key, lang)` helper that reads from `locales/en.json` and `locales/pl.json`.
- Mini App: use `i18next` with `react-i18next`.
- User's language is stored in `users.language`. Bot reads it on every handler. Mini App reads it on load and lets user change it in Settings tab.

### Translation key naming
Use dot-notation: `leads.status.new`, `bot.notification.new_lead`, `settings.sheet.verify_success`, etc.

---

## 14. Infrastructure — Railway Deployment

### Services on Railway

| Service | Type | Notes |
|---|---|---|
| `barowo-api` | Python web service | FastAPI + aiogram, uvicorn |
| `barowo-db` | PostgreSQL plugin | Managed by Railway |
| `barowo-miniapp` | Static / Node service | React Vite build, or deploy to Cloudflare Pages |

### Telegram Bot Webhook Setup
On startup (`lifespan`), call `bot.set_webhook(url=f"{BASE_URL}/webhook/telegram")`.  
In local dev, use ngrok and call set_webhook manually.

### Procfile / Start Command
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Healthcheck
`GET /health` → `{"status": "ok"}` — used by Railway.

---

## 15. Environment Variables

```env
# Telegram
BOT_TOKEN=                          # Telegram Bot token from @BotFather
MINI_APP_URL=                       # https://... URL of deployed Mini App

# Database
DATABASE_URL=                       # postgresql+asyncpg://...

# Google
GOOGLE_SERVICE_ACCOUNT_JSON=        # Full JSON of service account credentials (as string)
GOOGLE_SERVICE_ACCOUNT_EMAIL=       # Email of service account (for display to clients)

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_PLAN_ID=                     # Pre-created monthly plan ID
PAYPAL_WEBHOOK_ID=                  # For webhook signature verification

# App
BASE_URL=                           # https://your-railway-domain.up.railway.app
JWT_SECRET=                         # Random secret for JWT signing
ENVIRONMENT=                        # 'production' | 'development'
```

---

## 16. File & Folder Structure

```
barowo-crm/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── business.py
│   │   │   ├── subscription.py
│   │   │   ├── lead.py
│   │   │   ├── task.py
│   │   │   ├── expense.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── lead.py
│   │   │   ├── business.py
│   │   │   ├── task.py
│   │   │   ├── stats.py
│   │   │   └── ...
│   │   ├── routers/
│   │   │   ├── webhook.py
│   │   │   ├── leads.py
│   │   │   ├── businesses.py
│   │   │   ├── tasks.py
│   │   │   ├── stats.py
│   │   │   ├── expenses.py
│   │   │   ├── team.py
│   │   │   └── paypal.py
│   │   ├── services/
│   │   │   ├── lead_service.py
│   │   │   ├── sheet_service.py
│   │   │   ├── bot_service.py
│   │   │   ├── paypal_service.py
│   │   │   ├── gdocs_service.py
│   │   │   └── export_service.py
│   │   ├── bot/
│   │   │   ├── dispatcher.py       # aiogram Dispatcher setup
│   │   │   ├── handlers/
│   │   │   │   ├── start.py
│   │   │   │   ├── leads.py
│   │   │   │   ├── export.py
│   │   │   │   └── callbacks.py
│   │   │   └── keyboards.py
│   │   ├── scheduler.py
│   │   └── locales/
│   │       ├── en.json
│   │       └── pl.json
│   ├── alembic/
│   │   └── versions/
│   ├── alembic.ini
│   └── requirements.txt
│
├── miniapp/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── store/               # Zustand stores
│   │   │   ├── auth.ts
│   │   │   └── business.ts
│   │   ├── api/                 # React Query hooks + axios calls
│   │   │   ├── leads.ts
│   │   │   ├── stats.ts
│   │   │   ├── tasks.ts
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── LeadsTab.tsx
│   │   │   ├── StatsTab.tsx
│   │   │   ├── TasksTab.tsx
│   │   │   └── SettingsTab.tsx
│   │   ├── components/
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── BusinessSwitcher.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── ...
│   │   └── i18n/
│   │       ├── en.json
│   │       └── pl.json
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

---

## 17. Key Business Rules

These rules must be respected throughout all code:

1. **Trial is per business, not per user.** A user creating a second business gets a fresh 7-day trial for that business.

2. **UID for leads** is an 8-char hex string. It is human-readable and used in bot messages and deep links. It must be unique globally (not just per business). Always check for collision on insert.

3. **Lead deduplication:** When ingesting from Sheet, a lead with the same `phone` + `business_id` within the last 30 days is considered a duplicate and must not be inserted again. Log this event in `audit_log` with `action='lead.duplicate_skipped'`.

4. **Sheet polling must be idempotent.** Every row read from a Sheet must be checked against existing leads. Never insert duplicates.

5. **Team notifications:** Every new lead triggers a bot notification to **all** `business_members` of the business, not just the owner.

6. **Role enforcement is server-side only.** Do not trust the client (Mini App) for role checks. Always validate role in the FastAPI dependency.

7. **Cascade deletes:** Deleting a business deletes all its leads, tasks, expenses, statuses, members, and subscription records. This is enforced by `ON DELETE CASCADE` in the DB schema.

8. **An owner cannot be removed from their own business.** The `DELETE /api/v1/team/{user_id}` endpoint must return 403 if the target user is the business owner.

9. **Language preference is per user, not per business.** It applies to all bot messages and all Mini App instances for that user.

10. **Custom statuses cannot be deleted if any lead uses them.** Return HTTP 409 with a clear error message.

---

## 18. MVP Scope & Out-of-Scope

### In MVP (ship to first real clients)

- Telegram Bot: registration, business setup, Sheet connection, new lead notifications, CSV export, trial/paywall messaging.
- Mini App Tab 1 — Leads: list, filter, add, edit, delete, lead detail view with all fields.
- Mini App Tab 2 — Statistics: summary cards, date range selector, charts (leads over time, revenue, by status), expenses.
- Mini App Tab 3 — Tasks & Team: task CRUD with deadlines, done history, team member management (invite, role change, remove).
- Mini App Tab 4 — Settings: business name, Sheet ID, language, lead statuses, subscription status.
- PayPal monthly subscriptions with webhook handling.
- Google Docs contract generation (PDF via bot).
- Google Drive email offer generation (PDF via bot).
- Business switcher (dropdown in Mini App top bar, `/switch` command in bot).

### Explicitly out of MVP (do not implement yet)

- Multiple Sheets per business.
- Zapier / Make.com integrations.
- Email sending directly from CRM.
- Mobile push notifications outside Telegram.
- White-labeling.
- Annual billing plans.
- Advanced analytics (cohorts, LTV).

---

## 19. Coding Conventions

### Python
- Python 3.11+.
- Use `async/await` throughout — no sync DB calls.
- SQLAlchemy 2.x with `AsyncSession`.
- Pydantic v2 for all schemas.
- Type hints on every function signature.
- Never use raw string SQL queries — use SQLAlchemy ORM or `text()` with bound params.
- `try/except` around all external calls (Google API, PayPal, Telegram sendMessage).
- Log errors with `logger.exception(...)` not `print()`.
- All service functions return typed results, never raise HTTP exceptions — that's the router's job.

### React / TypeScript
- Strict TypeScript (`strict: true` in tsconfig).
- No `any` types.
- React Query for all server state. No raw `useEffect` for data fetching.
- Zustand only for client-side global state (active business, auth token, language).
- Components are functional only. No class components.
- Follow Tailwind conventions — no inline `style` props except for dynamic values (e.g., status badge color from DB).
- All API calls go through the `api/` layer — no `fetch()` calls directly in components.

### Git
- Branches: `main` (production), `dev` (integration), `feature/{name}`.
- Commit format: `feat: description`, `fix: description`, `chore: description`.
- Never commit secrets. Use `.env` and Railway environment variables.

---

*End of Barowo CRM Technical Documentation v1.0*
