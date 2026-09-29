# S2 — SMS supplier economics, local expenses and reconciliation

- **Implement in:** SMS Code
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/smsapp`
- **Prerequisites:** S1 completed.
- **Scope:** Extend source-local reporting with cost and expense evidence without changing legacy SMS figures.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Export OnlineSim top-ups as prepaid transfers and supplier consumption as cost. Keep available/frozen balance snapshots timestamped and preserve alternate recorded-cost vs real-spend methods. Surface unlogged top-ups, missing activation cost and snapshot gaps.
2. Provide operations/daily data: purchased/spent/refunded/outstanding coins, delivered/attempted counts, cost per activation and supplier gap. Freeze windows and definition versions. Exclude SMS content, phone numbers and customer identifiers not required by the contract.
3. Add project-local expenses/manual income with drafts/post/reversal, source owner, vendor/category, service period, due/paid dates, currency/tax, payment account, recurrence metadata and private receipt references. Shared/company expenses are entered in Simnetiq only.
4. Preserve legacy profit as its own report. Build a documented bridge to comparable purchase/earned/cash reporting with completeness flags; `cash_net` is legacy proceeds, not verified bank cash or net sales. SMS coin packs never produce subscriptions/MRR.
5. Add verified settlement/bank statement import and matching where evidence exists; otherwise keep balances unavailable. Payouts/opening balances/transfers are distinct facts and never new sales. Implement supported FX evidence under C0 separately from USD parity.
6. Make local admin financial/export values use the S1 service; expose missing fees, FX, overhead/taxes and reconciliation residuals rather than inventing full net profit.

## Verification / done when

Test top-up + later consumption charged once, no cost inferred from transfer alone, missing costs remain visible, local expense corrections counted once, legacy totals unchanged, multi-sale settlement and missing-bank-data behavior. Verify receipt authorization, exact decimals and native parity before GBP policy comparison.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
