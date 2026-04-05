# OWOcrm — Desktop UX Patterns

> This document defines canonical UX patterns for each major functional area of OWOcrm on desktop.
> These patterns are the default. Deviations require explicit justification.

---

## 1. Pattern vocabulary

OWOcrm uses four primary structural patterns for content display:

**Table row list** — For data-dense lists of entities (leads, tasks, team members). Each row is a fixed height, showing key fields. Rows are selectable.

**Split view** — For lead detail. List on the left, detail panel on the right. The list narrows but remains visible.

**Modal** — For focused actions, confirmations, and short forms. Centered overlay. Max 720px wide. Blocked interaction with background.

**Side panel / drawer** — For contextual flows that require more space but shouldn't replace the current view. Slides from right. Background dimmed but visible.

---

## 2. Lead List — Operator Pattern

**Goal:** Fast scanning and triage of the pipeline. Identifying leads that need action.

**Pattern:** Full-width table-style list. Not cards — rows.

**Row anatomy (left to right):**
```
[Status pill 60px] [Lead name + secondary info 220px] [Owner avatar+name 120px] [Stage chip 110px] [Last activity 90px] [Next task 180px] [Actions on hover]
```

- Status pill: color-coded semantic status. New, Follow-up, Won, Lost, Overdue.
- Lead name: primary text (14px semibold). Below: phone or email in muted 12px.
- Owner: avatar (24px circle) + first name. Shows "Unassigned" in danger-muted style if empty.
- Stage: text chip with stage background color at 12% opacity and matching border.
- Last activity: timestamp relative (e.g., "2h ago", "Yesterday"). Muted text.
- Next task: task title truncated to 1 line. If overdue, shown in `--color-danger`. If none, "No task" in muted.
- Actions on hover: row reveals action icons (assign, add task, quick status change). No permanent action columns.

**Row height:** 60px.

**Selection:** Clicking a row opens the Lead Detail panel (split view). Selected row gets `--color-surface-4` background. A 2px left border in accent color marks the selected row.

**Hover state:** Row background shifts to `--color-surface-3`. Action icons appear on the right end.

**Filters and search:** Persistent filter bar above the list. Single row. Contains: search field, owner filter, stage filter, status filter, date range, a "More filters" overflow button. Active filters appear as chips below the filter bar — they do not expand the filter bar into multiple rows.

**Empty state:** When no leads match filters: "No leads match your filters." + "Clear filters" link. When no leads at all: "No leads yet." + "Import from Google Sheet" CTA + "Add manually" secondary CTA.

---

## 3. Lead Detail — Operator Pattern

**Goal:** See everything relevant about one lead. Take the next action.

**Pattern:** Right panel in split view (480px wide). When opened full-screen, uses centered constrained layout (max 680px).

**Panel structure (top to bottom):**
```
[Lead name + status pill]  [Close button]
[Owner chip]  [Stage selector chip]  [Created date]
─────────────────────────────────────────────────────
[TABS: Overview | Activity | Tasks | Attachments]
─────────────────────────────────────────────────────
[TAB CONTENT — scrollable within panel]
```

**Overview tab:**
- Contact info block: phone, email, city. Editable inline (click to edit).
- Deal value if applicable.
- Notes (last 2 visible, "View all" expands).
- If inventory-enabled: inventory summary (all ready / X missing) — compact row, not a full block.

**Activity tab:**
- Chronological timeline of all events: notes, status changes, task completions, sheet imports, email events.
- Each item: icon, action description, author, timestamp.
- "Add note" appears at the top (inline text input, not a modal).

**Tasks tab:**
- Linked tasks. List style. Status, title, due date, assignee.
- "Add task" button opens a compact inline form or a modal.

**Attachments tab:**
- File list with name, size, date, uploaded-by. Download and delete actions per file.
- Upload button always visible at top.

**Primary actions (always visible, not in a tab):**
- Stage change — the stage chip in the header is a dropdown selector, not a badge.
- Assign owner — the owner chip is clickable, opens a member picker.
- These two actions are always reachable without scrolling.

---

## 4. Task Workspace — Operator + Manager Pattern

**Goal:** A unified view of all tasks across the business — not filtered to a single lead.

**Pattern:** Full-width list. Similar row structure to Lead list.

**Task row anatomy:**
```
[Status checkbox] [Task title 260px] [Lead link chip 140px] [Assignee 120px] [Due date 90px] [Priority 60px]
```

- Status checkbox: checkable inline. Completed tasks get struck-through title and row opacity 0.5.
- Task title: text, truncated at 1 line.
- Lead link: if task is linked to a lead, shows lead name as a chip. Clicking navigates to that lead.
- Assignee: same as lead list — avatar + name.
- Due date: relative ("Tomorrow", "Overdue 2d"). Overdue shown in `--color-danger`.
- Priority: optional high/medium/low badge.

