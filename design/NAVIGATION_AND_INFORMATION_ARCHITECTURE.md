# OWOcrm - Navigation and Information Architecture

> This document defines how OWOcrm is organized, how users move between
> sections, and how Web and Telegram surfaces relate to each other.

---

## 1. Top-level information architecture

OWOcrm is organized into:
- primary modules
- secondary modules

Primary modules are used daily and live in the main navigation.
Secondary modules are accessed contextually from inside a primary module.

---

## 2. Primary modules

The first visible Web shell contains four primary modules:

1. `Leads`
   The core operational queue.
2. `Tasks`
   Cross-lead execution workspace.
3. `Stats`
   Management visibility and health checks.
4. `Settings`
   Business configuration, integrations, stages, team, and notifications.

`Team` is not a standalone primary module in Web v1.
It lives inside `Settings/Admin`.

---

## 3. Secondary modules

Secondary modules are accessed from entry points, not from the main sidebar.

- `Sheet Sync`
  Accessed from `Settings -> Integrations` and from the leads empty state.
- `Lead Sources`
  Accessed from `Settings -> Integrations` when website-form or API intake is
  enabled.
- `Email Center`
  Accessed from lead detail or settings when enabled in a later phase.
- `Inventory`
  Accessed as a contextual sub-view where a business mode needs it.
- `Billing / Plan`
  Accessed from `Settings -> Plan` in a later phase.
- `Onboarding`
  Appears during first business creation, not in ongoing navigation.

---

## 4. Web navigation structure

### 4.1 Sidebar

The desktop sidebar is the primary wayfinding element.

Structure:
- business switcher at the top
- primary modules in one grouped block
- user/profile area at the bottom

Visible primary items:
- Leads
- Tasks
- Stats
- Settings

Rules:
- width: 240px expanded, 56px collapsed
- no nested sidebar trees
- active item must be clearly distinct
- sub-views appear inside the content area, not as nested sidebar branches

### 4.2 Top bar

The top bar carries cross-context controls, not module navigation.

Recommended top-bar content:
- business switcher or current business context
- search
- notifications
- profile menu

### 4.3 Contextual navigation

Use tabs, segmented controls, or internal settings navigation for sub-sections.

Examples:
- Lead detail: `Overview / Activity / Tasks / Attachments`
- Settings: `Business / Stages / Team / Integrations / Notifications / Plan`

---

## 5. Telegram Mini App navigation

The Telegram Mini App uses a bottom tab bar with four tabs:

- Leads
- Tasks
- Stats
- Settings

Rules:
- maximum four visible tabs
- team management is folded into settings
- compact business switching stays in the top bar
- heavy setup flows remain Web-first

---

## 6. Business context switching

OWOcrm supports multi-business membership.

Rules:
- current business context is always visible
- switching business changes the active workspace context, not just one widget
- the active business should persist across sessions

---

## 7. Orientation signals

Users should always understand where they are through three signals:

1. active nav state
2. page header
3. simple back path in nested views like lead detail or settings subsections

---

## 8. Web vs Telegram relationship

Web and Telegram are not duplicates.
They share the same business behavior but differ in density and navigation.

| Function | Web | Telegram Mini App |
|---|---|---|
| Lead list + filters | Full | Simplified |
| Lead detail | Full split or full view | Compact single-screen view |
| Create lead | Full form | Quick-create |
| Task workspace | Full multi-owner workspace | Simplified work queue |
| Stats | Full | Summary only |
| Team management | Inside Settings/Admin | Reduced or absent in MVP mobile shell |
| Settings | Full | Minimal |
| Sheet sync / source setup | Full | Not available |
| Notifications | Yes | Yes |

Telegram is the field surface.
Web is the primary operational workspace.
