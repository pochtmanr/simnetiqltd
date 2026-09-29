# S3 — SMS read-only Business OS API

- **Implement in:** SMS Code
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/smsapp`
- **Prerequisites:** S1–S2 completed; C0 conformance artifacts pinned.
- **Scope:** Implement machine export in landing’s backend using narrowly scoped source database reporting access.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Implement C0 routes under /api/business-os/v1: capabilities, overview, finance/summary, finance/daily, finance/records, finance/balances and finance/reconciliation, operations/daily, analytics/report, health and subscriptions/summary. Declare subscriptions unsupported with capability false and the frozen unsupported-dataset response; never return fake zero MRR. Analytics is completed in S4.
2. Implement C0 HMAC with per-project rotating key IDs, empty-body GET signing, constant-time verification, freshness/future guards, durable atomic nonce replay checks and project/environment binding. Never weaken existing human AAL2 RPC requirements or give Simnetiq a Supabase service-role/human token.
3. Return stable canonical record IDs, revision/change sequence, economic/component identity, voids and legacy-vs-original amounts. Freeze pagination high watermark and filter binding; support initial bounded backfill, incremental old-record corrections, cursor expiry/resync and private exact-query caches.
4. Enforce date/timezone/basis/range/page limits, native subtotal precision, source access and all specified error responses. Match local admin/service/API totals under the same cutoff and formula version; advertise only supported bases.
5. Export coverage, earliest reliable dates, health covered-through, operations and redacted document references. Strip SMS content/phone numbers/customer email/secrets.
6. Generate implementation-backed schemas/OpenAPI and source handoff with capabilities, deployed URL when available, redacted USD fixtures, ID mapping, FX/formula version, limits and reconciliation report. Provision export credentials only in the secret manager.

## Verification / done when

Pass C0 contract/auth tests and frozen USD UI/API parity. Test duplicate/concurrent pages, correction of an old transaction, 410 recovery, ID/revision hash conflict, revoked/replayed/wrong-project key, existing human MFA regression and production/sandbox separation. Live deployment/parity remains unverified without evidence.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
