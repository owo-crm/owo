# OWOcrm — Component System

> This document defines the key UI components of OWOcrm: their role, visual logic,
> and where they should and should not be used.
> Components are building blocks — they do not define layouts or page structure.

---

## 1. Buttons

### Primary Button
**Role:** The single most important action on a given view or modal.

**Visual logic:**
- Background: `--color-accent`
- Text: `--color-text-inverse` (near-black)
- Font: `--text-md`, `--font-semibold`
- Height: 40px (desktop), 48px (mobile)
- Radius: `--radius-md` (8px)
- Shadow: `--shadow-accent` (accent glow — signals CTA)
- Hover: background `--color-accent-hover`, shadow intensifies slightly
- Active/pressed: background `--color-accent-pressed`, scale 0.98

**Where to use:** One per modal, one per form section, one primary page action (e.g., "Import leads", "Save changes", "Add lead").

**Where NOT to use:** Inside table rows. Inside card headers. As a "view" or "open" action — use a link-style interaction instead. Never stack two primary buttons side by side.

---

### Secondary Button
**Role:** Supporting actions that are important but not the primary CTA.

**Visual logic:**
- Background: `--color-surface-2`
- Border: 1px solid `--color-border-strong`
- Text: `--color-text-primary`
- Font: `--text-base`, `--font-medium`
- Height: 36px (desktop)
- Radius: `--radius-md`
- Hover: background `--color-surface-3`

**Where to use:** Alongside a primary button ("Save" primary, "Cancel" secondary). In toolbars. As page-level secondary actions.

**Where NOT to use:** As the only action on a page (promote to primary). For destructive actions (use Danger button).

---

### Ghost Button
**Role:** Low-emphasis actions that exist but shouldn't draw attention.

**Visual logic:**
- No background, no border
- Text: `--color-text-secondary`
- Font: `--text-base`, `--font-medium`
- Hover: text `--color-text-primary`, background `--color-surface-2`

**Where to use:** "Cancel" in inline forms. "View all" links. Navigation-adjacent actions.

**Where NOT to use:** As a primary action. In situations where the user might not notice it exists.

---

### Danger Button
**Role:** Destructive or high-consequence actions.

**Visual logic:**
- Background: `--color-danger-subtle`
- Border: 1px solid `--color-danger-border`
- Text: `--color-danger`
- Hover: background: `--color-danger` at 20% opacity
- In confirmation modals only: can become a solid danger background button

**Where to use:** Delete lead, delete business, remove team member — inside a confirmation modal.

**Where NOT to use:** Inline in lists. As the first visible action on a view. Without a confirmation step.

---

## 2. Chips

**Role:** Compact interactive selectors representing a single value with an optional action.

**Visual logic:**
- Height: 28px
- Radius: `--radius-md` (8px) for category chips; `--radius-full` for status chips
- Background: semantic color subtle variant
- Border: semantic color border variant
- Text: `--text-sm`, `--font-medium`, matching semantic color
- Optional: left icon (14px), right close/remove icon (14px)

**Types:**
- Status chip (lead stage, lead status): color-coded, no close icon.
- Filter chip (active filter in filter bar): has close icon. Clicking close removes filter.
- Selection chip (owner, assignee selector): shows avatar + name. Clickable to change.

**Where to use:** Status indicators, active filter tags, selected value display in compact contexts.

**Where NOT to use:** As navigation. As large category headers. With decorative colors that don't carry semantic meaning.

---

## 3. Tabs

**Role:** Switch between views within the same context (e.g., Lead Detail tabs).

**Visual logic:**
- Container: full-width horizontal strip, 40px height, border-bottom 1px `--color-border`
- Tab item: text label only (`--text-base`, `--font-medium`)
- Idle: `--color-text-secondary`
- Active: `--color-text-primary`, with a 2px bottom border in `--color-accent`
- Hover: `--color-text-primary`
- No background changes on tab items — the active indicator is the only visual change

**Where to use:** Lead detail panels. Settings page sections if needed.

