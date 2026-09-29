# S4 — SMS analytics collectors and final source handoff

- **Implement in:** SMS Code
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/smsapp`
- **Prerequisites:** S3 completed.
- **Scope:** Source-owned website analytics in the SMS backend; preserve existing public locale instrumentation.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Inspect actual GA/Vercel tracking and property configuration in landing. GA and GSC connectors were not verified in the source audit; do not invent configured access. Add server-only collectors with explicit unconfigured/unsupported states so financial delivery can proceed independently.
2. When GA tracking/access exists, collect overview/daily and compatible landing/channel/device/country reports with pagination and metadata. Query period distinct users separately, preserve property timezone and use durable daily jobs with proposed 7-day refresh overlap.
3. Add Search Console daily property totals and separate top page/query reports using an authorized exact property identifier. Preserve Pacific source days, search/aggregation type, provisional/final status, row limitations and proposed 14-day overlap. Recompute CTR from matching clicks/impressions; do not average positions without correct weighting/semantics.
4. Optionally add a supported Vercel Web Analytics Drain after verifying plan/cost/auth/delivery/schema. Use durable collection and supported aggregates; preserve batch retry evidence and sampling limits. Do not deduplicate legitimate events on path+timestamp or promise historical replay/unique visitors without evidence.
5. Expose reports through S3 with health, coverage, source timestamps and one configured primary visitor definition. Keep GA and Vercel separate, and web funnel denominators separate from native app/coin sales. Acquisition history without recorded links stays unknown.
6. Finish implementation-backed capabilities/schema/fixtures and provider reconciliation handoff for central ingestion. No direct central GA/RevenueCat polling for SMS.

## Verification / done when

Test unconfigured providers, stale imports, leased retry recovery, GA unique counts, GSC top-row incompleteness, source timezone boundaries, corrected daily reports and Drain limitations. Verify actual provider comparisons when access exists and explicitly label unverified items. URL Inspection and change notifications are deferred.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
