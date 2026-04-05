# OWOcrm — Design Tokens

> This document defines every design token used in OWOcrm.
> Tokens are the single source of truth for color, spacing, type, radius, shadow, and z-index.
> No values should be hardcoded in components — reference tokens instead.

---

## 1. Color System

### 1.1 Base surfaces

The background layer system uses four steps. Moving from deeper to lighter communicates elevation.

```
--color-bg           #0e0e12   Base page background. The darkest layer.
--color-surface-1    #17171d   Cards, sidebar panels, nav backgrounds.
--color-surface-2    #1f1f27   Elevated panels, modals background, secondary cards.
--color-surface-3    #272730   Hover states on surface-1 elements. Input backgrounds on focus.
--color-surface-4    #2f2f3a   Active row highlights. Selected items in lists.
```

**Logic:** Never skip more than one step between adjacent surfaces. The depth effect comes from consistent stepping, not dramatic contrast shifts.

### 1.2 Accent

One primary accent. Used for all interactive primary states.

OWOcrm's brand accent is **red** — decisive, distinctive, bold on dark surfaces.

```
--color-accent          #E53B2E   Primary brand accent. Buttons, active nav, selected indicators, focus rings.
--color-accent-hover    #F04D40   Lighter/brighter variant. Hover over accent elements.
--color-accent-pressed  #C42E23   Darker variant. Active/pressed states.
--color-accent-subtle   rgba(229, 59, 46, 0.12)   Low-opacity fill. Backgrounds behind accent content.
--color-accent-border   rgba(229, 59, 46, 0.30)   Semi-transparent border for accent-highlighted items.
```

**Logic:** The accent is a structural color, not a decorative one. It signals: "this is the thing you should look at or interact with." Use it sparingly so it retains its signal power.

> **Brand note:** The brand vector is red/cobalt. If a secondary cobalt accent is confirmed, it is added as `--color-accent-secondary` and used exclusively for informational/data states (info badges, chart lines, sync state). It does not compete with red for primary CTA attention. See VISUAL_DIRECTION.md §3.3 for the full split logic.

> **Important:** `--color-accent` (brand red) and `--color-danger` (semantic error red) are two different tokens with different roles. The brand red is used for primary actions and active states. The danger red is used for errors, destructive actions, overdue items, and lost deals. They may be visually similar but must never be conflated — a primary button and an error state should not look identical.

### 1.3 Text

```
--color-text-primary    #F0F0F4   Main content text. Names, titles, key data values.
--color-text-secondary  #8E8E9E   Supporting labels, metadata, timestamps, captions.
--color-text-muted      #4E4E5E   Placeholders, disabled text, de-emphasized info.
--color-text-inverse    #0e0e12   Text on light/accent backgrounds (e.g., inside accent buttons).
```

**Logic:** Three levels of text hierarchy. Do not introduce a fourth — it creates visual noise. If something feels like it needs a fourth level, reconsider whether it should be visible at all.

### 1.4 Borders

```
--color-border          rgba(255, 255, 255, 0.07)   Default separator lines. Subtle.
--color-border-strong   rgba(255, 255, 255, 0.13)   Card outlines, input borders.
--color-border-focus    #4F6EF7                      Focus ring. Same as accent.
```

**Logic:** Borders are barely visible by design. They mark structure, not style. Only focus border uses full opacity and accent color.

### 1.5 Semantic colors

These colors carry fixed meaning and must not be repurposed for decoration.

```
--color-success         #22C55E   Positive outcomes, won deals, completed tasks.
--color-success-subtle  rgba(34, 197, 94, 0.12)
--color-success-border  rgba(34, 197, 94, 0.28)

--color-warning         #F59E0B   Pending items, follow-up required, attention needed.
--color-warning-subtle  rgba(245, 158, 11, 0.12)
--color-warning-border  rgba(245, 158, 11, 0.28)

--color-danger          #EF4444   Errors, destructive actions, overdue items, lost deals.
--color-danger-subtle   rgba(239, 68, 68, 0.12)
--color-danger-border   rgba(239, 68, 68, 0.28)

--color-info            #38BDF8   Neutral informational states, synced, imported.
--color-info-subtle     rgba(56, 189, 248, 0.12)
--color-info-border     rgba(56, 189, 248, 0.28)

--color-neutral         #6B7280   Inactive states, closed items, neutral badges.
--color-neutral-subtle  rgba(107, 114, 128, 0.14)
--color-neutral-border  rgba(107, 114, 128, 0.28)
```

### 1.6 CRM object state colors

These map semantic colors to specific CRM object states. The mapping is fixed.

| Lead State     | Color token         | Logic |
|----------------|---------------------|-------|
| New / Fresh    | `--color-info`      | Just arrived, no action yet. Neutral informational. |
| In Progress    | `--color-accent`    | Actively being worked. Accent signals activity. |
| Follow-up      | `--color-warning`   | Needs attention. Risk of going cold. |
| Won            | `--color-success`   | Deal closed positively. |
| Lost           | `--color-danger`    | Deal closed negatively. |
| Overdue        | `--color-danger`    | A task or follow-up has passed its due date. Same as lost — requires urgent action. |
| Custom stage   | `--color-neutral`   | Default for custom stages that don't map to a semantic state. |

