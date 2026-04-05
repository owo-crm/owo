# UX Flows

Status: Active  
Owner: Product + Frontend  
Last updated: 2026-04-02

## Surface Roles

- Web App = primary full workspace
- Telegram Mini App = adaptive mobile shell
- Telegram bot = notification and command surface

Business outcome parity is mandatory.
Presentation density may differ.

## Shared Core Flows

These flows must keep the same domain behavior on Web and Telegram:

- authenticate and restore active business
- inspect lead queue
- open lead context
- assign owner
- create next task
- complete task
- progress lead through stage lifecycle
- consume event-driven notifications

## Web Flows

### Workspace entry

1. authenticate
2. restore active business
3. switch business if needed
4. enter module workspace

Current Week 3 shell baseline:
- Leads
- Tasks
- Stats
- Settings

### Leads

Web lead list is the main operational queue.

Primary actions:
- search
- filter by stage, assignment, and scope
- open lead
- create lead
- quick assign owner
- quick create next task

### Lead detail

Lead detail is a compact operational summary, not an endless all-data screen.

Primary sections:
- identity
- stage and owner
- notes and custom fields
- tasks summary
- money context
- attachments
- inventory context when enabled
- communication entry points

Rule:
- heavy sections open in modal, sheet, or separate panel

### Tasks

Web task workspace is the execution layer.

Primary actions:
- filter task pool
- create/edit tasks
- mark done
- open linked lead

### Stats

Stats are management visibility, not the main day-to-day work surface.

### Settings

Settings cover:
- lead source setup
- Google Sheet setup
- website form/API source configuration where enabled
- mapping access
- sync execution
- modules
- stage configuration
- automation settings
- notification settings
- billing access

## Telegram Flows

### Identity and entry

1. user opens bot or Mini App from Telegram
2. auth is validated from Telegram context
3. active business is restored
4. user enters compact business shell

### Leads

Mini App lead queue prioritizes:
- fast scanning
- owner/task gaps
- quick entry into one lead

### Lead detail

Mini App lead detail stays operational and compact.

Rule:
- do not force desktop-density views into small screens
- large supporting areas open as sheets or compact overlays

### Tasks

Mini App tasks prioritize:
- open work first
- fast done/edit behavior
- jump to linked lead when needed

### Settings

Mini App may expose compact business controls, but heavier setup logic still
leans web-first over time.

## Bot-Assisted Flows

Bot jobs:
- notifications
- quick command entry
- launch into Mini App context

Bot is not a full CRM replacement.

## Flow Design Rules

1. keep ownership and next action visible early
2. keep lead screens compact
3. keep setup flows understandable
4. use downstream notifications, not parallel business logic
5. do not create Web rules and Telegram rules that disagree about workflow
6. do not expose source-specific workflows as separate CRMs; all lead sources
   must feel like one queue after ingestion
