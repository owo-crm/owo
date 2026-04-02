# Domain Model

Status: Draft  
Owner: Backend + Product  
Last updated: 2026-04-02

## Entities
- `Business`
- `Member`
- `Lead`
- `LeadStatus`
- `Task`
- `AutomationRule`
- `EventLog`

## Lead lifecycle (example)
- `imported`
- `qualified`
- `contacted`
- `in_progress`
- `won`
- `lost`

## Task lifecycle (example)
- `todo`
- `in_progress`
- `blocked`
- `done`

## Invariants
- A lead has at most one active owner.
- A task belongs to exactly one lead or one business-level context.
- Every status transition creates an event log record.

## Required transition rules
- Define allowed `LeadStatus` transitions.
- Define who can execute each transition.
- Define automatic side effects (task creation, notifications, SLA timers).

## Data ownership
- Product canon defines semantics.
- Backend schema enforces invariants.
- Clients only consume and mutate through API contracts.
