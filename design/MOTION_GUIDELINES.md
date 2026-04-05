# OWOcrm — Motion Guidelines

> This document defines how and when motion is used in OWOcrm.
> Motion is a communication tool. Every animation must serve a purpose.
> If an animation could be removed without losing information, it should be questioned.

---

## 1. Motion philosophy

OWOcrm is an operational tool. Users interact with it under time pressure and cognitive load. Motion must:

- Communicate what is happening (state change, navigation, loading)
- Orient the user spatially (where did that panel come from?)
- Confirm that an action was received

Motion must NOT:
- Entertain
- Perform without meaning
- Add visual complexity to a already-dense interface
- Slow the user down

**Default posture:** If in doubt, don't animate. Speed beats elegance in an operational product.

---

## 2. Timing and easing

All motion uses a small set of timing values. Nothing outside this set.

```
--duration-instant    100ms   Micro-interactions: button press, checkbox tick
--duration-fast       160ms   Hover state transitions, dropdown open/close
--duration-medium     220ms   Modal enter/exit, panel slide, page transitions
--duration-slow       300ms   Complex state changes that need visual clarity
```

Easing:
```
--ease-out       cubic-bezier(0.16, 1, 0.3, 1)    Enter transitions. Fast start, gentle settle.
--ease-in        cubic-bezier(0.4, 0, 1, 1)        Exit transitions. Smooth leave.
--ease-standard  cubic-bezier(0.4, 0, 0.2, 1)      State changes within the page.
```

Never use `linear` easing for visible UI transitions. It reads as mechanical and cheap.

---

## 3. Page enter

When a new page loads (navigation between modules):

- The outgoing page fades out: `opacity 1→0`, `--duration-fast`, `--ease-in`
- The incoming page fades in: `opacity 0→1`, `--duration-medium`, `--ease-out`
- Optionally: incoming page also has a subtle vertical translate: `translateY(6px)→translateY(0)` simultaneously with fade

This is the most minimal acceptable transition. The goal is to acknowledge the navigation, not animate it.

No slide-in-from-the-right page transitions on desktop. That is a mobile navigation pattern.

---

## 4. Section and content reveal

When a panel, tab content, or section becomes visible:

- Fade in: `opacity 0→1`, `--duration-fast`, `--ease-out`
- Optional subtle translate: `translateY(4px)→translateY(0)` simultaneously

When content within a tab changes (tab switch):
- The previous tab content fades out instantly (no animation needed)
- The new tab content fades in: `opacity 0→1`, `--duration-fast`

No elaborate "slide between tabs" animations. Tab switching must feel instant.

---

## 5. Modal enter and exit

**Modal enter:**
- Backdrop: `opacity 0→1`, `--duration-fast`, `--ease-out`
- Modal card: `opacity 0→1` + `scale(0.97)→scale(1)`, `--duration-medium`, `--ease-out`

**Modal exit:**
- Modal card: `opacity 1→0` + `scale(1)→scale(0.97)`, `--duration-fast`, `--ease-in`
- Backdrop: `opacity 1→0`, `--duration-fast`, `--ease-in`

The scale effect is subtle (0.97, not 0.9). It gives the modal a sense of lifting into and settling back, without being dramatic.

---

## 6. Side panel / drawer enter and exit

**Enter (slide from right):**
- Backdrop: `opacity 0→1`, `--duration-fast`, `--ease-out`
- Panel: `translateX(100%)→translateX(0)`, `--duration-medium`, `--ease-out`

**Exit:**
- Panel: `translateX(0)→translateX(100%)`, `--duration-medium`, `--ease-in`
- Backdrop: `opacity 1→0`, `--duration-fast`

No bounce. No spring overshoot. The panel enters firmly and exits cleanly.

---

## 7. Bottom sheet enter and exit (Mobile)

**Enter (slide from bottom):**
- Backdrop: `opacity 0→1`, `--duration-fast`, `--ease-out`
- Sheet: `translateY(100%)→translateY(0)`, `--duration-medium`, `--ease-out`

**Exit:**
- Sheet: `translateY(0)→translateY(100%)`, `--duration-medium`, `--ease-in`
- Backdrop: `opacity 1→0`, `--duration-fast`

