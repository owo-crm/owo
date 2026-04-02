# Migration: barowo crm -> OWOcrm

Status: Draft  
Owner: Product + Engineering  
Last updated: 2026-04-02

## Goal
Move only finalized, canonized decisions from legacy workspace to target workspace.

## Migration principles
- Do not copy historical noise.
- Transfer decisions, not drafts.
- Preserve one source of truth after import.

## Mapping table template
| Area | barowo source | OWO target | Action | Owner | Status |
|---|---|---|---|---|---|
| Product canon |  | `docs/01-product-canon.md` | import/update |  |  |
| Domain model |  | `docs/02-domain-model.md` | import/update |  |  |
| API contracts |  | `docs/03-api-contracts.md` | import/update |  |  |
| UX flows |  | `docs/04-ux-flows.md` | import/update |  |  |
| Engineering rules |  | `docs/05-engineering-rules.md` | import/update |  |  |
| Scope v1 |  | `docs/06-release-scope-v1.md` | import/update |  |  |

## Checklist
- [ ] Canon v1.0 is frozen in barowo.
- [ ] Each section imported into corresponding file in `OWOcrm/docs`.
- [ ] Contradictions resolved and logged.
- [ ] Owners assigned for unresolved items.
- [ ] Post-migration edits happen only in `OWOcrm`.
