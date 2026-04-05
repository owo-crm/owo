# MASTER ROADMAP CHECKLIST

Status legend:
- `[ ]` Not started
- `[-]` In progress
- `[!]` Blocked
- `[x]` Closed

Rule:
- A week is closed only when every listed gate for that week is closed.

## Week 1 - Canon and Contracts
Status: `[x]`

Gates:
- `[x]` Canon Index exists and points to every current source-of-truth doc.
- `[x]` Data Model Canon is final enough for implementation without product guesswork.
- `[x]` Permission Canon is final enough for implementation without role ambiguity.
- `[x]` Lead / Task / Notification / Automation canons are aligned with each other.
- `[x]` API Contracts v1 are fixed for auth, business, leads, tasks, events, notifications.
- `[x]` Web UX Flows v1 are fixed.
- `[x]` Telegram UX Flows v1 are fixed.
- `[x]` MVP Non-Goals are explicitly written down.

Week closes when:
- there are no unresolved product ambiguities for the MVP core;
- an implementer can begin backend work without inventing behavior.

## Week 2 - OWOcrm as Source of Truth
Status: `[x]`

Gates:
- `[x]` All active canons are copied or rewritten into `OWOcrm/docs`.
- `[x]` Shared domain layer is defined.
- `[x]` Shared types for Web + Telegram are defined.
- `[x]` Naming rules are written down.
- `[x]` Migration policy is written down.
- `[x]` Release scope rules are written down.
- `[x]` Review gates are written down.
- `[x]` Team agrees that new development starts in `OWOcrm`, not in `Barowo crm`.

Week closes when:
- `OWOcrm` is the active product codebase;
- `Barowo crm` is reference/archive only.

## Week 3 - Backend MVP + Web Foundation
Status: `[ ]`

Gates:
- `[ ]` Auth works.
- `[ ]` Business context works.
- `[ ]` Leads vertical works.
- `[ ]` Tasks vertical works.
- `[ ]` Minimal event/audit log works.
- `[ ]` Web shell runs on real data, not placeholders only.
- `[ ]` Loading, empty, and error states exist for core Web flows.

Week closes when:
- a user can enter the Web app;
- select business context;
- see leads;
- open a lead;
- create or update a task;
- see the resulting event in the log.

## Week 4 - Telegram Mini App Foundation
Status: `[ ]`

Gates:
- `[ ]` Telegram auth/session works.
- `[ ]` Leads flow works through the same backend core.
- `[ ]` Tasks flow works through the same backend core.
- `[ ]` Telegram-specific behavior stays in presentation/adaptation, not duplicated business logic.
- `[ ]` Shared domain behavior stays consistent between Web and Telegram.

Week closes when:
- the same lead/task core flow can be completed in both Web and Telegram Mini App.

## Week 5 - Automation Value Loop
Status: `[ ]`

Gates:
- `[ ]` Lead import / ingestion works.
- `[ ]` Owner assignment rules work.
- `[ ]` First-touch automation works.
- `[ ]` Task queue is created from ingestion where appropriate.
- `[ ]` Dedupe rules are implemented.
- `[ ]` Repeated import behavior is defined and implemented.

Week closes when:
- a new lead can enter the system end-to-end;
- the lead does not disappear;
- the lead does not duplicate chaotically;
- the lead gets owner / next action / first-touch logic.

## Week 6 - Beta Readiness
Status: `[ ]`

Gates:
- `[ ]` Response-time metrics exist.
- `[ ]` Owner-lag metrics exist.
- `[ ]` Conversion-step visibility exists.
- `[ ]` Error visibility / observability is good enough for beta.
- `[ ]` Permission sanity check is complete.
- `[ ]` Closed beta feedback loop is defined and usable.

Week closes when:
- the first closed beta wave can be invited safely;
- it is clear what to monitor after users enter.
