# Engineering Rules

Status: Active  
Owner: Engineering  
Last updated: 2026-04-02

## Source Of Truth Rule

`OWOcrm/docs` is the active product and engineering source of truth.

`Barowo crm` may still be used as:
- historical reference
- canon origin
- behavior comparison point

But new truth should be fixed here.

## Shared Core Rule

- one shared backend/domain core for Web and Telegram
- presentation may differ by surface
- business behavior may not fork by surface

## Naming Rules

- use business-language names, not UI slang
- prefer singular entity names for domain models
- prefer explicit route-group names that match domain areas
- avoid introducing new names for concepts that already have a canonized term

Canonical terms to preserve:
- business
- business member
- lead
- lead status
- task
- business event
- inventory item
- inventory movement
- inventory template

## Docs Update Rule

Behavior changes require docs updates in the same change set when they affect:
- product rules
- entities
- contracts
- flows
- release scope

No implementation should silently drift away from canonical docs.

## Migration Rule

When migrating from `Barowo crm`:
- transfer decisions, not historical noise
- keep reference to Barowo only where needed to explain provenance
- do not copy runtime clutter, temporary files, or abandoned drafts

## Review Gate Rules

No implementation PR should be considered ready unless:
- the relevant doc section already exists
- behavior changes are reflected in docs
- test notes are present
- risk notes are present if core workflow behavior changes

## Release Scope Rule

Do not expand MVP scope through implementation convenience.

If a feature is outside `06-release-scope-v1.md`, either:
- keep it out
- or update scope docs first

## Contract Rule

- contract changes must be reflected in `03-api-contracts.md`
- domain meaning changes must be reflected in `01-product-canon.md` or
  `02-domain-model.md`
- flow changes must be reflected in `04-ux-flows.md`

## Architecture Guardrails

- boundary validation at API edges
- event production from domain services, not controllers
- permission enforcement on backend
- retry-prone operations should preserve safe repeat behavior where applicable

## What This File Is Not

This file is not a low-level architecture spec.
It exists to stop drift while implementation begins.
