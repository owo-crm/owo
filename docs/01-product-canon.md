# Product Canon

Status: Active  
Owner: Product  
Last updated: 2026-04-02

## Mission

Build an automation-first CRM and operating system where inbound leads do not
die between tools, ownership stays visible, and the next action is always
clear.

## Core Product Loop

The canonical MVP loop is:

1. a lead enters the system
2. the lead becomes visible in the business queue
3. the lead gets an owner or is flagged as operationally incomplete
4. the next action becomes visible through task logic
5. events, automation, and notifications react downstream

This is the main truth of the product.
Everything else is secondary.

## Product Position

Current product wedge:
- Meta and similar inbound leads
- ugly Google Sheets and fragmented workflows
- website forms and lightweight API intake where a business already captures
  leads on its own site
- need for fast first response, ownership clarity, and visible follow-up

Long-term product interpretation:
- not just a lead inbox
- not just a task app
- not just a Telegram shell
- one operational system where leads, actions, and business context stay tied
  together

## Target Users

- lead operators
- sales owners
- team leads
- small teams that need operational visibility more than enterprise complexity

## Core Product Principles

- One lead, one clear owner.
- Follow-up is `stage + task`, not stage only.
- Automation should reduce manual clicks, not hide accountability.
- Guidance is preferred over bureaucratic blocking.
- Web and Telegram share one business logic layer.
- Visual or structural complexity must stay lower than operational complexity.

## Platform Stance

Canonical surface roles:
- Web = primary full workspace
- Telegram Mini App = adaptive mobile shell
- Telegram bot = notification and command layer

Telegram stays important, but it does not become the long-term structural
center of the product.

## Lifecycle Principles

- Lead stage and operational work state are related but not identical.
- A lead may move stages even when supporting context is incomplete.
- Missing owner, missing next task, or missing notes should create guidance and
  warnings, not immediate hard failure in normal MVP operation.
- Unified lead history is a product concept, even if storage is still split
  across multiple models today.

## Automation Principles

- Domain actions happen first.
- Business events are emitted from domain services.
- Notifications and automations react downstream.
- Automation stays intentionally narrow in MVP:
  - owner assignment support
  - first-touch support
  - follow-up task creation

## Lead Source Principles

- Google Sheet is an important early source, not the only canonical source.
- Website form intake must converge into the same lead pipeline as sheet sync
  and manual lead creation.
- Source-specific mapping belongs at the ingestion edge, not in the lead domain
  itself.
- Dedupe, owner assignment, next-task logic, and downstream automation stay
  shared across all lead sources.

## Success Metrics For v1

- median time to first response
- percent of leads with owner assigned within SLA
- follow-up completion rate
- response lag and owner lag visibility
- conversion rate by pipeline stage

## Current Canonical Non-Goals

The first `OWOcrm` release is not trying to be:

- a full enterprise ERP
- a giant admin console
- a complete omnichannel inbox suite
- a fully customizable object builder
- a deep workflow builder
- a native app launch
- a finance-first or inventory-first product

## Operational Scope Rule

Any future feature should be treated as out-of-scope for MVP if:

- it does not strengthen the lead-to-action loop
- it mainly adds surface area without increasing clarity
- it sounds impressive but does not solve ownership or follow-up failure

## Relationship To Legacy Barowo

This file replaces the older draft-level product summary in `OWOcrm/docs` and
inherits its final semantic direction from the Barowo canon pack.

Barowo remains the historical input.
This file is now the active source of truth.
