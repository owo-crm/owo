# OWOcrm — Mobile & Telegram Adaptation

> This document defines how OWOcrm's desktop-first design adapts to the Telegram Mini App surface.
> It is not a separate product spec — it is a translation layer from desktop to mobile.

---

## 1. Core principle

OWOcrm is designed desktop-first. The Telegram Mini App is a **field surface** — it serves the same user doing the same job, but in a different context: mobile, quick sessions, one hand, intermittent attention.

The adaptation rule is: **keep the mental model, change the interaction model.**

The user should recognize OWOcrm on mobile. The same leads, the same stages, the same tasks. But the interaction patterns, information density, and navigation all shift to match mobile reality.

---

## 2. What must be preserved on mobile

These things are non-negotiable across both surfaces:

- The lead list is the primary view. It opens first.
- Lead status and ownership are always visible in lead rows.
- The next task on a lead is always surfaced, not buried.
- Stage changes, owner assignment, and note-logging are all doable without going to desktop.
- Visual language (colors, status semantics, typography hierarchy) is consistent with desktop.

---

## 3. What should be simplified on mobile

**Filter system:** Desktop has 5+ filter options in a persistent bar. Mobile surfaces only the 3 most common: status filter, owner filter, and a search field. Additional filters are behind a "Filter" button that opens a bottom sheet.

**Lead row:** Desktop rows are 60px with 6 columns. Mobile rows are 72px with a 2-level layout:
- Line 1: Lead name (semibold) + status pill (right-aligned)
- Line 2: Owner name (muted) + "Next: [task title]" or "No task" (muted, truncated)

**Lead detail:** Desktop uses a right-side split panel. Mobile uses a full-screen view. The structure is the same (tabs: Overview, Activity, Tasks, Attachments), but each tab is a scrollable full-screen page.

**Stats:** Desktop has a full dashboard with charts. Mobile shows a summary strip of 3–4 KPI numbers only. No charts on mobile. "View full stats" links to the desktop.

**Settings:** Mobile settings is minimal — notification preferences and display preferences only. Full configuration (stages, team, integrations) requires desktop.

**Team management:** View-only on mobile. Editing roles and permissions requires desktop.

---

## 4. What must not be attempted on mobile

The following are desktop-only and should not appear in the Telegram Mini App:

- Google Sheet sync setup (complex multi-step flow — not suitable for mobile)
- Stage configuration (drag-to-reorder, semantic property editing)
- Permission editor / RBAC configuration
- Email Center (if added in a later phase)
- Bulk lead operations (multi-select, bulk assign, bulk stage change)
- Full analytics charts and breakdowns

If a user attempts to access these via a shared link or deep link on mobile, they should see: "This action is only available on the full OWOcrm web app." with a link to the web.

---

## 5. Mobile navigation

Bottom tab bar with 4 tabs:

```
[Leads]  [Tasks]  [Stats]  [Settings]
```

- Height: 60px + bottom safe area.
- Tab structure: icon (22px) + label (10px) stacked vertically.
- Active state: accent-colored icon + label + 4px accent dot below icon.
- Idle state: muted icon + label.
- No badge counts on tabs in MVP (exception: notifications — shown on a notification bell in the top bar, not tab bar).

Top bar (mobile):
```
[Business name + chevron]  ─────  [Notifications bell]
```

- Height: 56px.
- Business switcher on the left — taps to open a bottom sheet with business list.
- Notification bell on the right.
- No global search in top bar on mobile (search is per-module, inside the Leads tab).

---

## 6. Lead list — mobile flow

Entry point: Leads tab.

```
┌────────────────────────────────────┐
│  [Search field + Filter button]    │
├────────────────────────────────────┤
│  Lead row (72px)                   │
│  Lead row (72px)                   │
│  Lead row (72px)                   │
│  ...                               │
├────────────────────────────────────┤
│  [FAB: + Create lead]              │
└────────────────────────────────────┘
```

