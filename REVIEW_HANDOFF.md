# Barowo Review Handoff

This document is for a product, marketing, or CRM-focused reviewer who needs to understand:

- what Barowo already does well
- what is intentionally unfinished
- what should be reviewed first
- which product decisions still need feedback

This is not deep technical documentation. It is a practical review guide.

## 1. What Barowo is right now

Barowo is a Telegram-first CRM with a Mini App frontend and a FastAPI/Postgres backend.

The current product already has a real operational core:

- lead intake and lead management
- Google Sheet connection and syncing
- team members and roles
- tasks
- dashboard with income/expenses
- inventory as an optional module
- recurring expense logic
- event log and automation foundation
- internal Telegram notification foundation

This means the product is no longer just a clickable mockup. It already behaves like a working CRM foundation.

## 2. Core product areas that already exist

### Leads

- lead list
- search and filtering
- lead details
- owner assignment
- custom lead stages
- follow-up semantics
- unified lead history
- attachments

### Tasks and team

- task creation and editing
- lead-linked tasks
- assignee workflow
- team members
- business roles
- custom permissions

### Dashboard

- calendar
- income and expense tracking
- recurring expense plans
- money history

### Inventory

- stock items
- templates
- movements
- low stock logic
- lead-linked inventory planning

### Settings / admin

- Google Sheet setup
- mapping
- lead stages
- notifications
- automation rules
- event log
- admin panel
- Telegram setup panel

## 3. What is intentionally not final yet

These are not bugs by default. Many of them are consciously left for a later pass.

### UI polish

The interface is already much more usable than before, but it is still not the final polished design system.

We are treating the current UI as:

- usable for testing
- good enough for real feedback
- not yet the final branded product

### Client email automation

Email sending is not active yet.

Reason:

- there are real lead emails in the database
- we do not want accidental live outgoing communication

Email exists only as architecture/foundation right now.

### Final Telegram bot UX

The bot already has:

- `/start`
- `/help`
- `/inbox`
- `/workspace`
- `/today`
- `/tasks`
- `/leads`

But this is still a functional operator layer, not the final polished conversational bot experience.

### Production deployment

The app is deployment-ready in structure, but not yet fully deployed as a public Telegram Mini App.

We still need:

- public backend URL
- public Mini App URL
- final Telegram webhook sync
- final storage setup

## 4. What feedback is most valuable right now

The most useful feedback is not “make the button prettier”.

The most useful feedback is:

- which CRM actions are still missing
- which workflows feel unnatural
- which data is missing or duplicated
- which parts of the CRM are too heavy or too hidden
- what a real team would need every day

## 5. Review focus areas

Ask the reviewer to focus on these questions.

### A. Lead workflow

- Is the lead card showing the right information?
- Is anything important missing from the lead lifecycle?
- Are custom stages enough, or is another lifecycle concept needed?
- Does follow-up logic feel practical?
- Is anything duplicated or placed in the wrong screen?

### B. Team workflow

- Can a real small team coordinate work here?
- Is assignment logic sufficient?
- Are role and permission concepts clear enough?
- What is still missing for day-to-day operations?

### C. Money flow

- Is the current separation between deal value and real money movements understandable?
- Does the dashboard contain the right money concepts?
- Is anything missing for real financial tracking?

### D. Inventory

- Is inventory actually useful for the target business types?
- Is it in the right place as an optional module?
- What inventory actions are still missing?

### E. Automation and notifications

- Which automations should be considered essential?
- What should happen automatically after:
  - new lead
  - assignment
  - follow-up stage
  - overdue task
  - missing inventory

## 6. Product decisions that still need feedback

These are the biggest open product questions right now.

### 1. What should be required vs only recommended

We have already moved away from blocking too many actions.

We still need feedback on:

- what must be required
- what should only be shown as a hint
- what should not be shown at all

### 2. Where money should live

Current direction:

- `deal value` stays on the lead as a deal field
- real income/expense creation lives in the dashboard
- money events still appear inside lead history

This is a strong candidate model, but it should be validated by someone who knows real CRM operations.

### 3. How much of the workflow should live in Telegram vs Mini App

We now have both:

- Mini App workflow
- bot command foundation

We still need product input on which actions belong in:

- the Mini App
- the bot
- or both

## 7. Suggested review flow

Ask the reviewer to test in this order:

1. Leads
2. Lead details
3. Tasks and team
4. Dashboard
5. Inventory
6. Settings
7. Admin / Telegram panel

That order makes it much easier to notice product gaps.

## 8. What to write down during review

Ask them to collect feedback in 4 buckets:

- missing feature
- unclear logic
- duplicated information
- unnecessary complexity

This will help us separate:

- real product issues
- UX cleanup
- final design polish

## 9. Current recommendation

Before the final visual redesign, the best next step is:

- get real product feedback from someone who understands CRM and marketing workflows
- identify missing operational logic
- decide what must be added before final polish

That will make the final “full finish” much more accurate and useful.
