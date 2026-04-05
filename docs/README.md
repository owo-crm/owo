# OWO CRM Docs

This folder is the active source of truth for product and engineering
decisions in `OWOcrm`.

`Barowo crm` is now the historical reference that produced the first canon
package. New product-truth updates should happen here unless a conscious canon
audit in the legacy project is needed.

## Process

1. Finalize product logic in the canon pack.
2. Merge finalized decisions into this numbered docs system.
3. Record any unresolved items in `08-open-questions.md`.
4. Start implementation only from this pack, not from scattered legacy notes.

## Document Map

- `00-roadmap.md`
  Execution roadmap and phase gates.
- `01-product-canon.md`
  Product mission, operating model, platform stance, and core workflow
  principles.
- `02-domain-model.md`
  Canonical entities, ownership boundaries, lifecycle semantics, and alignment
  rules.
- `03-api-contracts.md`
  Backend-facing contract surface for auth, business, leads, tasks, events,
  inventory, finance, and setup flows.
- `04-ux-flows.md`
  Canonical Web and Telegram flow definitions.
- `05-engineering-rules.md`
  Shared source-of-truth, naming, migration, and review rules.
- `06-release-scope-v1.md`
  First implementation scope and explicit non-goals.
- `07-migration-barowo-to-owocrm.md`
  Migration mapping and legacy demotion checklist.
- `08-open-questions.md`
  Residual unresolved decisions only.
- `09-shared-domain-layer.md`
  Shared backend/domain layering for Web and Telegram.
- `10-shared-types.md`
  Canonical cross-surface types and DTO shapes for the first implementation.
- `11-lead-source-ingestion.md`
  Canonical source model for manual, sheet, website-form, and API lead intake.
- `12-runtime-env.md`
  Runtime environment variable map for local/dev/prod behavior.
- `13-local-runbook.md`
  Practical local startup sequence: DB, migrations, seed, app, Week 3 smoke.
- `14-landing-prelaunch-checklist.md`
  Operational launch checklist for lead-capture landing mode.

## Definition Of Done For Docs

The docs pack is in a usable state only if:

- there are no contradictory product rules across files;
- every core entity in `02-domain-model.md` is represented in
  `03-api-contracts.md` and `04-ux-flows.md`;
- release scope references only canonized capabilities;
- open questions are explicit instead of being hidden as TODOs in canonical
  files.
- shared domain and shared types are defined strongly enough to start the first
  implementation pass.
