# D1 — Doppler reporting service and canonical history

- **Implement in:** Doppler
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/doppler`
- **Prerequisites:** C0 completed; shared contract artifacts available.
- **Scope:** Own Doppler-local reporting only. Inspect doppler-web, doppler-admin and source Supabase ownership; do not edit Simnetiq or native clients.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Inspect payment evidence in doppler-web/src/lib/revolut.ts, src/lib/oxapay.ts, the corresponding webhook routes and supabase/functions/revenuecat-webhook/index.ts. Inspect doppler-admin/src/lib/statistics-data.ts, dashboard-data.ts and subscription-display.ts. Verify actual migrations and later overrides before designing storage.
2. Choose and document one deployed backend to own the reporting service, durable imports and eventual export API. Prefer existing conventions. The separate admin UI must consume the same service; do not copy formulas between applications or expose database service credentials to browsers.
3. Build the canonical financial observation store and shared exact-decimal calculation service. Normalize invoices and provider transactions to one economic sale; keep webhook transport identity separate. Preserve source account, environment, original money/crypto evidence, revisions, correction links and immutable change sequence. Exclude sandbox from production reports and quarantine ambiguous environments.
4. Add source-local durable history import and incremental recovery using existing evidence/access, leases, checkpoints, bounded retry and overlap deduplication. Keep checkout/entitlement fulfilment independent from reporting availability. RevenueCat access grants alone are not complete monetary history.
5. Implement gross, principal refunds, sales tax, fees, net sales and net proceeds with explicit amount/tax basis, coverage and formula versions. Missing components remain null. Store source-side FX evidence under C0; retain original currencies. Preserve recorded attribution and unknown history.
6. Make source snapshot/cutoff explicit and stable, including historical corrections; document earliest reliable dates and remaining unsupported provider evidence.

## Verification / done when

Native-currency tests cover invoice + webhook + history replay as one sale, concurrent duplicates, partial refund/reversal, chargeback, out-of-order updates, voids, crypto precision, missing fees/tax/FX and sandbox exclusion. Reporting failure must not disrupt payment fulfilment. Provide redacted actual evidence where available and label synthetic-only coverage.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
