# Migration: Barowo crm -> OWOcrm

Status: Active  
Owner: Product + Engineering  
Last updated: 2026-04-02

## Goal

Move finalized product truth from the legacy workspace into `OWOcrm` without
copying noise, draft confusion, or runtime clutter.

## Migration Principles

- transfer decisions, not artifacts
- prefer merged canonical docs over duplicate packs
- after import, treat `OWOcrm/docs` as the active source of truth

## Superseded Legacy Material

The following Barowo doc areas have now been merged conceptually into
`OWOcrm/docs`:

- canon index
- data model canon
- permission canon
- lead lifecycle canon
- task and follow-up canon
- notification and automation canon
- platform interaction canon
- Google Sheet runtime canon
- API contracts
- Web UX flows
- Telegram UX flows
- MVP non-goals

## What Remains Reference-Only In Barowo

`Barowo crm` remains useful for:
- historical canon provenance
- implementation comparison
- old product behavior lookup

It should not remain the main place where new truth is edited first.

## What Moves Into OWOcrm

Active truth now lives in:
- `01-product-canon.md`
- `02-domain-model.md`
- `03-api-contracts.md`
- `04-ux-flows.md`
- `05-engineering-rules.md`
- `06-release-scope-v1.md`
- `08-open-questions.md`

## What Does Not Move

Do not migrate into the new project as canon:
- runtime clutter
- temporary patches
- tracked local databases
- service-account JSON files
- implementation accidents that are not product decisions

## Intentionally Postponed To Implementation Phase

These are not fully solved by the docs migration itself:
- shared domain types in code
- backend extraction
- web shell implementation
- Telegram surface implementation
- runtime email provider work
- final design documentation

## Migration Checklist

- [x] Week 1 canon pack finalized in `Barowo crm`
- [x] active product truth merged into `OWOcrm/docs`
- [x] duplicate parallel docs pack avoided
- [x] unresolved questions routed into `08-open-questions.md`
- [ ] implementation begins from `OWOcrm`, not from `Barowo crm`
- [ ] legacy workspace is treated operationally as reference/archive