**Logic:** The stage color is used in: status pills on lead rows, stage selector backgrounds, pipeline stage labels. The subtle and border variants are used for chip backgrounds and outlines respectively.

---

## 2. Spacing Scale

OWOcrm uses a base-4 spacing system. All spacing values are multiples of 4px.

```
--space-1    4px
--space-2    8px
--space-3    12px
--space-4    16px
--space-5    20px
--space-6    24px
--space-8    32px
--space-10   40px
--space-12   48px
--space-16   64px
--space-20   80px
--space-24   96px
```

**Logic:** Spacing decisions should always reference this scale. Never use arbitrary pixel values. If something needs 10px, use `--space-2` (8px) or `--space-3` (12px) — whichever fits the rhythm.

**Most-used spacing values in OWOcrm:**
- `--space-4` (16px): Page horizontal padding, card internal padding, section gaps.
- `--space-3` (12px): Vertical gap between stacked elements within a section.
- `--space-2` (8px): Gap between icon and label, between chips, between inline elements.
- `--space-6` (24px): Gap between major sections or card groups.

---

## 3. Border Radius Scale

```
--radius-sm      4px    Badges, small chips, tag-like elements.
--radius-md      8px    Buttons, inputs, small cards.
--radius-lg      12px   Main cards, modals, panels.
--radius-xl      16px   Large sheet-style panels, onboarding flows.
--radius-full    9999px Pill-shaped elements (status badges, avatar chips).
```

**Logic:** Radius communicates containment and softness. Tighter radius = more structural, more precise. Larger radius = more contained, more elevated. Do not mix radius sizes within the same component family.

---

## 4. Shadow System

Shadows communicate elevation only. They are not used for decoration.

```
--shadow-card     0 1px 3px rgba(0, 0, 0, 0.35)
                  Used on cards that sit on the base surface.

--shadow-panel    0 4px 16px rgba(0, 0, 0, 0.45)
                  Used on side panels and drawers.

--shadow-modal    0 16px 48px rgba(0, 0, 0, 0.60)
                  Used on modals and dialogs that float above the page.

--shadow-popover  0 8px 24px rgba(0, 0, 0, 0.50)
                  Used on dropdowns, context menus, popovers.

--shadow-accent   0 0 20px rgba(229, 59, 46, 0.25)
                  Used on the primary action button only. Signals the primary CTA.
```

**Logic:** Shadows increase in intensity with elevation. Base cards have the lightest shadow. Modals have the heaviest. The accent glow shadow is reserved exclusively for the most important primary action button on screen — one per view.

---

## 5. Typography Scale

Font family: **Inter** (variable, with weights 400, 500, 600).
Fallback: `system-ui, -apple-system, sans-serif`.

```
--text-xs        font-size: 11px, line-height: 16px
                 Badges, micro-labels, status chips.

--text-sm        font-size: 12px, line-height: 18px
                 Secondary metadata, timestamps, captions.

--text-base      font-size: 14px, line-height: 20px
                 Default body text, table cells, form labels.

--text-md        font-size: 15px, line-height: 22px
                 Slightly emphasized content. Card titles, prominent row data.

--text-lg        font-size: 17px, line-height: 24px
                 Section headers. Modal titles.

--text-xl        font-size: 20px, line-height: 28px
                 Page-level titles (used sparingly).

--text-2xl       font-size: 24px, line-height: 32px
                 Stats, KPI values, numbers in dashboard context.
```

**Font weight tokens:**
```
--font-normal    400    Default body text.
--font-medium    500    Labels, navigation items, secondary emphasis.
--font-semibold  600    Titles, primary actions, important values.
```

**Logic:** Typography hierarchy works through three levers: size, weight, and color. A title is `--text-lg` + `--font-semibold` + `--color-text-primary`. A timestamp is `--text-sm` + `--font-normal` + `--color-text-secondary`. Never use all three levers simultaneously to differentiate every level — that creates noise.

Letter spacing: default for all sizes except `--text-xs` where `letter-spacing: 0.04em` improves badge legibility.

---

## 6. Z-Index Layers

```
--z-base         0     Normal document flow.
--z-raised       10    Sticky headers, pinned table columns.
--z-dropdown     100   Dropdowns, context menus, autocomplete lists.
--z-overlay      200   Modal backdrops.
--z-modal        300   Modal dialogs, side panels.
--z-toast        400   Toast notifications.
--z-tooltip      500   Tooltips (must appear above modals).
```

**Logic:** Each layer is spaced by 100 to allow internal z-ordering within layers without conflict. Never assign arbitrary z-index values — always reference these tokens.

---

## 7. Icon Style Rules

- Style: Outline (stroke-based). 1.5px stroke weight.
- Recommended set: **Lucide** or **Phosphor** (outline variant).
- Sizes:
  - Navigation icons: 22px
  - Standard UI icons: 20px
  - Inline with text: 16px
  - Compact row icons: 14px
- Color: Icon color follows text color rules — primary, secondary, muted, or accent.
- Filled variant: Used **only** for the active state of bottom navigation items on mobile. Never in desktop nav or inline contexts.
- No animated icons. No colored icons for decoration.
