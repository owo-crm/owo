# Shared Types

Status: Active  
Owner: Backend + Frontend  
Last updated: 2026-04-02

## Purpose

This document defines the minimum canonical shared types needed before
implementation starts.

It is not language-specific code.
It is the type contract that Web and Telegram should both consume through the
same backend-facing model.

## Type Rules

- preserve business-language names
- do not create separate Web and Telegram versions of the same domain object
- keep list-item types smaller than detail types
- keep transport shapes stable around business meaning, not around current UI
- allow optional fields where the canon already permits incomplete operational
  context

## Shared Primitive Concepts

### IDs

Use explicit typed identifiers by domain concept:
- `BusinessId`
- `UserId`
- `LeadId`
- `LeadUid`
- `TaskId`
- `EventId`
- `AttachmentId`
- `InventoryItemId`

Rule:
- where a public lead reference exists, preserve both internal `LeadId` and
  public/stable `LeadUid` semantics if the implementation continues that split

### Timestamps

Use ISO datetime strings at transport boundaries.

Examples:
- `created_at`
- `updated_at`
- `deadline`
- `done_at`
- `sheet_last_synced_at`

## Identity and Workspace Types

### `AuthenticatedUser`

Core fields:
- `id`
- `telegram_id`
- `username`
- `first_name`
- `last_name`
- `language`
- `is_platform_admin`

### `BusinessSummary`

Core fields:
- `id`
- `name`
- `business_mode`
- `enabled_modules`
- `sheet_id`
- `sheet_verified`
- `sheet_tab_name`
- `sheet_last_synced_at`

### `BusinessMembership`

Core fields:
- `business_id`
- `user_id`
- `role`
- `position`
- `custom_permissions`
- `display_name`

### `AuthSessionPayload`

Core fields:
- `user`
- `businesses`
- `active_business_id`
- `token`

## Lead Types

### `LeadListItem`

Purpose:
- fast queue rendering in Web and Telegram

Fields:
- `id`
- `uid`
- `business_id`
- `name`
- `phone`
- `email`
- `status`
- `assigned_to`
- `contract_value`
- `event_date`
- `event_type`
- `source`
- optional `next_task_title`
- optional `next_task_deadline`
- `updated_at`

### `LeadDetail`

Purpose:
- full lead context

Fields:
- all `LeadListItem` fields
- `city`
- `notes`
- `custom_fields`
- optional `activity_items`
- linked summaries as needed for:
  - tasks
  - attachments
  - inventory
  - money context

### `LeadStatusConfig`

Fields:
- `id`
- `business_id`
- `name`
- `color`
- `position`
- `is_default`
- `is_won`
- `is_lost`
- `requires_follow_up`
- `hide_from_active`

### `LeadCreateInput`

Minimum fields:
- `business_id`
- optional `name`
- optional `phone`
- optional `email`
- optional `city`
- optional `event_date`
- optional `event_type`
- optional `status`
- optional `assigned_to`
- optional `contract_value`
- optional `notes`
- optional `source`
- optional `custom_fields`

### `LeadUpsertResult`

Purpose:
- preserve dedupe-aware outcomes

Fields:
- `lead`
- `merged_existing`
- optional `merge_message`

## Task Types

### `TaskListItem`

Fields:
- `id`
- `business_id`
- optional `lead_id`
- `title`
- `description`
- `assigned_to`
- `deadline`
- `done_at`
- `created_at`

### `TaskDetail`

For MVP, task detail may equal task list item plus:
- linked lead summary
- assignee summary

### `TaskCreateInput`

Fields:
- `business_id`
- optional `lead_id`
- `title`
- optional `description`
- optional `deadline`
- optional `assigned_to`

## Event Types

### `BusinessEventItem`

Fields:
- `id`
- `business_id`
- `event_type`
- `entity_type`
- optional `entity_id`
- optional `lead_id`
- optional `task_id`
- optional `triggered_by_user_id`
- `payload`
- `delivery_state`
- optional `delivered_channels`
- optional `dedupe_key`
- `created_at`

### `ActivityItem`

Purpose:
- normalized timeline item for lead activity views without implying a dedicated
  call-recording subsystem

Fields:
- `id`
- `lead_id`
- `kind`
- optional `summary`
- optional `payload`
- optional `created_by_user_id`
- `created_at`

## Sheet Sync Types

### `SheetVerificationResult`

Fields:
- `verified`
- `message`
- optional `sheet_title`
- `available_tabs`
- optional `selected_tab_name`

### `SheetMappingEntry`

Purpose:
- map one source column to one canonical lead field or extension slot

Fields:
- `source_column`
- `target_field`
- optional `mode`

### `SheetSyncResult`

Fields:
- `message`
- `rows_processed`
- `created_count`
- `updated_count`
- `skipped_count`
- `skipped_reasons`
- optional `sheet_last_synced_at`
- optional `sheet_title`
- optional `selected_tab_name`

## Settings Types

### `BusinessAutomationSettings`

Fields:
- `automations_enabled`
- `assign_new_leads_to_owner`
- `create_task_on_new_lead`
- `create_task_for_follow_up_stages`
- `follow_up_task_title`
- `follow_up_task_deadline_hours`

Rule:
- `follow_up_task_title` and `follow_up_task_deadline_hours` are business-level
  defaults in MVP, not a future-proof per-source or per-lead-type rule system

### `BusinessNotificationSettings`

Fields:
- `notifications_enabled`
- `telegram_internal_enabled`
- `client_email_enabled`
- `notify_on`
- `client_email_sender_name`
- `client_email_reply_to`
- `client_email_template_key`

## Team and Permission Types

### `RoleKey`

Current canonical values:
- `owner`
- `admin`
- `manager`
- `member`
- `observer`

### `PermissionKey`

Shared string union of canonical permission keys from the permission canon.

Rule:
- preserve the existing permission-key vocabulary unless there is a deliberate
  migration plan

## Inventory and Finance Types

These may remain secondary during first implementation, but shared type names
should already be reserved:

- `IncomeItem`
- `ExpenseItem`
- `InventoryItemSummary`
- `InventoryMovementItem`
- `LeadInventoryRequirementItem`
- `InventoryTemplateItem`

## UI Consumption Rule

Clients should consume:
- summary types for list views
- detail types for entity detail screens
- input types for mutations
- result types for operation-specific flows such as dedupe-aware lead creation
  and sheet sync

Do not make Telegram-specific and Web-specific transport types unless the
backend truly returns different business meaning, which it should not.

## Handoff Marker

Once these shared types are accepted, implementation can move from docs-first
planning into:
- backend contracts and schemas
- frontend API clients
- Web foundation work

At that point, it is healthy to continue in a dedicated `OWOcrm` chat focused
only on the new repo and implementation tasks.
