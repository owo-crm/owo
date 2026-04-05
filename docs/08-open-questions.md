# Open Questions

Status: Active  
Owner: Product  
Last updated: 2026-04-02

Use this file to prevent hidden ambiguity during migration and build.

| ID | Question | Impact area | Owner | Recommended default | Status | Decision |
|---|---|---|---|---|---|---|
| Q-001 | Should the future default `OWOcrm` lead status catalog stay close to the current Barowo seeded set, or be redesigned before implementation starts? | Product model, onboarding, automation | Product | Start with Barowo-equivalent semantics and redesign only if a clear product reason appears. | decided | Keep Barowo-like default status semantics for the first implementation pass. |
| Q-002 | Should team management remain inside the task workspace for early implementation, or move into a more explicit settings/admin-owned area in Web v1? | Web IA, permissions UX | Product + Frontend | Move toward settings/admin ownership in Web, even if Barowo currently hosts it inside tasks. | decided | Move team management into Settings/Admin in OWOcrm Web v1 instead of keeping it inside Tasks. |
| Q-003 | Which modules must appear in the first real OWOcrm UI, and which should remain backend-ready or deferred? | Scope, implementation order | Product + Engineering | Keep the first visible shell focused and delay secondary modules. | decided | First visible UI shell is Leads, Tasks, Stats, and Settings. Secondary modules like Inventory, Finance workspace, and Email runtime remain deferred from the initial visible shell. |
| Q-004 | Should follow-up automation remain business-global in MVP, or do we need scoped rules by lead type/source before implementation starts? | Automation model, settings UX | Product + Engineering | Start with business-global defaults in MVP and only add scoped rules when source/type segmentation creates clear operational pressure. | open | Not yet decided beyond preserving the current MVP limitation. |

Status values:
- `open`
- `in_review`
- `decided`
- `dropped`
