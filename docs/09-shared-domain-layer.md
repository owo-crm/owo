# Shared Domain Layer

Status: Active  
Owner: Backend + Product  
Last updated: 2026-04-02

## Purpose

This document defines the shared backend/domain layering that must power both
Web and Telegram surfaces.

It exists to prevent a common failure mode:

- building one backend flow for Web
- and a second, slightly different backend flow for Telegram

The rule is simple:
- one business core
- two presentation surfaces

## Core Rule

Web and Telegram may differ in layout, density, and navigation.
They may not differ in domain behavior.

That means:
- same lead semantics
- same task semantics
- same permission checks
- same event emission
- same automation behavior

## Layer Model

The shared core should be split into five layers.

### 1. Identity and business context layer

Responsibilities:
- validate current auth mechanism
- resolve user identity
- resolve accessible businesses
- resolve active business context

Canonical outputs:
- authenticated actor
- business membership context
- effective role/permissions

### 2. Domain model layer

Responsibilities:
- define the canonical business entities
- preserve domain invariants
- keep business semantics independent from UI

Core domain areas:
- business and membership
- leads and statuses
- tasks and follow-up
- events and automation settings
- inventory
- finance

### 3. Application service layer

Responsibilities:
- execute business use cases
- orchestrate domain changes
- emit events
- call integrations when needed

Canonical service slices:
- auth/session application flow
- business setup flow
- lead lifecycle flow
- task execution flow
- sheet sync flow
- team membership and permission flow
- inventory flow
- finance flow

This is where dedupe, owner assignment support, follow-up task creation, and
other use-case logic belong.

### 4. Integration and infrastructure layer

Responsibilities:
- talk to Google Sheets
- talk to storage/file backends
- talk to external webhook/billing/email providers
- schedule monitoring work

This layer may fail independently of domain meaning.
It must not redefine product rules.

### 5. Delivery layer

Responsibilities:
- expose the shared core to clients
- HTTP API for Web and Telegram Mini App
- delivery channels such as Telegram bot notifications

Canonical rule:
- controllers/routes validate input and call application services
- they do not invent business semantics

## Vertical Ownership

The shared domain should be implemented by vertical slices, not by client
surface.

Primary verticals:
- auth and business context
- leads and statuses
- tasks and follow-up
- business events and notifications
- lead source ingestion
- team and permissions
- inventory
- finance

Avoid structure like:
- `web_leads_service`
- `telegram_leads_service`

Prefer:
- `lead_service`
- with Web and Telegram both consuming it

## Core Use-Case Flows

The first implementation must support these shared use cases:

### Auth and workspace
- validate actor
- load businesses
- choose active business

### Lead operations
- list leads
- create lead
- dedupe on create/import
- open lead detail
- update lead
- assign owner
- change stage

### Task operations
- list tasks
- create task
- update task
- mark task done

### Setup operations
- verify Google Sheet
- list tabs
- save mapping
- run sync
- accept website-form/API lead intake through the same lead pipeline

### Event operations
- emit canonical business events from meaningful domain actions

## Cross-Layer Guardrails

1. Permission enforcement belongs in the shared core, not just in clients.
2. Event emission belongs in domain/application services, not in route handlers.
3. Dedupe belongs in lead application logic, not in import-only code.
4. Follow-up semantics must remain `stage + task`, not branch by client.
5. If a next-action signal is shown on a lead, it is derived from tasks rather
   than a duplicated lead field.
6. Inventory and finance may remain secondary, but if implemented they still
   use the same shared core model.

## First Implementation Boundary

For the first implementation pass, the shared domain layer does not need:
- a complex plugin architecture
- event sourcing
- CQRS split
- separate read model infrastructure

It does need:
- clean vertical service boundaries
- stable canonical types
- event-aware domain flow
- identical business behavior for Web and Telegram

## Handoff Marker

Once this document and `10-shared-types.md` are accepted, docs-only Week 2 is
effectively complete.

That is the right moment to hand implementation work over to a dedicated
`OWOcrm` build thread or chat focused on code, not canon writing.
