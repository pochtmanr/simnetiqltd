# M4 — Shadow reconciliation and consolidated reporting

- **Implement in:** Simnetiq main dashboard
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** M3 completed; source financial handoffs and frozen native fixtures available.
- **Scope:** Create central read models and verify source-to-central parity before labelling imported totals verified.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Run shadow imports with source project/date/basis/filter/formula/cutoff alignment. Compare source local UI, export snapshots and central record-derived native-currency totals. Native currency is the first parity gate; compare GBP only with matching FX policy/data.
2. Preserve SMS frozen legacy USD results and bridge each metric to comparable totals without rewriting legacy formulas. Explain recorded-cost vs real-spend, earned vs purchase and cash_net vs settlement differences. Reconcile Doppler per source/store/channel and original currency.
3. Build project/overall financial read models from the journal: gross, refunds, tax, fees, proceeds, costs, operating profit and nullable net profit/margin. Use imported source observations as checks. Never mix unsupported bases or treat partially covered projects as a complete company total; show exclusions and coverage.
4. Reconcile payouts, prepaid usage and timestamped balances with residuals/missing evidence. Shared overhead is allocated once with before/after views; source profit remains traceable to source costs and formula version.
5. Add monthly/annual/custom reporting and drill-through from every summary metric to dataset/filter and supporting records, revisions, source snapshot, formula and FX evidence. Keep reports reproducible at their cutoff and flag partial days.
6. Expose integration/reconciliation quality gates and mismatch lists. Activate verified state per dataset/project only when actual evidence passes; missing live access remains unverified and does not prevent explicitly incomplete UI.

## Verification / done when

Acceptance covers same-window native parity, SMS legacy rounding, matching-policy GBP parity and alternate-policy differences, missing fees/FX/costs, top-up/settlement non-revenue, duplicate/correction/backfill and partial project coverage. Save redacted real comparison evidence and unresolved residuals; mock-only success cannot enable verified reporting.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
