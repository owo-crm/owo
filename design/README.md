# OWOcrm - Design Documentation Pack

> Visual and UX source of truth for OWOcrm interface development.
> This pack defines the design decisions, patterns, and rules that
> implementation should follow.

---

## How to use this pack

Read documents in the order listed below. Earlier documents constrain later
ones.

1. Start with `DESIGN_PRINCIPLES`.
2. Read `VISUAL_DIRECTION` and `DESIGN_TOKENS`.
3. Read `LAYOUT_SYSTEM` and `NAVIGATION_AND_INFORMATION_ARCHITECTURE`.
4. Use `DESKTOP_UX_PATTERNS`, `COMPONENT_SYSTEM`, and `SCREEN_BLUEPRINTS`
   while implementing screens.
5. Refer to `MOBILE_AND_TELEGRAM_ADAPTATION` for the Mini App surface.
6. Refer to `MOTION_GUIDELINES` and `CONTENT_AND_COPY_UI_RULES` for motion and
   copy rules.
7. Use `DESIGN_NON_GOALS` as a final anti-pattern check.

---

## Document index

| File | Purpose |
|---|---|
| [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) | Core UX philosophy, fixed rules, operator vs manager patterns |
| [VISUAL_DIRECTION.md](./VISUAL_DIRECTION.md) | Visual identity, color direction, accent usage, forbidden patterns |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Colors, spacing, radius, shadow, typography, z-index, icons |
| [LAYOUT_SYSTEM.md](./LAYOUT_SYSTEM.md) | Desktop layout shell, page width rules, layout patterns |
| [NAVIGATION_AND_INFORMATION_ARCHITECTURE.md](./NAVIGATION_AND_INFORMATION_ARCHITECTURE.md) | Module structure, navigation, business switcher, Web vs Telegram IA |
| [DESKTOP_UX_PATTERNS.md](./DESKTOP_UX_PATTERNS.md) | Canonical patterns for leads, tasks, stats, settings, sync |
| [MOBILE_AND_TELEGRAM_ADAPTATION.md](./MOBILE_AND_TELEGRAM_ADAPTATION.md) | Telegram Mini App adaptation rules and compactness constraints |
| [COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md) | Components, roles, visual logic, usage boundaries |
| [SCREEN_BLUEPRINTS.md](./SCREEN_BLUEPRINTS.md) | Blueprint-level screen structure for primary screens and flows |
| [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md) | Motion rules, transitions, timing, forbidden motion |
| [CONTENT_AND_COPY_UI_RULES.md](./CONTENT_AND_COPY_UI_RULES.md) | UI tone, labels, buttons, empty states, copy anti-patterns |
| [DESIGN_NON_GOALS.md](./DESIGN_NON_GOALS.md) | Explicit design anti-patterns |

---

## Key decisions at a glance

**Product type:** Desktop-first web CRM. Telegram Mini App is an adaptive field
surface, not a primary product.

**Visual direction:** Dark Precision with brand red as the main accent and
cobalt only as a secondary informational accent.

**Primary accent:** Brand red `#E53B2E`.

**Layout:** Fixed sidebar (240px) plus top nav (60px) plus scrollable content
area. Max content width 1400px.

**Navigation:** 4 primary modules: Leads, Tasks, Stats, Settings. Team lives
inside Settings/Admin in Web v1.

**Lead list:** Table rows, not cards. Owner, stage, and next task must remain
visible.

**Modals:** Never nested. Maximum depth is base page plus one modal or panel.

**Copy tone:** Sharp, clear, professional. No marketing language inside the
product.

---

## Assumptions flagged in this pack

- Font choice beyond Inter still needs final confirmation.
- Email Center remains later-phase and can stay blueprint-only for now.
- Billing/Plan remains future-facing and is not part of MVP UI scope.
