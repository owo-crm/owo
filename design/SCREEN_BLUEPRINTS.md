# OWOcrm — Screen Blueprints

> This document defines blueprint-level screen structure for all primary screens and flows.
> Blueprints describe zones, priorities, and interaction logic — not pixel-level specs.

---

## 1. Leads List

**Goal:** The operator's primary workspace. Scan the pipeline, identify what needs action, navigate to specific leads.

### Desktop layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                            │
│  "Leads"                                     [+ Add lead]  [Import]     │
├─────────────────────────────────────────────────────────────────────────┤
│  FILTER BAR                                                             │
│  [Search...] [Owner ▾] [Stage ▾] [Status ▾] [Date ▾]  [More filters]  │
│  ─────────────────────────────────────────────────────────────────────  │
│  Active filters: [Follow-up ×] [Unassigned ×]                          │
├─────────────────────────────────────────────────────────────────────────┤
│  TABLE HEADER (non-sticky, visible on load)                             │
│  Status  │  Name + Contact  │  Owner  │  Stage  │  Last activity  │ Next task │
├─────────────────────────────────────────────────────────────────────────┤
│  Lead row (60px)                                                        │
│  Lead row (60px)                                                        │
│  Lead row (60px)                                                        │
│  ...                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**What must be visible immediately:** Status, name, owner, stage, next task.

**Primary actions:** Add lead (opens creation modal), Import (opens Sheet Sync panel).

**Secondary actions (on row hover):** Quick-assign owner, quick-add task, quick-change stage.

**What opens separately:** Lead Detail (right panel), Filter panel (inline expand below filter bar or dropdown).

---

## 2. Leads List + Lead Detail (Split View)

**Goal:** Work on a lead without losing list context.

### Desktop layout
```
┌────────────────────────────┬────────────────────────────────────────────┐
│  LIST PANE (48%)           │  DETAIL PANEL (52%)                        │
│                            │                                            │
│  [Filter bar — compact]    │  [Lead name]               [Close ×]       │
│                            │  [Owner chip] [Stage chip] [Created]       │
│  Lead row (selected) ←     │  ─────────────────────────────────────     │
│  Lead row                  │  [Tabs: Overview | Activity | Tasks | Files]│
│  Lead row                  │  ─────────────────────────────────────     │
│  ...                       │  [Tab content — scrollable]                │
│                            │                                            │
│                            │  ─────────────────────────────────────     │
│                            │  [Add note ─ inline input]                 │
└────────────────────────────┴────────────────────────────────────────────┘
```

**What must be visible immediately in the detail panel:** Lead name, status pill, owner, stage selector, tab navigation, primary contact info (in Overview tab).

**Primary actions in detail panel:** Change stage (the stage chip is interactive), assign owner, add note.

