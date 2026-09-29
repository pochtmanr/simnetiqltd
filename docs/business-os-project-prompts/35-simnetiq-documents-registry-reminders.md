# M6 — Private documents, business registry and deadlines

- **Implement in:** Simnetiq main dashboard
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** M5 completed.
- **Scope:** Complete central business workflows and both dashboard presentations without taking ownership of source-local expenses.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Add private document upload, metadata search (title/category/vendor/tags/project/dates), checksums and authorized preview/download. Source-exported document references use an authenticated proxy or authorized short-lived URL; never store permanent public links or import a receipt as a new expense.
2. Validate MIME/size and safe preview behavior, enforce RLS/storage authorization, allow receipt retry independently from a saved draft and handle orphan uploads. Keep imported source metadata/provenance separate from central-owned documents.
3. Implement company/legal/service registry with project links, owner-supplied registration/renewal/due dates and related documents. Do not invent registration numbers, tax deadlines or store passwords in notes.
4. Build one timeline/calendar from finance due dates, recurring expectations, service renewals and manual events. Derived events reference originals rather than editable duplicates. Recurrence creates due/draft items and never assumes payment; central recurrence covers central-owned expenses only.
5. Implement durable reminder outbox, owner-configurable thresholds/quiet hours, recipient allowlist and occurrence/channel idempotency. Define ambiguous send-timeout handling honestly; do not claim exactly-once external delivery without transport support. Use the dedicated bot and authenticated deep links with minimal sensitive content. Live sends require configured owner notification consent.
6. Finish Documents/Business records/Timeline on web and Telegram, including source-age/mismatch/import-failure alerts. Keep alerts actionable and deduplicated.

## Verification / done when

Test unauthorized/cross-record access, expired download links, retry after upload failure, source receipt no-double-expense, recurrence month-end/leap/DST behavior, due vs paid, duplicate scheduler ticks, disabled reminders, delivery retries/ambiguous timeout and unconfigured recipients. No unrequested live messages in testing.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