Tapping a row navigates to Lead Detail (full screen, push navigation).
FAB (floating action button): bottom right, 56px circle, accent background with accent glow shadow. Opens quick-create lead form.

---

## 7. Lead detail — mobile flow

Full-screen view. Header fixed at top, tabs below header, content scrolls.

```
┌────────────────────────────────────┐
│  ← Back   [Lead name]   [...]      │  ← Top bar with back + overflow menu
├────────────────────────────────────┤
│  [Status pill] [Stage chip] [Owner]│  ← Key identifiers row
├────────────────────────────────────┤
│  [Tabs: Overview | Activity | Tasks│  Attachments]
├────────────────────────────────────┤
│                                    │
│  [TAB CONTENT — scrollable]        │
│                                    │
├────────────────────────────────────┤
│  [Primary action button]           │  ← Sticky at bottom. Context-aware.
└────────────────────────────────────┘
```

The sticky bottom action button changes based on context:
- Default: "Add note"
- If task due today or overdue: "Complete task: [title]"
- If no owner: "Assign owner"

Overflow menu (`[...]` top right) contains: change stage, assign owner, delete lead, share.

---

## 8. Quick-create lead form (mobile)

Opened from FAB or from within the Leads tab.

Pattern: bottom sheet that slides up to ~70% of screen height. Not full-screen.

Fields:
- Name (required)
- Phone
- Stage (dropdown, pre-selects first active stage)
- Assign to (defaults to self)
- Note (optional)

"Save" button at the bottom. Sheet dismisses on save or on swipe down.

This is intentionally minimal. Full lead editing happens in Lead Detail.

---

## 9. Task workspace — mobile flow

Task list. Same structure as mobile lead list — rows, not cards.

Task row (mobile):
- Line 1: Task title + due date (right-aligned, overdue in danger color)
- Line 2: Lead name chip + assignee name

Toggle between "My tasks" / "All tasks" via segmented control at top.

Tapping a task row opens a task detail bottom sheet (not a full-screen view). The sheet shows: full title, linked lead (tappable to navigate), due date, assignee, notes, complete/delete actions.

No bulk operations on mobile task list.

---

## 10. Compactness rules for mobile

**Vertical scrolling is acceptable. Endless vertical chaos is not.**

The following rules prevent mobile views from becoming unnavigable:

- Lead detail tabs enforce content within their scrollable area — the user never scrolls past the tabs themselves.
- Activity timeline on mobile shows the last 10 events by default. "Load more" button reveals older history.
- Tasks within a lead detail tab show 5 by default. "View all tasks" opens the full task list.
- Notes within Overview tab show the last note. "View all" opens the activity timeline filtered to notes.
- No inline form sections that expand the page vertically without limit. Forms open in bottom sheets.

---

## 11. Modal and sheet behavior on mobile

OWOcrm on mobile uses **bottom sheets** instead of centered modals for all overlaid content. This is consistent with Telegram Mini App conventions and mobile UX best practices.

Rules for bottom sheets:
- Short confirmations and alerts: 30–40% of screen height. Fixed height.
- Quick-create forms: ~65–70% of screen height. Not resizable.
- Multi-step flows: full-screen (the Mini App pushes a new native view).
- All bottom sheets have a visible drag handle (4px × 32px pill) at the top.
- Sheets can be dismissed by dragging down or tapping the backdrop above the sheet.
- No nested sheets. If content inside a sheet requires another selection, it replaces the current sheet or pushes a full-screen view.

---

## 12. How to avoid huge vertical screens on mobile

The main risk on mobile is the "accordion hell" pattern — where every section expands in place, creating an enormous scrollable page with no clear structure.

OWOcrm prevents this by:
- Using tabs to organize lead detail content (Overview / Activity / Tasks / Attachments). Each tab shows only its content.
- Limiting default list lengths and using "Load more" patterns.
- Moving complex content (lengthy activity history, attachment grids) into dedicated tabs rather than inline sections.
- Never placing form inputs inline within a list view. Forms live in bottom sheets or dedicated screens.
- Not using expandable accordion sections within operational views.
