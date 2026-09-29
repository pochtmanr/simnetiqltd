# M5 — Main dashboard and responsive Telegram workspace

- **Implement in:** Simnetiq main dashboard
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** M1–M4 completed; D5/S4 needed for real analytics. Financial UI may ship with honest analytics-unavailable states.
- **Scope:** Build the main user-facing dashboard using existing shared server services and project-owned metric definitions.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Use the established app design and relevant UI/React instructions. Build /admin sections: Overview, Projects, Sales/transactions, Expenses, Doppler Subscriptions, Traffic, Accounts/payouts, Reports and Integrations. Add entry points for Documents/Business records/Timeline implemented in M6.
2. Overview shows sales, proceeds, costs/profit, verified cash, per-project performance, source freshness/coverage and attention items. Every money card includes currency/basis/period and drill-through. Show actual/estimated/legacy/unavailable distinctly; no placeholder production business figures.
3. Add date/project/source/currency/status filters, transaction provenance/components/corrections, before/after shared allocation, frozen SMS legacy panel, Doppler recurring vs paid-access counts and supported operations. Forms edit central-owned drafts; source-owned expenses link to their project workflow and remain read-only centrally.
4. Traffic uses imported GA/GSC/Vercel reports at their actual grain/timezone. Primary visitor headlines stay provider-specific; no sum of daily or cross-project distinct users, no top-query rows as totals and no false query-to-customer join. Keep app/web funnel denominators and unknown attribution visible.
5. Provide monthly/annual/custom CSV exports with explicit basis/currency/coverage and spreadsheet formula-injection protection. All arithmetic and authorization remain in shared server services.
6. Build /tg from the same services, with Overview/Money/Add/Documents/More navigation, touch/keyboard-safe quick income/expense entry, Telegram theme/safe-area/back behavior, browser fallback, stale/error/empty states and accessible responsive layouts. Documents become functional in M6; do not claim completion with dead links.

## Verification / done when

Browser-test desktop/mobile filters, drill-through, draft/post/correct, shared allocation, source-read-only behavior, CSV, stale/unavailable providers and permission errors. Test actual Telegram iOS/Android/Desktop staging where available and public locale regressions. Report which clients were actually verified.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
