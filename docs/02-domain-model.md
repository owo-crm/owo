# Domain Model

Status: Active  
Owner: Backend + Product  
Last updated: 2026-04-02

## Purpose

This document is the canonical entity and ownership map for `OWOcrm`.
It is based on the finalized Barowo data model and workflow canons.

## Core Tenancy And Identity

### `Business`

Root tenant and operational workspace.

Owns:
- lead data
- task data
- stage catalog
- inventory
- finance records
- event log
- sync configuration
- automation settings
- notification settings

### `BusinessMember`

Business-scoped membership and access record.

Owns:
- role
- position
- custom permission overrides

### `User`

Platform identity, currently Telegram-backed.

### `UserSession`

Stores active business context for one user.

## Core Operational Entities

### `Lead`

Central customer/opportunity record.

Important semantics:
- one canonical lead thread in one business
- may be manually created or source-ingested
- current stage lives on the lead
- owner is optional but operationally important
- source attribution is preserved, but all source types converge into one lead
  domain model
- extra business-specific context lives in `custom_fields`

### `LeadStatus`

Business-owned stage catalog.

Stage meaning is driven by flags, not just names:
- `is_default`
- `is_won`
- `is_lost`
- `requires_follow_up`
- `hide_from_active`

### `Task`

Primary operational work item.

Important semantics:
- optionally linked to a lead
- task type is generic in MVP; there is no first-class `Call` entity yet
- completion is derived from `done_at`
- overdue is a computed plus event-monitored state

### `BusinessEvent`

Canonical normalized event transport.

Used for:
- business event history
- automation triggers
- notification delivery state

### `IngestSource`

Business-owned source key and channel configuration for canonical lead intake.

### `IngestReceipt`

Idempotency and trace record for source payload processing.

Purpose:
- prevent duplicate processing on retries
- preserve per-source ingestion audit trail

### `SurveySubmission`

Landing and early-access survey intake record.

Purpose:
- preserve launch feedback in production storage
- drive admin-facing submission and breakdown stats

### `EmailOutbox`

Outbound delivery log for team and user confirmation emails.

Purpose:
- queued/sent/failed status visibility
- provider message correlation
- retry and incident debugging support

### `LeadAttachment`

Lead-linked file metadata and storage pointer.

## Finance Entities

### `Income`

Real incoming money event.

### `Expense`

Real outgoing money event or recurring expense plan/instance depending on
flags.

### `Subscription`

Business billing and access state.

## Inventory Entities

### `InventoryItem`

Current stock and availability record.

### `InventoryMovement`

Movement/audit record for stock change.

### `InventoryTemplate`

Reusable requirement bundle, currently JSON-shaped.

### `LeadInventoryRequirement`

Lead-specific required quantity planning record.

## Core Workflow Semantics

### Lead lifecycle

Lead lifecycle is built from two overlapping layers:

- semantic pipeline state
- operational work state

This means:
- stage answers where the lead sits in the process
- task answers what still needs to happen

### Follow-up

A lead is follow-up relevant when either is true:

- the current stage has `requires_follow_up = true`
- there is at least one open linked task

Follow-up is never stage-only.

### Next contact / next call

If the product shows a "next contact" style signal in list or detail views, it
must be derived from linked open tasks, not stored as a parallel manual field on
the lead.

Current MVP implication:
- no standalone `next_call_at` source of truth on `Lead`
- "next action" comes from task linkage and task deadline semantics

### Call history

MVP does not define a first-class call logging subsystem.

If operators record calls, they do so through:
- freeform notes
- activity/event items

This avoids introducing an undocumented `Call` entity before the product is
ready for a dedicated communications model.

### Active versus closed

Active pipeline membership is semantic.

Current rule:
- stages with `hide_from_active = true` are outside active work views

### Advisory-not-blocking rule

The product prefers guidance over hard blocking.

Examples:
- lead may enter a follow-up stage without a task
- lead may be won without recorded income
- lead may remain unassigned, but should be treated as operationally incomplete

## Dedupe And Identity Semantics

Lead dedupe is part of the domain model, not just integration glue.

Current matching order:
1. phone
2. email
3. name + event date
4. name-only fallback when phone and email are missing

Current duplicate window:
- 30 days

Canonical implication:
- lead uniqueness is operational and service-driven
- not a single strict DB uniqueness rule

## Ownership Mapping

Canonical homes for major product meaning:

- workspace identity: `Business`
- access control: `BusinessMember`
- lead core state: `Lead`
- stage semantics: `LeadStatus`
- next action: `Task`
- event transport: `BusinessEvent`
- automation/notification behavior toggles: `Business` settings blocks
- money truth: `Income` and `Expense`
- stock truth: `InventoryItem` and `InventoryMovement`

## Current Intentional Compromises

These should be preserved or deliberately redesigned later, not accidentally
lost:

1. lead stage is text-linked semantically instead of hard foreign-key state
2. business settings are still settings-block based in important areas
3. inventory templates are JSON-shaped
4. recurring expenses and one-time expenses still share one table
5. unified history is a product-level concept, not yet one perfectly normalized
   storage model
6. automation settings remain business-global defaults in MVP, even though more
   granular rule scopes may be needed later for different lead/source patterns

## Alignment Rule

The core workflow canons are aligned as follows:

- lead workflow is `stage + task`
- permissions gate actions without redefining domain meaning
- business events are the canonical automation and notification transport
- automation reacts downstream after core domain actions

This alignment must remain true in implementation.
