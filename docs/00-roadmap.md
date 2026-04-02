# Roadmap

## Phase 1 - Canon Freeze (in barowo crm)
- Finalize business and workflow canon.
- Resolve contradictions and open questions.
- Freeze as `Canon v1.0`.

## Phase 2 - Canon Import (to OWOcrm)
- Move frozen canon into this `docs/` folder.
- Create migration mapping for each module.
- Lock source of truth to `OWOcrm/docs`.

## Phase 3 - Shared Core Build
- Build single backend/domain model for both clients.
- Implement `auth -> business context -> leads -> tasks`.
- Add event log and basic observability.

## Phase 4 - Dual Surface Delivery
- Ship Telegram Mini App using shared core.
- Ship Web surface using shared core.
- Validate parity of key flows.

## Phase 5 - Automation Loop
- Lead import and normalization.
- Owner assignment logic.
- First-contact automation and task queue.

## Phase 6 - Beta Readiness
- Stabilize error handling and permissions.
- Add core metrics and dashboards.
- Run closed beta and collect structured feedback.

## Gates
- No feature implementation before canon entry exists.
- No API changes without domain model update.
- No release candidate without scope signoff.
