# Engineering Rules

Status: Draft  
Owner: Engineering  
Last updated: 2026-04-02

## Architecture
- One shared domain model.
- One backend API for Telegram and Web.
- UI layers can diverge, domain behavior cannot.

## Delivery rules
- No feature starts without doc references in canon/domain/contracts.
- PR must include test notes and risk notes.
- Behavior changes require docs update in same PR.

## API and data rules
- Validate input at boundary.
- Keep idempotency for retry-prone operations.
- Log all critical state transitions.

## Frontend rules
- Mobile-first for landing and Telegram-adjacent flows.
- No visual redesigns in delivery PRs unless requested.
- Keep components predictable and shallow when possible.

## Quality gates
- `npm run lint` green
- build green
- critical flow smoke checks documented
