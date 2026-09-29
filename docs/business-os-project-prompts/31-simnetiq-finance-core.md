# M2 — Central journal, FX and shared expense ownership

- **Implement in:** Simnetiq main dashboard
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** M1 and C0 completed.
- **Scope:** Implement central finance primitives and company/shared manual workflows, not source provider connectors or rewritten source formulas.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Implement exact decimal-string/Postgres numeric money, original amounts/currencies, revisioned source observations, immutable balanced journal entries and transactional posting. Store imported incomplete facts even when missing FX prevents a valid GBP posting; expose pending valuation instead of fabricating balanced zero entries.
2. Keep source summaries as non-posting observations. Only canonical record facts enter journal posting; transport aliases, fee component IDs, economic transaction mapping and source expense ownership prevent duplicate revenue/cost. Define reversal/replacement for corrections and voids, never delete posted evidence.
3. Implement drafts/post/reversal for central manual income and shared/company expenses, with due/paid/service dates, vendor/category, tax/recoverability, payment account, source owner and receipts. Imported source-local expenses are read-only here; cross-system editing is deferred.
4. Add shared expense allocations with stable allocation IDs, exact rounding and an explicit unallocated amount. Show project profit before allocation, central overhead allocation and after allocation; allocation must not add another company expense or rewrite original source costs.
5. Model bank/clearing/prepaid/frozen/reserved balances, supplier top-ups vs consumption, settlement transfers and opening balances. Keep purchase, earned_management, settled_cash and sms_legacy distinct; legacy SMS summaries never create a second revenue stream.
6. Implement versioned FX dataset/policy, reproducible source and central valuations, and visible conversion differences. Unknown tax/fees/costs/FX yield incomplete reports, not verified profit. Net profit and margin remain nullable. Add period locking/audited reopen and safe CSV formatting as required by existing financial design.

## Verification / done when

Test balanced transactional posting, duplicate aliases/fees, concurrent import identity, correction/void reversal, top-up + consumption, payout + bank observation, own-wallet transfer, exact allocation, non-two-decimal fiat/crypto, missing FX, zero/negative margin denominator and DST boundaries. Verify one shared expense changes company cost once.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
