# OWOcrm - Visual Direction

> This document defines the visual identity, mood, and aesthetic direction for
> OWOcrm.

---

## 1. Recommended direction

The recommended direction is:

`Dark Precision with red/cobalt structure`

This means:
- deep neutral-dark surfaces
- precise typography and restrained chrome
- brand red as the main interactive accent
- cobalt only as a secondary informational/data accent
- visual depth through layering, not decorative effects

The product should feel:
- premium
- sharp
- operational
- serious
- modern

It should not feel:
- flashy for the sake of flash
- neon SaaS
- lifestyle-tech
- mobile-first
- like a generic dashboard template

---

## 2. Core character

OWOcrm is a tool for operators and managers.
The interface should therefore feel:
- focused
- competent
- dense enough to be useful
- calm enough for long sessions

Visual weight should come from:
- typography hierarchy
- surface layering
- controlled contrast
- accent used as signal

Not from:
- decorative gradients
- colorful panels
- excessive glow
- oversized empty cards

---

## 3. Surface model

The product lives natively on dark surfaces.

Recommended surface logic:
- background = darkest layer
- panels and cards = one step lighter
- active or elevated elements = one step lighter again

Use a small number of surface steps and keep them consistent.
Floating elements like modals and dropdowns may use subtle shadow only to show
elevation.

---

## 4. Accent system

### 4.1 Primary accent

The confirmed primary accent is:

- `#E53B2E` as brand red

Use it for:
- primary buttons
- active navigation state
- selected state indicators
- focus rings
- key action emphasis

Do not use brand red as the semantic error color by default.
The design token system should keep:
- `--color-accent` = brand red
- `--color-danger` = semantic error red

### 4.2 Secondary accent

Cobalt is confirmed only as a secondary informational/data accent.

Use cobalt for:
- informational badges
- chart/data differentiation
- sync or integration informational states

Do not use cobalt for:
- primary CTA actions
- primary active nav state
- competing accent borders across the interface

---

## 5. Typography

Typography is the primary visual instrument of the product.

Rules:
- use a modern grotesk sans
- rely on weight, spacing, and contrast for hierarchy
- avoid decorative font choices
- avoid mixing multiple UI font families

Inter is acceptable for development.
Geist or IBM Plex Sans are strong candidates for a more distinctive production
character.

---

## 6. Iconography

Icons are functional, not decorative.

Rules:
- outline-first icon style
- consistent stroke weight
- slightly larger icons in navigation than in inline content
- no playful icon animations
- filled icons only when a selected state truly needs it

---

## 7. Forbidden patterns

The following patterns are out of bounds:

- decorative rainbow or multicolor borders
- gradient-heavy section backgrounds in product UI
- glassmorphism as a system pattern
- loud glow around every interactive element
- overly rounded playful cards
- giant dead-space hero layouts inside the app
- illustration-driven empty states
- multiple primary accent colors competing for attention

---

## 8. Sanity check

If a screen looks like:
- serious operational software
- something a team could use all day
- a product that values focus over showmanship

then it is probably in the right direction.

If it looks like:
- a marketing site
- a template dashboard
- a Dribbble experiment

then it has drifted away from the intended visual system.
