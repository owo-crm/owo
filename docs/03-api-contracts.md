# API Contracts

Status: Draft  
Owner: Backend  
Last updated: 2026-04-02

## Rules
- Contract-first changes only.
- Breaking changes require versioning note and migration step.
- Error shape must be consistent across all endpoints.

## Standard response envelope
```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

## Standard error envelope
```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Endpoint groups (v1)
- Auth and sessions
- Business and members
- Leads
- Tasks
- Events and notifications

## Per-endpoint template
- Method and path
- Auth requirement
- Request body
- Response body
- Errors
- Side effects