**Where NOT to use:** As top-level navigation (that's the sidebar). Inside modals (use segmented control instead if needed). For more than 6 tabs (split into sub-navigation instead).

---

## 4. Segmented Controls

**Role:** Toggle between mutually exclusive views or filter modes. Fewer options than tabs (2–4).

**Visual logic:**
- Container: `--color-surface-2` background, `--radius-md`, 4px padding
- Segment item: 32px height, `--radius-sm`
- Idle: no background, `--color-text-secondary` label
- Active: `--color-surface-4` background, `--color-text-primary` label

**Where to use:** "My tasks / All tasks" toggle. "This week / This month" view toggles. "List / Grid" mode switches (if applicable).

**Where NOT to use:** With more than 4 options (use tabs or a dropdown instead). As navigation between major modules.

---

## 5. Fields (Text Inputs)

**Role:** Single-line text entry.

**Visual logic:**
- Height: 40px (desktop), 48px (mobile)
- Background: `--color-surface-1`
- Border: 1px solid `--color-border-strong`
- Radius: `--radius-md`
- Text: `--text-md`, `--color-text-primary`
- Placeholder: `--color-text-muted`
- Focus state: border color `--color-border-focus`, background `--color-surface-3`
- Error state: border color `--color-danger`, error message below in `--color-danger`, `--text-sm`
- Optional left icon (16px): only for search fields or fields with clear visual meaning

**Where to use:** All text input scenarios.

**Where NOT to use:** For multi-line content (use Textarea). For selecting from a fixed list (use Select).

---

## 6. Selects / Dropdowns

**Role:** Select one value from a list.

**Visual logic:**
- Same height and border as text inputs
- Shows selected value + chevron-down icon (right-aligned, 16px, muted)
- On click: dropdown panel slides below the field, `--shadow-popover`, `--color-surface-2` background
- Dropdown item height: 36px, left padding `--space-3`, hover `--color-surface-3`
- Selected item in dropdown: accent color text + checkmark icon

**Where to use:** Stage selection in forms, owner assignment in forms, filter dropdowns.

**Where NOT to use:** For actions (use a button + dropdown menu instead). For 2-option choices (use segmented control).

---

## 7. Cards

**Role:** Group related content with visual containment.

**Visual logic:**
- Background: `--color-surface-1`
- Border: 1px solid `--color-border`
- Radius: `--radius-lg` (12px)
- Padding: `--space-4` (16px)
- Shadow: `--shadow-card` (optional, used when card sits on top of another surface)

**Where to use:** KPI stat cards in dashboard. Settings section containers. Empty state containers.

**Where NOT to use:** As lead list rows (use table rows). As task rows. For wrapping every small piece of content individually. Cards should contain meaningful grouped content — not single lines.

---

## 8. List Rows

**Role:** A single item in a data list (lead, task, team member, file).

**Visual logic:**
- Height: 60px (desktop lead/task rows), 48px (compact rows in panels)
- No card border or radius — rows are separated by 1px borders only
- Background: transparent by default; `--color-surface-3` on hover; `--color-surface-4` when selected
- Left accent bar: 2px solid `--color-accent` when selected
- Padding: 0 `--space-4`

**Where to use:** All list-type data views.

**Where NOT to use:** Inside modals where there are fewer than 3 items (use a simpler layout). For content that needs visual grouping (use cards).

---

## 9. Detail Rows

**Role:** Label + value pairs inside lead detail, settings, or summary panels.

**Visual logic:**
- Two-column layout: label (40% width, `--color-text-secondary`, `--text-sm`) + value (60% width, `--color-text-primary`, `--text-base`)
- Height: 36px per row
- Bottom border 1px `--color-border` between rows
- Editable rows: value is clickable (underline on hover), triggers inline edit field or picker

**Where to use:** Lead detail overview, settings form read-states, summary panels.

**Where NOT to use:** Inside tables. As the primary display for long content (use a full text block instead).

---

## 10. Badges / Status Pills

**Role:** Compact, non-interactive label communicating status or category.

**Visual logic:**
- Height: 22px
- Radius: `--radius-full`
- Font: `--text-xs`, `--font-semibold`, `letter-spacing: 0.04em`
- Colors: background = semantic subtle color, text = semantic base color, border = semantic border color
- No icons inside badges unless strictly necessary (stage badges may have no icon; overdue badge may have a clock icon at 12px)

**Where to use:** Lead status in list rows. Stage labels in chips. Task priority indicators. "New" / "Overdue" / "Won" identifiers.

**Where NOT to use:** As buttons (badges are non-interactive). For long text (truncation inside a badge is unacceptable — use a chip with visible text only).

---

## 11. Top Bars (Desktop + Mobile)

Desktop top nav and mobile top bar follow different patterns (see NAVIGATION_AND_INFORMATION_ARCHITECTURE.md), but share these rules:
- Fixed position, always visible
- Never obscured by page content
- Business context always present
- Consistent height (60px desktop, 56px mobile)

---

## 12. Side Panels / Drawers

**Role:** Secondary content surface that appears alongside (or over) the primary content.

**Visual logic:**
- Background: `--color-surface-1`
- Left border: 1px solid `--color-border`
- Shadow: `--shadow-panel` on the left edge
- Radius: none on edges that touch viewport bounds; `--radius-lg` on the exposed top corner (mobile bottom sheet only)
- Width: 480px (standard), 640px (wide flows)
- Internal padding: `--space-4`
- Always scrollable internally

**Where to use:** Lead detail at narrower viewports, multi-step setup flows, contextual settings.

**Where NOT to use:** For very short content (use a modal). As a primary navigation element. Nested inside another panel.

---

## 13. Modals / Dialogs

**Role:** Focused overlay for actions that require full user attention and input.

**Visual logic:**
- Backdrop: `rgba(0,0,0,0.55)`, `--z-overlay`
- Modal card: `--color-surface-2` background, `--shadow-modal`, `--radius-xl` (16px)
- Width: 520px (standard), 720px (large)
- Header: modal title (`--text-lg`, `--font-semibold`) + close button (×, top right)
- Footer: action buttons, right-aligned (primary + secondary)
- Content area: scrollable if content overflows; max-height ~80vh

**Where to use:** Confirmations, form-based creation/editing flows, short focused workflows.

**Where NOT to use:** For content that could be inline. For flows with more than 5 steps (use a full panel or a dedicated page instead). Nested modals are prohibited.

---

## 14. Bottom Sheets (Mobile only)

**Role:** Mobile equivalent of a modal. Slides up from the bottom edge.

**Visual logic:**
- Drag handle: 4px × 32px pill, centered, `--color-border-strong` color
- Background: `--color-surface-2`
- Top radius: `--radius-xl` (16px)
- Heights: partial (~65% screen), nearly full (~90% screen), full screen (pushed as a new view)
- Dismissable by drag down or backdrop tap

**Where to use:** All overlay content on mobile.

**Where NOT to use:** For content that naturally belongs in a new full screen (use push navigation instead). Nested sheets are prohibited.

---

## 15. Empty States

**Role:** Explain what a view shows when it has no content, and guide the user to action.

**Visual logic:**
- Centered within the content area
- No illustration (no cartoon figures, no decorative blobs)
- Optional: a single large muted icon (48px, `--color-text-muted`)
- Title: `--text-lg`, `--font-semibold`, `--color-text-primary`
- Description: `--text-base`, `--color-text-secondary`, max 2 lines
- CTA button (primary or secondary) immediately below description

**Types:**
- First-time empty state: "No leads yet. Import from Google Sheet." → [Import] button + [Add manually] secondary
- Filtered empty state: "No leads match these filters." → [Clear filters] link
- No access / loading error: "Could not load leads." → [Retry] button

**Where to use:** Any list or content area that can have zero items.

**Where NOT to use:** As decorative separators. As a placeholder while content is loading (use skeleton state instead).

---

## 16. Loading / Skeleton States

**Role:** Visual placeholder while content is loading.

**Visual logic:**
- Skeleton elements: rounded rectangles with `--color-surface-2` base, animated shimmer using `--color-surface-3`
- Shimmer direction: left-to-right, 1.5s loop
- Skeleton shape mirrors the actual content shape (row height, column widths)
- Duration before skeleton appears: 0ms (instant). Do not delay skeleton appearance.
- Duration after data loads: skeleton fades out at 150ms, content fades in at 150ms

**Where to use:** Initial page load, list refresh, panel open.

**Where NOT to use:** For micro-interactions (button loading state uses a spinner, not skeleton). For content that loads in under 300ms (suppress skeleton entirely — just show content).

---

## 17. Inline Warnings and Error States

**Role:** Communicate a problem or caution state without interrupting the user's flow.

**Visual logic:**
- Inline warning bar: `--color-warning-subtle` background, `--color-warning-border` left border (3px), `--color-warning` icon + text
- Inline error bar: same with danger semantic colors
- Font: `--text-sm`, `--font-medium`
- Dismiss button: optional, ghost × on the right

**Where to use:** At the top of a form if a form-wide error occurs. Within a section if a specific item has an issue (e.g., "This stage cannot be deleted — 4 leads are in it."). In Sheet Sync flow to communicate mapping issues.

**Where NOT to use:** As toast notifications (use Toast component). As blocking modal alerts for non-critical warnings.

---

## 18. Activity / Event Items (Timeline)

**Role:** Display a single event in the lead's activity history.

**Visual logic:**
- Layout: left icon column (16px icon, `--color-text-muted`) + content column
- Vertical connector line between items: 1px dashed `--color-border`
- Content: action description (`--text-base`, `--color-text-primary`) + author + timestamp (`--text-sm`, `--color-text-secondary`)
- Special items: notes have a slightly lighter background `--color-surface-2` behind the text block, with `--radius-sm`

**Types:**
- Note added
- Status changed
- Owner assigned / changed
- Task created / completed
- Lead imported (from sheet)
- Email sent / received (future)
- File uploaded

**Where to use:** Lead detail Activity tab only.

**Where NOT to use:** As a general notification list. As a page-level feed.
