# OWOcrm — Layout System

> This document defines desktop layout structure, spacing framework, view composition rules,
> and the logic behind how different screen types are built.

---

## 1. Desktop Layout Philosophy

OWOcrm is desktop-first. This means layout decisions are made for a large screen with precise pointer input, and then adapted for smaller surfaces — not the other way around.

The layout system is based on two principles:
- **Structural clarity:** The user always knows where content zones are and what each zone does.
- **Density with breathing room:** The interface is information-rich, but it does not feel cramped. Spacing creates rhythm — it does not create dead space.

---

## 2. Page Structure

Every page in OWOcrm shares the same outer shell:

```
┌─────────────────────────────────────────────────────┐
│  TOP NAV BAR (60px, fixed)                          │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  SIDE NAV    │  PRIMARY CONTENT AREA                │
│  (240px,     │  (scrollable, flex-grows)            │
│  fixed)      │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Top Nav Bar
- Height: 60px. Fixed. Always visible.
- Contains: business switcher (left), primary search (center), notifications + profile (right).
- Does not scroll with content.

### Side Nav
- Width: 240px. Fixed position. Does not collapse in default state.
- Contains primary navigation links and secondary module groups.
- On narrower viewports (< 1280px), can be collapsed to icon-only mode (56px width). User-triggered, state persisted.

### Primary Content Area
- Grows to fill remaining horizontal space.
- Has a fixed horizontal padding of `--space-4` (16px) on left and right.
- Max content width: **1400px** centered within the content area on very wide screens.
- This prevents extreme line lengths on ultrawide monitors.
- Scrolls vertically. The sidebar and top nav remain fixed.

---

## 3. Content Width Logic

| Context | Max width | Notes |
|---------|-----------|-------|
| Lead list | 100% of content area | Full width — needs to show multiple columns. |
| Lead detail panel | 480px | Opens as a right panel alongside the list. |
| Modals (standard) | 520px | Centered in viewport. |
| Modals (large) | 720px | For complex flows: sheet setup, permission editor. |
| Settings pages | 680px | Constrained for comfortable form reading. |
| Stats / Dashboard | 100% of content area | Charts and cards fill available space. |
| Onboarding flows | 560px | Centered in content area. |

**Rule:** Never allow form content to span the full viewport width. Reading a form field that stretches to 1400px is uncomfortable and looks unfinished. Forms and settings use constrained widths.

---

## 4. Grid and Column System

OWOcrm does not use a traditional 12-column grid for page layout. Pages are built from defined layout patterns (see Section 5), not from ad-hoc column assignments.

For internal component grids (e.g. stats cards in a dashboard, settings cards), a 3-column grid is the maximum:

```css
/* Standard 3-column card grid */
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: var(--space-4);
```

Two-column and single-column variants are used based on content type. No gutters wider than `--space-6` (24px) in grids.

---

## 5. Defined Layout Patterns

### 5.1 Full-width list view

Used for: Lead list, Task workspace, Team list.

```
┌──────────────────────────────────────────────────┐
│  PAGE HEADER (title + primary actions)   [40px]  │
├──────────────────────────────────────────────────┤
│  FILTER / SEARCH BAR                    [44px]   │
├──────────────────────────────────────────────────┤
│                                                  │
│  LIST CONTENT (rows, scrollable)                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

The list area takes full available height. No card wrappers around the list. Rows are separated by a single 1px border or subtle background alternation — not padding-heavy cards.

### 5.2 List + detail split view

Used for: Lead list with lead detail open.

```
┌─────────────────────────┬────────────────────────┐
│  LIST (48% width)       │  DETAIL PANEL (52%)    │
│                         │  (or fixed 480px wide) │
│  Compact rows           │  Scrollable panel      │
│  with selection state   │  with lead context     │
│                         │                        │
└─────────────────────────┴────────────────────────┘
```

When a lead is selected from the list, the detail panel opens in the right portion of the content area. The list does not disappear — it narrows. This lets the user navigate between leads without losing list context.

At viewport widths below 1100px, the detail panel transitions to a right-side drawer overlay instead of splitting the layout inline.

### 5.3 Dashboard / stats view

Used for: Stats Overview, Business Dashboard.

```
┌──────────────────────────────────────────────────┐
│  PAGE HEADER (period selector, filter)           │
├────────────┬───────────┬─────────────────────────┤
│  KPI card  │  KPI card │  KPI card               │
├────────────┴───────────┴─────────────────────────┤
│  CHART / PIPELINE (full width or 2-col)          │
├──────────────────────────────────────────────────┤
│  SECONDARY CARDS (2 or 3 columns)                │
└──────────────────────────────────────────────────┘
```

KPI cards sit in a row of 3 (or 4 for wider screens). Charts below them. Never stack more than two chart rows — if there are more stats, use tabs or a "view more" pattern.

### 5.4 Settings view

Used for: All settings sections.

```
┌────────────────────────────────────────────────┐
│  PAGE HEADER (section title)                   │
├───────────────────┬────────────────────────────┤
│  SETTINGS NAV     │  SETTINGS FORM / CONTENT   │
│  (160px)          │  (max 680px)               │
│                   │                            │
│  list of sections │  form fields, toggles,     │
│                   │  team member cards, etc.   │
└───────────────────┴────────────────────────────┘
```

Settings is the only section with its own secondary left navigation. The right side shows the form/content for the selected section.

### 5.5 Modal layering

```
[BASE PAGE]  →  [MODAL BACKDROP: rgba(0,0,0,0.55)]  →  [MODAL CARD]
```

Standard modal appears centered in the viewport on top of a semi-transparent backdrop. The backdrop dims but does not fully hide the base content — the user retains spatial orientation.

Modals use z-index `--z-modal`. Backdrop uses `--z-overlay`.

### 5.6 Side panel / drawer

Used for: Lead detail (at narrow viewports), complex step-by-step flows (e.g. Sheet import), contextual settings.

```
[BASE PAGE: blur(2px) + dim overlay]  →  [PANEL from right edge]
```

Panel slides in from the right edge. Width: 480px (standard), 640px (wide, for multi-step flows). The base page is dimmed but remains visible on the left.

Panels use `--z-modal`. They are scrollable internally.

---

## 6. Section Spacing Rules

Inside a page, vertical spacing between major sections follows this pattern:

```
Page header                    → --space-6 (24px) gap before first content
Between filter bar and list    → --space-3 (12px)
Between card groups/sections   → --space-6 (24px)
Inside a card/panel section    → --space-4 (16px) internal padding
Between rows within a section  → --space-2 (8px) or 1px border separator
```

**Fixed rules:**
- No section gap wider than `--space-8` (32px) in operational views. Gap is not whitespace — it is visual noise.
- No full-page "hero sections" inside operational views. Every pixel of vertical space should contain content.
- Page headers are 40px tall (title + action buttons in a single row). They do not have decorative backgrounds.

---

## 7. What desktop layout must never do

- **No endless vertical chaos.** Pages should not require excessive vertical scrolling to reach primary actions. Important actions sit within the first viewport height.
- **No oversized empty cards.** A card with a title and two lines of text inside does not need to be 180px tall. Padding should be proportional to content.
- **No mobile-first compression on desktop.** Stacked single-column layouts, large tap-targets, oversized buttons — these belong on mobile. Desktop layout uses the available horizontal space to show more information in parallel, not more whitespace.
- **No uncontrolled layering.** Modals should not open additional modals. Panels should not contain panels. Nesting depth is max 2: base page → modal/panel. If a flow requires depth > 2, redesign the flow as a sequential steps pattern.
