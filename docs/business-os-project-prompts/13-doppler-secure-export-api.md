# D4 — Doppler read-only Business OS API

- **Implement in:** Doppler
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/doppler`
- **Prerequisites:** D1–D3 completed; C0 conformance artifacts pinned.
- **Scope:** Add the versioned export API to D1’s chosen backend, sharing its calculation service with admin.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Implement all C0 endpoint routes: capabilities, overview, finance/summary, finance/daily, finance/records, finance/balances, finance/reconciliation, subscriptions/summary, operations/daily, analytics/report and health. Advertise unsupported or unconfigured datasets honestly; analytics is completed in D5.
2. Implement server-only scoped HMAC keys, TLS deployment requirement, timestamp/future bounds, constant-time verification and atomic durable nonce replay prevention. Keep machine auth separate from human admin sessions; use narrowly scoped read access and ensure rotation/revocation cannot affect checkout.
3. Enforce contract date/range/page/basis/source guards and specified error responses. Bind opaque cursors to filters, project/environment and frozen high watermark. Return corrections to older records through immutable change sequence, including voids and 410 resync behavior.
4. Export canonical record provenance and exact original values, component/economic identity, coverage, formula/FX versions and drill-through references. Summaries are non-posting observations. Return true covered-through timestamps and per-source warnings, with private exact-query/snapshot caching.
5. Redact customer emails, tokens and secrets. Export document metadata/references only with authorized retrieval.
6. Generate implementation-backed OpenAPI/JSON Schemas and a source handoff: deployed base URL when available, capabilities, versions, earliest reliable dates, rate limits, health, ID mappings, redacted fixtures and reconciliation evidence. Transfer credentials only through the secret manager.

## Verification / done when

Run C0 conformance and HMAC vectors; reject replayed/revoked/wrong-project credentials, query tampering and oversized ranges. Prove concurrent pagination freezes a snapshot, old corrections appear next sync, ID/revision hash conflicts fail, and local UI/API native totals match. No deployment access means an explicit incomplete deployment gate.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