**What opens separately:** Attachment upload dialog, task creation modal, full activity history (within the Activity tab's own scroll area).

---

## 3. Lead Detail — Full Screen

Used when opening a lead directly (e.g., from a task link or search result), not from a split view.

### Desktop layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Back to Leads                                                     │
│                                                                      │
│  [Lead name — large]    [Status pill]    [···  More actions]         │
│  [Owner chip]  [Stage selector]  [Created: date]                     │
├──────────────────────────────────────────────────────────────────────┤
│  [Tabs: Overview | Activity | Tasks | Attachments]                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [TAB CONTENT — constrained width 680px, left-aligned]               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tasks Workspace

**Goal:** A unified task board for the entire business. See all tasks, filter by owner, identify overdue.

### Desktop layout
```
┌────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                        │
│  "Tasks"                                              [+ Add task]  │
├────────────────────────────────────────────────────────────────────┤
│  VIEW CONTROLS                                                      │
│  [My tasks | All tasks | By assignee]     [Group by due date: ON]  │
├────────────────────────────────────────────────────────────────────┤
│  GROUP HEADER: "Overdue"  (4)                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  Task row (overdue — danger accent)                                 │
│  Task row (overdue)                                                 │
├────────────────────────────────────────────────────────────────────┤
│  GROUP HEADER: "Today"  (7)                                         │
│  ─────────────────────────────────────────────────────────────────  │
│  Task row                                                           │
│  Task row                                                           │
│  ...                                                                │
├────────────────────────────────────────────────────────────────────┤
│  GROUP HEADER: "This week"  (12)                                    │
│  ...                                                                │
└────────────────────────────────────────────────────────────────────┘
```

**What must be visible immediately:** Overdue tasks first. Today's tasks second. Clear visual separation between groups.

**Primary actions:** Add task (modal), complete task (inline checkbox).

**Secondary actions:** Filter by assignee (segmented control), bulk select + bulk actions.

**What opens separately:** Task detail (compact bottom sheet or side panel), linked lead (navigate to lead detail).

---

## 5. Stats Overview

**Goal:** Business performance at a glance. Answer: how is the pipeline doing this month?

### Desktop layout
```
┌──────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                      │
│  "Stats"                               [Period: This month ▾]     │
├────────────────┬───────────────────┬───────────────────────────────┤
│  KPI card      │  KPI card         │  KPI card                    │
│  Leads in      │  Won this month   │  Conversion rate             │
│  pipeline      │  $12,400          │  18%                         │
│  34            │  ↑ 23% vs last    │  ↓ 2% vs last               │
├────────────────┴───────────────────┴───────────────────────────────┤
│  PIPELINE STAGE FUNNEL (full width, bar chart)                    │
│  New → Contacted → Proposal → Won / Lost                          │
├───────────────────────────────┬──────────────────────────────────┤
│  REVENUE OVER TIME (line)     │  LEADS BY OWNER (table)          │
│  2/3 width                    │  1/3 width                       │
└───────────────────────────────┴──────────────────────────────────┘
```

**What must be visible immediately:** The 3 KPI cards. Period context. Current pipeline health.

**Primary actions:** Change period (dropdown).

**What opens separately:** Drill-down on specific stage (navigates to filtered lead list), export data (future).

---

## 6. Google Sheet Setup Flow

**Goal:** Connect a Sheet, map columns, import leads. Simple and fast — not a complex import wizard.

**Design principle:** This is a simple importer, not a data pipeline tool. The flow is linear and lightweight. No heavy preview step, no multi-screen data validation. The user pastes a URL, picks a tab, maps columns, and imports. Done.

### Panel layout (480px side panel or centered modal)
```
Step 1 of 3: Connect your Sheet
─────────────────────────────────────────────────────────
  Paste your Google Sheet URL below.
  Make sure the sheet is set to "Anyone with the link can view."

  [Google Sheet URL _________________________ ]

  [Tab: Lead responses ▾]  ← shown after URL is verified

                                          [Next →]
─────────────────────────────────────────────────────────
```

```
Step 2 of 3: Map columns
─────────────────────────────────────────────────────────
  Your sheet columns         →    CRM field
  ─────────────────────────────────────────────────────
  Full Name                       Name [required]
  Phone Number                    Phone
  Email Address                   Email
  City                            City
  Event Type                      Service / Event type
  Lead Date                       Date
  Comments                        Notes
  Facebook Campaign               [Skip ▾]
  Ad Set                          [Skip ▾]
  ─────────────────────────────────────────────────────
  Auto-suggested mappings are pre-filled.
  Unrecognized columns default to Skip.

                                   [← Back] [Import →]
─────────────────────────────────────────────────────────
```

```
Step 3: Done
─────────────────────────────────────────────────────────
  ✓ 28 leads imported. 3 duplicates skipped.

                                    [View leads] [Close]
─────────────────────────────────────────────────────────
```

**What must be visible immediately at each step:** Step title, instruction, input, next action. Nothing else.

**No separate preview step.** The import summary (X imported, Y skipped) is shown on the confirmation screen after import completes — not before. This keeps the flow fast. Users who need to verify data can do so in the lead list after import.

**What opens separately:** Nothing — linear flow. Each step replaces the previous.

**Re-sync behavior:** After initial setup, the Sheet connection is saved. Re-importing runs from the same panel: Settings → Integrations → Google Sheets → Sync now. No need to re-map columns.

---

## 7. Settings

**Goal:** Configure the business without feeling overwhelmed.

### Desktop layout
```
┌────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                        │
│  "Settings"                                                         │
├──────────────────┬─────────────────────────────────────────────────┤
│  SETTINGS NAV    │  SECTION CONTENT                                 │
│  (160px)         │  (max 680px)                                     │
│                  │                                                  │
│  Business info   │  [Selected section form / content]               │
│  Pipeline stages │                                                  │
│  Team & access   │                                                  │
│  Integrations    │                                                  │
│  Notifications   │                                                  │
│  Plan            │                                                  │
│  ─────────────── │                                                  │
│  Danger zone     │                                                  │
└──────────────────┴─────────────────────────────────────────────────┘
```

**Pipeline Stages section:**
- Drag-reorderable list. Each row: drag handle, color swatch, stage name (inline-editable), semantic flags (won / lost / follow-up / hide), delete.
- "Add stage" button below the list.

**Integrations section:**
- Google Sheets: status chip (Connected / Not connected), last sync timestamp, Configure button, Disconnect button.
- Lead Sources: website-form/API source status, source-key visibility, and setup
  entry points where enabled.
- Email (future): same pattern.

**Danger Zone section:**
- Visually separated (extra top margin, muted red border above section).
- "Delete this business" button — ghost danger style, opens a typed-confirmation modal.

---

## 8. Settings - Team & Access

**Goal:** Manage team membership, roles, and permissions from the canonical
Settings/Admin area rather than a standalone primary module.

### Desktop layout
```
┌────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                        │
│  "Settings - Team"                               [+ Invite member]  │
├────────────────────────────────────────────────────────────────────┤
│  MEMBER LIST                                                        │
│  ───────────────────────────────────────────────────────────────── │
│  [Avatar] Name + email          │  Role chip  │  Status  │  [Edit]  │
│  [Avatar] Name + email          │  Role chip  │  Status  │  [Edit]  │
│  ...                                                                │
├────────────────────────────────────────────────────────────────────┤
│  PENDING INVITES (if any)                                           │
│  email@example.com              │  Sent 2d ago  │  [Revoke]        │
└────────────────────────────────────────────────────────────────────┘
```

Clicking "Edit" on a member row opens a side panel (not a modal) with: role selector, custom permission toggles, remove from business (danger zone within the panel).

---

## 9. Business Creation / Onboarding

**Goal:** Get a new user's first business set up with minimum friction.

### Layout: Centered single-column flow (max 480px)
```
Step 1: Business name
  What's your business called?
  [Business name ________________]
                                [Next →]

Step 2: Business type
  How does your business work?
  ◉ General sales
  ○ Events & bookings
  ○ Services
  ○ Custom / Other
                         [← Back] [Next →]

Step 3: Set up your pipeline
  Your first stages are ready to go. You can customize them later.

  [Stage list preview: New → Contacted → Proposal → Won / Lost]
                         [← Back] [Go to OWOcrm →]
```

No account creation inside this flow (handled by Telegram auth or web auth layer). This flow is business-specific setup only.

---

## 10. Telegram Compact Lead View (Mobile)

**Goal:** Check on a lead quickly. Log a note. Complete a task. Move to next stage.

### Mobile screen layout
```
┌────────────────────────────────┐
│  ← Leads                  [···]│  ← Back + overflow
├────────────────────────────────┤
│  Jana Kowalska                 │  ← Lead name
│  [Follow-up ●] [In Progress]   │  ← Status pill + Stage chip
│  Owner: Marek                  │  ← Owner name
├────────────────────────────────┤
│  [Tabs: Overview | Activity | Tasks]  (Attachments absent on mobile)
├────────────────────────────────┤
│                                │
│  OVERVIEW TAB                  │
│  Phone: +48 601 234 567        │
│  Email: jana@example.com       │
│  City: Warsaw                  │
│  ────────────────────────────  │
│  Next task:                    │
│  "Send proposal"  Due: Today   │  ← Danger color if overdue
│                                │
└────────────────────────────────┘
│  [Add note]          [Complete task]│  ← Sticky bottom action bar
└────────────────────────────────┘
```

**What must be visible immediately:** Name, status, stage, owner, next task.

**Primary actions (sticky bar):** Add note (opens quick-note sheet), Complete task (confirms inline).

**What opens separately:** Stage change (bottom sheet selector), Owner assignment (bottom sheet member picker), Activity history (Activity tab scroll), Full task list (Tasks tab).

**What is NOT on this screen:** Financial data, attachments, inventory, full activity log, any configuration.
