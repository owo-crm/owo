# OWOcrm — Design Non-Goals

> This document defines what OWOcrm's design system explicitly does not do.
> Non-goals are as important as goals. They keep the design honest and prevent scope creep.

---

## 1. What the design system does not do

### It does not design for mobile-first

OWOcrm is desktop-first. This is a deliberate product decision, not an oversight. The interface is designed for large screens and precise pointer input. Mobile adaptation (Telegram Mini App) is derived from the desktop design — it is not the foundation.

Consequence: mobile-first interaction patterns (large tap targets everywhere, single-column layouts, bottom-heavy navigation, oversized buttons) do not appear in desktop views.

---

### It does not try to look like a landing page

Inside the product, there are no hero sections, no full-bleed background images, no marketing headlines. The interface is an operational tool. It looks like a tool, not a product page.

Consequence: Typographic hierarchy in the interface serves information clarity, not attention capture. There are no "wow" moments in the product for their own sake.

---

### It does not prioritize visual novelty

The design does not aim to look like it was created for a design portfolio or a Dribbble shot. It aims to work well for someone opening it every day. This means:

- Visual decisions are justified by usability, not by trendiness.
- Effects that exist purely because they look cool (glass morphism, gradient blobs, soft-shadow overuse, neon glows everywhere) are not used.
- If a design element cannot be explained by a functional reason, it is removed.

---

### It does not create information hierarchies through color alone

Color is used as a signal reinforcer — not as the sole carrier of meaning. Every color-coded element also communicates its state through shape, label, or position. This is both an accessibility requirement and a design quality standard.

Consequence: Status pills have text labels, not just colors. Error states have textual messages, not just red borders.

---

### It does not allow decorative patterns to accumulate

There is no "design debt" accepted in the form of: one-off gradients here, one unusually sized card there, a special section that "needed" an extra background color. Every exception to the token system must be justified and documented. Undocumented one-off styles are treated as bugs.

---

## 2. Anti-patterns that are explicitly banned

### Giant dead space

Large empty areas inside cards, panels, or between sections with no functional purpose. Space in OWOcrm is either filled with meaningful content or collapsed entirely — it is not used as a stylistic device.

**Banned:** A card with a 40px top padding, a small icon in the middle, and a title. A section with 80px margin above it because it "needed room to breathe."

---

### Generic SaaS cards everywhere

Cards as the default container for all content, regardless of type. Not everything needs to be a card. Lists are not cards. Form fields are not cards. Actions are not cards.

**Banned:** Wrapping each lead in an individual card. Putting each KPI stat in a large padded card when a tight number + label would communicate the same thing. "Card soup" — a grid of equally-sized cards for everything on the screen.

---

### Decorative chaos

Multiple competing accent colors, gradient borders, colored section backgrounds, decorative separators, branded pattern fills, and other visual noise that does not serve the information architecture.

**Banned:** A stats section with a blue-to-purple gradient header. A pipeline card with a colored left-border accent in a different color for each stage. Icon clusters placed in sections to "add visual interest."

---

### Too many gradients without structure

Gradients that are applied without a functional rationale — as ambient decoration, as section backgrounds, or as borders. The single acceptable use of a gradient in OWOcrm is as a very subtle overlay on a chart visualization, if the chart library requires it for visual differentiation.

**Banned:** Full-bleed gradient section backgrounds. Gradient card borders as a design accent. Gradient on the page background. "Glow" effects on cards that are not primary action buttons.

---

### Long unreadable lead screens

Lead detail that presents everything at once in a single scrollable column — dozens of fields, full activity history, all tasks, all attachments, all financial data — requiring the user to scroll through a wall of information to find what they need.

**Banned:** A 4000px tall lead detail page. All sections expanded by default. Inline activity log that pushes content 2 screens down. Financial data block, inventory block, and activity block all in one column with no organization.

**Required instead:** Tab-based organization. Sections collapsed by default where appropriate. The first screen of any view must contain the most actionable information.

---

### Mobile layouts stretched to desktop

Taking a mobile-first layout and applying it to desktop without adaptation. Single-column layouts where a split view or multi-column view would serve the user better. Oversized elements that fill horizontal space because they were designed for a 390px screen. Touch-sized tap targets at desktop scale.

**Banned:** A full-width 48px-height lead list row with only name and status (everything else removed because it "didn't fit" a mobile-first design). A 100% width form with two fields per screen. Centered small cards that leave 600px of unused space on both sides.

---

### Nested modals

A modal opening another modal. This creates spatial disorientation, stacking context problems, and forces users to navigate multiple dismissal paths. Every flow that feels like it needs a modal-in-modal should be redesigned as: a multi-step modal, a full-side panel, or a new full-screen view.

**Banned without exception.** If a developer or designer proposes a nested modal, the flow must be redesigned.

---

### Inline configuration in operational views

Settings, stage configuration, permission editing, and integration setup do not belong inside the lead list, the task workspace, or any operational view. These are accessed from Settings — a dedicated module. Mixing configuration into operational views creates cognitive overload and erodes the product's information architecture.

**Banned:** "Add stage" button inside the Lead list. Permission checkboxes appearing in the lead detail panel. Notification settings in the task view.

---

### Unlabeled icon buttons

Icon buttons without labels or tooltips in critical or non-obvious contexts. Icons must either be universally recognizable (close × button, search 🔍) or accompanied by a label. An icon-only button for "sync sheet" or "export data" is a UX failure.

**Banned:** Action toolbars with 6 unlabeled icons. Icon-only buttons in mobile views where space is used as justification for removing the label.

---

## 3. Summary: what this design system is not

It is not:
- A showcase of design trends
- A mobile-first adaptation
- A generic SaaS template
- A marketing surface inside the product
- A collection of visual experiments

It is:
- A precise, intentional system for an operational CRM used by working professionals every day.
