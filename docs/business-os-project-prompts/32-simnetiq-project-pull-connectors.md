# M3 — Scheduled project pulls and revision-safe ingestion

- **Implement in:** Simnetiq main dashboard
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** M2 completed; D4 and S3 source handoff required for actual source integration. D5/S4 required for configured analytics.
- **Scope:** Implement one scheduled pull path for Doppler and SMS, using their export APIs only.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Configure allowlisted HTTPS source URLs and credentials bound to source project/environment. Discover capabilities and validate contract/formula versions before enabling datasets. Do not accept project identity from a payload independently of the configured connection.
2. Implement C0 HMAC client using fresh nonce/timestamp for retries. Add bounded timeouts, Retry-After handling, exponential retry, leases, durable sync runs and backfill/incremental checkpoints. Use initial date ranges and frozen cursors; avoid concurrent workers advancing one connection inconsistently.
3. Stage and schema-validate pages before posting. Enforce uniqueness on source/project/environment/record/revision and hash equality for repeated revisions. Quarantine same-ID/revision changed hashes and binding errors. Persist facts, posting/reversal effects and cursor atomically at the defined page commit boundary; failure never advances the cursor.
4. Consume record corrections and voids as revisions. Prevent economic/component duplication across aliases and history overlap. Preserve source timestamps, original money, source FX evidence and central valuation separately.
5. Import overview/finance/reconciliation/subscriptions/operations/analytics as typed non-posting observations, with snapshot IDs, compatible cutoff, grain, timezone and coverage. Preserve the last good snapshot with stale status during outages. Never post summary or GA revenue again.
6. Implement 410 resync as a recoverable documented flow with overlap deduplication, durable error/quarantine inspection and source health. Do not add push/change notifications or central direct GA/RevenueCat polling for these projects.

## Verification / done when

Test restart midway through pages, concurrent workers, timeout after remote response, transactional failure before cursor commit, duplicate replay, revised old transaction/void, hash conflict, wrong project/environment, 410 resync, 429/503 and source outages. Prove central downtime does not affect source payments. Run actual staging exports in addition to fixtures.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
