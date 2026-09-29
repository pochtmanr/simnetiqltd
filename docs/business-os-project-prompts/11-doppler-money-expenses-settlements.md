# D2 — Doppler Money page, expenses and settlement reconciliation

- **Implement in:** Doppler
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/doppler`
- **Prerequisites:** D1 completed.
- **Scope:** Own Doppler admin financial workflows and source-local costs, using D1’s single calculation service.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Add the local Money page in doppler-admin using existing admin auth/design conventions. Show gross sales, refunds, net sales, provider deductions, proceeds, direct cost, operating expenses and profit with basis/cutoff/quality and drill-through. Keep processor/channel/acquisition fields distinct.
2. Implement source-owned expense and manual-income drafts, posting and audited reversal/replacement. Expenses include vendor/category, currency/tax/recoverability, service period, due/paid dates, payment account, recurrence metadata and private receipt reference. Imported evidence is immutable. Recurring expectations do not imply payment.
3. Record direct hosting/vendor service costs and distinguish incurred expenses from spent cash. Define contribution and operating profit; net profit/margin stays unavailable where required components or a valid denominator are missing. Shared company overhead is owned by Simnetiq and must not be entered here again.
4. Add supported provider settlement/statement import or a validated private file-import path where APIs are unavailable. Match payouts to sales/fees and expose residuals. Timestamp bank/clearing/wallet/pending/reserved balances; unverified cash remains unavailable. Transfers and payouts never create additional revenue.
5. Preserve fiat invoice value separately from OxaPay token/network/payment/fee evidence. Add document metadata with checksums and authorized delivery, never permanent public receipt URLs.
6. Expose reconciliation and financial facts through the D1 service for D4, and prepare an exact frozen native-currency Money-page snapshot.

## Verification / done when

Test a source-local expense and correction counted once, cash vs service-period expense, incomplete profit, exact allocation/rounding where applicable, multi-sale payout and residual, own-wallet transfer, receipt authorization, and identical service/UI totals at a frozen cutoff. Real bank balances require statement evidence.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
