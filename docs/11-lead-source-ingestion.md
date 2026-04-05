# Lead Source Ingestion

Status: Active  
Owner: Product + Backend  
Last updated: 2026-04-02

## Purpose

This document defines the canonical source model for lead intake in `OWOcrm`.

It exists to prevent the product from drifting into separate mini-systems like:
- one CRM path for Google Sheets
- another path for website forms
- another path for direct API ingestion

The rule is:
- many source channels
- one lead pipeline

## Canonical Source Families

Current canonical source families:
- `manual`
- `google_sheet`
- `website_form`
- `api`
- `meta_form_direct`
- `import_file`

Not every source must ship in the same milestone.
But every implemented source must converge into the same lead-domain behavior.

## Shared Ingestion Rules

All source families must ultimately feed the same downstream flow:

1. raw source payload enters the system
2. source-specific mapping resolves canonical lead fields
3. dedupe runs against existing leads
4. lead is created or merged
5. owner/task/automation logic reacts downstream
6. business events are emitted
7. the resulting lead appears in the same operational queue

This means:
- no source-specific lead model
- no source-specific task logic
- no source-specific follow-up semantics
- no source-specific visibility rules once ingestion is complete

## Source-Specific Edge Logic

Only the ingestion edge is allowed to vary by source.

Examples of allowed variation:
- Google Sheet tab and column mapping
- website form field mapping
- API key or source-key verification
- optional payload metadata such as `utm_campaign`, `page_url`, or `form_name`

Examples of disallowed variation:
- different dedupe rules by client surface
- a separate "website-form lead" lifecycle
- a separate operator queue for one source family

## Google Sheet

Google Sheet remains an important early source because many target users
already operate through ugly shared sheets.

Canonical behavior:
- treated as setup/integration flow
- business-owned sheet connection
- tab selection and mapping happen before sync
- sync result is human-readable
- after ingestion, leads behave like any other leads

## Website Form

Website form intake is a canonical source family, not a side experiment.

Expected use cases:
- a business already captures leads on its own website
- form submissions should land directly in OWOcrm without passing through a
  sheet first

Canonical behavior:
- form submission arrives through an ingestion endpoint
- source identity is validated through a `source_key` or equivalent business
  mapping
- mapped fields feed the standard lead create/merge flow
- optional metadata may be captured:
  - `utm_source`
  - `utm_campaign`
  - `page_url`
  - `form_name`
  - `ad_platform`

## API Ingestion

API ingestion is the generalized programmatic source.

It should follow the same principles as website forms:
- authenticate the source
- map payload to canonical lead fields
- run dedupe
- emit standard events

## Meta Direct

`meta_form_direct` is reserved as a future-ready source family.

It should not change the lead domain if implemented later.
It simply becomes another ingestion edge into the same pipeline.

## Dedupe Rule

Dedupe is part of the shared lead pipeline, not part of one import type.

Therefore:
- website forms, API payloads, and Google Sheet rows all use the same dedupe
  semantics
- repeated intake from the same person should not create divergent workflows by
  source

## UX Rule

Operators should not need to care how a lead entered the system in order to
work the lead.

They may see the source as metadata.
They should not experience source-specific CRM behavior.

## MVP Boundary

For MVP:
- manual creation is mandatory
- Google Sheet is a first-class early source
- website-form/API ingestion is canonical and implementation-ready
- a heavy multi-source integration center is out of scope

The product should expose only the setup needed to make a source operational,
not a giant ingestion control tower.
