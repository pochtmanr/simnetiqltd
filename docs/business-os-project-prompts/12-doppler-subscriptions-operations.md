# D3 — Doppler subscription and operational metrics

- **Implement in:** Doppler
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/doppler`
- **Prerequisites:** D1 completed; D2 recommended before local UI integration.
- **Scope:** Source-local subscription/operations reporting; do not calculate these metrics independently in Simnetiq.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Inspect doppler-admin-bot/src/services/analytics.ts and the actual jobs/tables that populate its metrics. Treat existing table readers as evidence of possible inputs, not proof of correct upstream calculations.
2. Define distinct recurring contracts, active customers and paid-access accounts at a frozen as_of timestamp. Separate fixed-term VPN access from recurring subscriptions and trials from paying subscribers.
3. Implement recurring-only MRR/ARR, trial/grace/cancel/expiry/auto-renew status, period boundaries and churn with explicit cohort, numerator/denominator, interval normalization, currency, formula version and coverage. Cancellation does not immediately mean loss of access or churn.
4. Export only supported aggregate operational counts, with no secrets/customer PII. Integrate the same service into local admin and the later subscriptions/operations endpoints.
5. Replace error-to-zero behavior in the reporting path with null/unavailable and source health warnings; preserve unrelated bot behavior.

## Verification / done when

Test fixed-term access excluded from MRR, annual/monthly intervals, trial conversion, cancellation before expiry, grace periods, duplicate lifecycle events, distinct customer vs contract counts, missing upstream jobs and zero denominators. Compare local admin/service results at one cutoff.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
