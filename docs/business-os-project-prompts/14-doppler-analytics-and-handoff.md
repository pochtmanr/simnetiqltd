# D5 — Doppler analytics collectors and final source handoff

- **Implement in:** Doppler
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/doppler`
- **Prerequisites:** D4 completed.
- **Scope:** Own Doppler provider analytics imports and `/analytics/report`, including optional Vercel Drain only when supported.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Reuse doppler-admin/src/lib/ga-data.ts after inspection. GA_PROPERTY_ID, GA_SA_CLIENT_EMAIL and GA_SA_PRIVATE_KEY are configuration names, not values to print. Add explicit dates, durable report caching, compatible dimensions, pagination and quota/threshold/sampling/other-row metadata.
2. Schedule GA daily collection with a proposed previous-7-day refresh; query period distinct active users separately. Preserve GA property timezone, grain and source as_of. Never sum distinct daily/page/country users into period uniques.
3. Review doppler-web/scripts/gsc-api.py auth/query logic and build a durable scheduled collector. Query daily property totals separately from top pages/queries; preserve Pacific source days, search/aggregation type, provisional/final state and retrieval time. Proposed refresh overlap is 14 days; cadence is quota-aware.
4. Verify actual Vercel plan/access and current official Drain contract before enabling an optional authenticated collector. Store durable batches/retry metadata and aggregate only supported semantics. No path+timestamp deduplication, promised historical replay or invented unsampled visitors. If unavailable, expose an unsupported state without blocking GA/GSC.
5. Choose a configured primary visitor headline and keep provider comparisons separate. Define funnel eligibility and attribution windows; never divide native-app purchases by web sessions or join search queries to individual buyers. GA revenue is a check signal, not another financial import.
6. Export reports via D4 with coverage/health; exercise job leases/retries and replaceable analytics revisions. Finish source handoff and redacted provider comparison evidence.

## Verification / done when

Test GA period uniques non-additivity, GSC partial top rows vs totals, CTR/position aggregation semantics, source timezone boundaries, provider outage/stale coverage, report revisions and optional Drain duplicate batches/sampling limitations. Document each actual permission/configuration gap. URL Inspection and source-to-central change notifications are deferred.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
