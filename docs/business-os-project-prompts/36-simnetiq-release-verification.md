# M7 — End-to-end verification and release runbook

- **Implement in:** Simnetiq main dashboard; source endpoints verified read-only
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** M1–M6 and both source handoffs completed; optional provider gaps explicitly declared.
- **Scope:** Verify the complete integration and prepare release evidence. Fix central defects here; report source defects against D/S steps for implementation in their own projects.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Check all contracts against implemented schemas/capabilities and source deployment versions. Run source/admin/API/central same-window native reconciliation, SMS legacy USD parity and shared-policy GBP parity with real redacted evidence.
2. Run financial replay/concurrency/correction/void tests, component fee deduplication, source/shared expense ownership, settlement/top-up treatment, missing FX/tax/cost completeness and isolated environment tests. No subscriptions/MRR for SMS or invented verified net profit/cash.
3. Test HMAC signing/replay/revocation/project binding, key rotation, user MFA/RLS/storage/CSRF, Telegram link/exchange/refresh/revocation, no client/log secrets and private analytics/sitemap exclusion. Confirm source API auth did not weaken SMS human MFA.
4. Exercise real staging workflows across browser and Telegram, public localized routes and existing public contact/mailing-list/deletion flows. Check traffic distinct/grain/timezone semantics, source outage/staleness and reminder authorization.
5. Test worker lease recovery, cursor restart/resync and quarantine, source/central downtime isolation, backups and restore into an isolated target including private documents/policies. Read BUSINESS_OS_DEPLOYMENT.md and create additive migration/deployment/rollback runbooks with correct target checks.
6. Produce a release checklist with actual commands/results, devices, redacted parity/residuals, unsupported features, coverage dates, configuration needs and operating owners for key rotation, reconciliation and backups. Prepare staging/deployment artifacts; do not claim live deployment or production certification without actual execution and access. Enable sources/datasets only after their gates pass.

## Verification / done when

Deliver an evidence-backed ready/not-ready verdict per project and dataset, including any blocked production gates. Mock-only tests cannot certify integrations. Optional unavailable Vercel/GA/GSC data can remain honestly unavailable; unresolved financial discrepancies cannot be silently labelled verified.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
