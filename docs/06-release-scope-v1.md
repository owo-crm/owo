# Release Scope v1

Status: Active  
Owner: Product + Engineering  
Last updated: 2026-04-02

## Release Intent

The first `OWOcrm` release should prove one stable operating loop:

- lead enters
- owner becomes clear
- next action becomes visible
- team does not lose follow-up

## In Scope

- auth and business context
- lead intake through current primary source flows
- manual lead creation
- lead list and lead detail
- owner assignment
- task creation, completion, and follow-up tracking
- basic management visibility
- Google Sheet setup, mapping, and sync flow
- website-form/API ingestion as part of the same lead pipeline when enabled
- event-aware core behavior
- Web-first implementation
- Telegram Mini App adaptation for the same core lead/task flows

## Secondary But Allowed

- inventory support where it already reinforces execution
- finance visibility at a compact operational level
- event and notification foundation
- email foundation as future-facing structure, not as full runtime product

## Out Of Scope

- full enterprise customization
- deep workflow builder
- full threaded mailbox and inbox suite
- polished live email runtime before core workflow validation
- giant sync control center
- finance-first product buildout
- inventory-first product buildout
- native app packaging
- advanced billing variants
- broad integration marketplace

## Release Criteria

Release v1 is only credible if:

- core lead-to-task workflow works end-to-end
- ownership and next action gaps are visible
- key flows are available in Web and Telegram Mini App through the same core
- scope has not been diluted by secondary modules
