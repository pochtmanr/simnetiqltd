# S1 — SMS frozen legacy reporting service

- **Implement in:** SMS Code
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/smsapp`
- **Prerequisites:** C0 completed; shared contract artifacts available.
- **Scope:** Use landing for the admin/server API and sms-expo/supabase for database logic as verified in this repository. Preserve app, payment and MFA behavior.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Read AGENTS.md in both subprojects and inspect sms-expo/supabase/migrations/20260845000000_admin_money.sql, functions/rc-webhook/index.ts, landing/lib/admin/rpc.ts and landing/app/(admin)/admin/money/page.tsx. Inspect later migrations and deployed definitions when accessible.
2. Extract/wrap the current money SQL as one reusable source-local reporting service. Freeze a window/cutoff instead of letting successive p_hours/now evaluations drift. Preserve exact legacy formulas and rounding; existing admin and export must call the same implementation.
3. Keep original USD gross, apple_fee, refunds, cash_net, earned, recorded_cost, real_spend, gross_profit, real_profit, balances/frozen balances and supplier gap. Label reconstructed gross, inferred commissions, configured/default coin rates and missing supplier cost explicitly.
4. Build canonical record mapping from purchases/refunds/regrants/activation costs and provider evidence. Stable economic IDs must join RevenueCat and wallet/source ledger observations without posting a second sale. Preserve original gross/refund principal separately from legacy net-valued refunds.
5. Add immutable change sequence/revisions and frozen export history while keeping imported evidence auditable. Exclude sandbox or quarantine ambiguous environments. Expose sms_legacy basis distinctly; unsupported comparable components remain null.
6. Keep existing human admin AAL2 checks. Design a narrowly scoped machine-read function/service that cannot invoke product/user-management operations; never impersonate an MFA owner.

## Verification / done when

Compare old admin and new service at fixed 24h/7d/30d and available-history windows with real redacted native-USD fixtures when possible. Explain every residual. Test free/unused coins, refund/regrant ordering, missing prices/costs/snapshots, source/RevenueCat duplicates and exact legacy rounding. Synthetic parity is not production parity.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
