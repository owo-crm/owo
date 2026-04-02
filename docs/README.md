# OWO CRM Docs

This folder is the source of truth for product and engineering decisions in `OWOcrm`.

Process:
1. Finalize canon drafts in `barowo crm`.
2. Freeze them as a version (for example `Canon v1.0`).
3. Import finalized decisions here.
4. From that point, update rules only in this folder.

Document map:
- `00-roadmap.md` - execution roadmap by phases
- `01-product-canon.md` - product goals, scope, and principles
- `02-domain-model.md` - entities, statuses, transitions, invariants
- `03-api-contracts.md` - endpoint contracts and error model
- `04-ux-flows.md` - Telegram and Web flows
- `05-engineering-rules.md` - architecture and team delivery rules
- `06-release-scope-v1.md` - what is in/out of first release
- `07-migration-barowo-to-owocrm.md` - migration mapping and checklist
- `08-open-questions.md` - unresolved decisions and owners

Definition of done for docs:
- No contradictory rules across files.
- Every entity in domain model is represented in API contracts and UX flows.
- Release scope references only canonized capabilities.
