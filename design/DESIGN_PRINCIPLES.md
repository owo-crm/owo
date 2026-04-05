# OWOcrm — Design Principles

> This document defines the UX philosophy and interaction logic of OWOcrm.
> It is not a visual guide. It is the thinking behind every design decision.

---

## 1. What OWOcrm is, from a UX perspective

OWOcrm is an operational interface for small-to-medium sales teams. It is not a marketing tool, a reporting portal, or a dashboard product. Its primary job is to make the next action clear — for every lead, every day, for every person on the team.

The product lives between incoming lead data (Meta ads, Google Sheets, manual input) and the moment a deal closes or dies. Everything in the interface must serve that gap.

---

## 2. The core UX loop

```
Lead enters → Lead is visible → Lead has an owner → Next step is obvious → Team doesn't lose follow-up
```

Every screen, every component, every piece of copy should serve one or more of these steps.
If it doesn't, it shouldn't be in the interface.

---

## 3. Five core principles

### 3.1 Clarity over completeness

Not everything that exists in the data model needs to be visible at all times. The interface should show what matters *right now*, not everything that could matter.

**In practice:**
- Lead rows show name, stage, owner, last activity, and next task. Nothing more by default.
- Financial totals appear in context, not sprinkled everywhere.
- Settings are in settings. They don't leak into operational screens.

### 3.2 Speed as a feature

The interface must feel fast — both technically and perceptually. Users should never be waiting for a screen to settle before they can act.

**In practice:**
- Skeleton states load instantly and resolve quickly.
- Primary actions are reachable in ≤2 clicks from any list view.
- No full-page transitions where a panel or modal will do.
- Filtering, sorting, and search are instant and non-blocking.

### 3.3 Ownership visibility

At any point in the interface, the user should be able to answer: *who owns this?* This applies to leads, tasks, and follow-ups. Ownership is not buried in a detail screen — it is surfaced at list level.

**In practice:**
- Owner avatar/initials are always visible in lead rows.
- Unassigned leads are visually distinct from assigned ones.
- Task lists make it explicit whose task it is, not just what the task is.

### 3.4 Compactness

The interface should not spread information across large empty surfaces. Every pixel must earn its place. Compactness is not about making things small — it is about making things dense with meaning.

**In practice:**
- Lead rows are compact, scannable, and information-rich within a fixed height.
- Detail sections expand only when needed — they don't balloon the page.
- Cards are never used just for visual breathing room.

### 3.5 Operational confidence

The user must always feel in control. They should never wonder if an action succeeded, if a lead was saved, if a sync completed. The system communicates its state clearly.

**In practice:**
- Actions produce immediate feedback (state change, toast, status update).
- Destructive actions require confirmation, but the confirmation is fast and direct.
- Errors are specific, not generic.
- Loading is graceful and never silent.

---

## 4. Fixed UX rules

These are not guidelines — they are fixed rules that do not change per screen or context.

### 4.1 Lead screen stays compact

The lead list is the most-used screen in the product. It must remain compact. No card-based lead lists, no large avatars, no decorative whitespace.

Each lead row fits within 64–72px on desktop, and contains all information needed to decide the next action without opening the lead.

### 4.2 Large sections open in modal / sheet / panel

Secondary or detail content never bloats the primary view. Lead details, activity history, settings forms, Google Sheet setup — these open in contextual panels or modals.

The primary view retains its context while secondary content appears alongside or above it.

### 4.3 Interface must guide, not overwhelm

First-time empty states must explain what to do. Flows with multiple steps (e.g. Sheet import setup) must be broken into phases. The user should never feel "lost" inside a workflow.

At the same time, the interface should not condescend to returning users with excessive tooltips and re-explanations. The guide is contextual — present when needed, invisible when not.

### 4.4 Desktop-first does not mean desktop-only

The primary surface is desktop (web browser). This means layout, information density, and interaction patterns are designed for large screens and precise pointer input first.

Telegram Mini App is a real and important surface, but it is an adaptive version of the product — not a parallel product built from mobile patterns applied back to desktop.

### 4.5 No improvisation

Every element that appears on screen should be derivable from this design documentation. The developer should never need to invent layout logic, spacing, or behavior. If something is not in the docs, it should be flagged and resolved before implementation — not improvised.

---

## 5. What the product should feel like

OWOcrm should feel like a tool used by professionals who are serious about their pipeline — not a startup toy, not a template-heavy SaaS, and not a generic CRM.

The interface should evoke:
- **Efficiency.** Tasks get done fast. The interface doesn't get in the way.
- **Confidence.** The data is real, accurate, and up to date. The system knows its state.
- **Ownership.** Someone is responsible for every lead. The interface makes that visible and reinforces it.
- **Control.** The user drives. The interface responds.

It should not evoke:
- Playfulness for its own sake.
- Flashy animations or visual tricks.
- The feeling that someone tried to make it look impressive rather than work impressively.

---

## 6. Who uses this product

The interface serves two types of users simultaneously:

**Operators** — salespeople, account managers, team leads who live in the lead list every day. They need speed, clarity, and fast action. They don't care about settings. They care about the pipeline.

**Managers / Owners** — business owners or managers who check in on the pipeline, review stats, configure the system, and onboard the team. They need clarity at a higher level, and clear paths into configuration.

The interface must serve both without requiring them to compete for screen real estate or conceptual focus. Operational patterns and management patterns are separated by navigation, not by workarounds.