The sheet enter should feel like a smooth slide up — not a bounce, not a spring. Telegram Mini App conventions favor this feel.

**Drag to dismiss:**
- Sheet follows touch position (real-time, no animation while dragging)
- On release below dismiss threshold: sheet snaps to `translateY(100%)` with `--duration-fast`
- On release above dismiss threshold: sheet snaps back to `translateY(0)` with `--duration-fast`

---

## 8. Hover and focus states

These are UI state changes, not transitions. They should be fast and invisible as "animation."

```
hover (background change)     --duration-instant, --ease-standard
hover (text color change)     --duration-instant, --ease-standard
focus ring appearance         --duration-instant
dropdown open                 --duration-fast, --ease-out
dropdown close                --duration-fast, --ease-in
```

Focus rings must never animate — they appear instantly when focused. A delayed focus ring is an accessibility problem.

---

## 9. Loading transitions

**Skeleton state → content:**
- Skeleton fades out: `opacity 1→0`, `--duration-fast`
- Content fades in: `opacity 0→1`, `--duration-fast`
- These are staggered by 50ms: skeleton exits first, then content enters.

**Skeleton shimmer animation:**
- Direction: left-to-right sweep
- Duration: 1.5s, looping
- This is the only looping animation in the product.

**Button loading state (after click):**
- Button label replaced by a spinner (16px, border-based CSS spinner)
- Button disabled during loading
- On completion: spinner replaced by label or a checkmark (checkmark visible for 800ms, then reverts to normal label)

---

## 10. Micro-interactions

### Button press
```
transform: scale(0.97), --duration-instant
```
Releases back to `scale(1.0)` on mouse up. This gives tactile feedback for click actions.

### Checkbox check (task complete)
- Checkbox: border fades, background fills, checkmark draws in: `--duration-fast`
- Row: `opacity` transitions to `0.5`, title gets strikethrough — `--duration-fast`

### Toast notification
- Enter: `opacity 0→1` + `translateY(-8px)→translateY(0)` from bottom-right corner, `--duration-fast`
- Auto-dismiss after 3s
- Exit: `opacity 1→0` + `translateY(0)→translateY(-8px)`, `--duration-fast`

### Status pill change (stage change)
- Old pill: `opacity 1→0`, `--duration-instant`
- New pill: `opacity 0→1`, `--duration-fast`
- No color animation between states — just a discrete swap.

---

## 11. What is permitted

- Fade in/out on content that appears and disappears
- Slide for panels and drawers that enter from a spatial edge
- Scale for modals (subtle, ≤ 3% scale range)
- Shimmer for skeleton loading
- Button press scale feedback
- Smooth hover state transitions

---

## 12. What is prohibited

- **Bouncing or spring animations** on any interactive element. OWOcrm is not playful.
- **Staggered list item animations** (i.e., each lead row fading in one after another on list load). This looks like a portfolio website, not a CRM.
- **Page-level slide transitions** on desktop. Left-to-right page slides are a mobile pattern.
- **Looping animations** outside of skeleton shimmer and spinner states.
- **Transitions on typography** (animated font-size, animated font-weight changes).
- **CSS transforms used purely for aesthetics** (e.g., parallax, 3D tilts on hover).
- **Animated gradients** as backgrounds or decorative elements.
- **Icon morphing animations** (icon changes shape to indicate state — too complex, too slow).
- **Long-duration transitions** (anything over 320ms for a UI element entering). The maximum for any single motion sequence is 400ms total.

---

## 13. Reduced motion

All animations must respect the `prefers-reduced-motion` media query.

When reduced motion is preferred:
- All `transform` transitions are removed
- `opacity` transitions remain (they are not perceived as "motion" for most users)
- Skeleton shimmer is replaced with a static `--color-surface-3` background (no animation)
- Bottom sheet / panel / modal still use opacity transitions only, no translate

```css
@media (prefers-reduced-motion: reduce) {
  /* Remove all transform-based animations */
  /* Keep opacity transitions at --duration-fast */
  /* Remove shimmer */
}
```

This is not optional. It is a baseline accessibility requirement.