**Views:** Switch between "All tasks", "My tasks", and "By assignee" via segmented control above the list.

**Grouping:** Tasks can be grouped by due date (Today / This week / Later / Overdue) — a toggle in the filter area. When grouped, group headers are non-interactive dividers with muted label + count.

**Bulk actions:** Selecting multiple tasks via checkbox column (appears on hover of first item) reveals a bulk action bar at the top: "Mark complete", "Reassign", "Delete".

---

## 5. Stats Overview — Management Pattern

**Goal:** Business health at a glance. Pipeline performance, revenue, activity.

**Pattern:** Dashboard. Full-width content area. Two-zone layout.

**Zone 1 — KPI strip:**
A single horizontal row of 3–4 KPI cards. Each card:
- Metric name (12px muted)
- Value (24px semibold, primary text)
- Trend indicator (up/down arrow + % change vs previous period, colored success/danger)
- Cards are compact: ~140px tall.

**Zone 2 — Charts and breakdowns (below KPI strip):**
- Pipeline stage funnel or bar chart (full width or 2/3 width)
- Revenue over time (line chart, full width or 2/3 width)
- Secondary breakdown table (leads by owner, tasks by status, etc.) in remaining 1/3 or as a separate row

**Period selector:** At the top right of the page header. Dropdown with options: Today, This week, This month, Last 30 days, Last 90 days, Custom range. Selected period applies to all charts on the page.

**Empty state for new businesses:** "No data yet. Start importing leads to see your pipeline stats." With a link to the Sheet Sync setup.

---

## 6. Sheet Sync Setup — Management + Operator Setup Pattern

**Goal:** Connect a Google Sheet to OWOcrm and import leads.

**Pattern:** Multi-step flow in a large side panel (640px wide) or full-page centered view.

**Steps:**
1. Paste Sheet URL
2. Verify access / select tab
3. Map columns to CRM fields (the main step — takes most space)
4. Preview results (table of what will be imported)
5. Confirm import

Each step has a clear title, instruction, and primary action button. Navigation between steps is linear — no jumping. A progress indicator (step 1 of 5) is visible at the top.

The mapping step (step 3) shows two columns: "Your sheet columns" on the left, "CRM field" dropdown on the right. Auto-suggested mappings are pre-filled. Unrecognized columns are shown in muted style with "Skip" or "Map to Additional Info".

---

## 7. Settings — Management Pattern

**Goal:** Configure the business: stages, team, integrations, notifications.

**Pattern:** Settings layout with secondary left nav (see LAYOUT_SYSTEM.md Section 5.4).

**Sections:**
- Business info (name, type, timezone, logo)
- Pipeline stages (drag-reorderable list, color + name + semantic properties per stage)
- Team (same as Team module — members, roles, permissions)
- Integrations (Google Sheet, Email — each with status, configure, disconnect)
- Notifications
- Plan & Billing (future)
- Danger zone (delete business)

**Form patterns within settings:**
- Inline editing for simple fields (click value to edit, blur to save).
- Modal for complex operations (add team member, configure integration, delete confirmation).
- Stage editor: drag handles on rows for reordering. Color picker as a small swatch, not a full color panel.

---

## 8. Email Center — Contextual Pattern

**Goal:** Send and receive emails related to leads without leaving OWOcrm.

*Assumption: Email integration is a later-phase feature. This describes the intended pattern when it exists.*

**Pattern:** Accessible from Lead Detail → Activity tab. A "Send email" action opens a composer modal. Received emails appear in the activity timeline.

Email Center as a standalone module (if added): full-width view with email list on left, email content on right — a minimal two-panel inbox. No attempt to replicate a full email client. Scoped to leads-related correspondence only.

---

## 9. Operator patterns vs. Management patterns

| Pattern | Operator use | Manager use |
|---|---|---|
| Lead list | Daily, multiple times | Periodic review |
| Lead detail | Core daily workflow | Review specific deals |
| Task workspace | Daily | Monitor team progress |
| Stats / Dashboard | Rarely | Regular review |
| Settings | Never in daily use | Owns this |
| Sheet sync | Setup and occasional re-sync | Owns this |
| Team | Never in daily use | Owns this |

The interface serves both simultaneously by:
- Keeping operational views (leads, tasks) fast, compact, and action-forward.
- Keeping management views (stats, settings) structured, complete, and non-intrusive to operators.
- Never requiring an operator to wade through management settings to get their job done.
- Never requiring a manager to scroll through operational noise to get a business overview.
