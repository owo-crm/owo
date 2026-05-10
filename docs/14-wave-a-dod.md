# Wave A Definition of Done (CRM Core)

This is the mandatory quality bar before a feature block is shown for review.

## Scope

Wave A includes:
- Leads
- Tasks
- Finance
- Stock
- Team
- Settings
- Ingestion (google_sheet, api, website_form)
- Email operational flows

Out of scope for Wave A:
- Deep visual redesign
- Delayed automation scheduler
- AI agent orchestration

## Feature Block DoD

A feature block is considered done only if all points pass:

1. Functional completeness
- Create, read, update flows are wired to `api/v1` (no local mock source of truth).
- Validation errors are explicit and readable.
- Empty/loading/error states are present.

2. UX consistency
- Desktop and mobile (360/375/390/430) have no overflow/cropping.
- Dark/light states are readable and consistent.
- Active/filled controls use readable text contrast.

3. Data integrity
- Persisted changes are visible after refresh.
- No duplicate side-effects on retries (idempotency where required).
- Event logging for business actions remains intact.

4. Regression safety
- `npm run lint` passes (warnings accepted only if known/non-blocking).
- `npm run build` passes.
- `npm run test:integration` passes.
- Copy-quality scan has no mojibake artifacts.

## Mandatory Gate Command

Before presenting any Wave A block, run:

```powershell
npm run quality:wave-a
```

This command is the default pre-review gate for Wave A work.

## Working Mode

- Implement in complete vertical slices (not micro-edits).
- Do one internal polish pass before showing output.
- Return with one summary: what changed, what was verified, and residual risks.
