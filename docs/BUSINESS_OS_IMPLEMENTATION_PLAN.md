# Business OS — implementation plan and handoff

> 28 September refinement: project-local reporting services now own their calculations and provider imports; Simnetiq consumes versioned read-only exports. Read [function matrix](BUSINESS_OS_FUNCTION_MATRIX.md) and [project API contract](BUSINESS_OS_PROJECT_API_CONTRACT.md) before implementing. These refine the earlier central-ingestion proposal below.

## Agreed release

Simnetiq Ltd, London; GBP; Doppler VPN and SMS Code only. Owner-only launch with future role support. Dedicated Simnetiq business bot. Deliver web admin and Telegram Mini App sharing data/services. Preserve public website and existing source payment/auth flows. This turn delivers planning documents and prompts, not the application.

## Sequence and acceptance gates

| Phase | Work | Demonstrable exit criterion |
|---|---|---|
| 0 — completed locally | Repository audit, scope, metric definitions, architecture, prompt pack | Evidence paths and uncertainties recorded; owner decisions incorporated |
| 1 — foundation + Telegram proof | Confirm target Supabase, migrations/RLS, owner/MFA login, linked bot identity/session, project registry, private route shell | Owner opens same profile in browser and Telegram; stranger/replay/read-only mutation denied; public routes still work |
| 2 — usable daily workspace | Exact-money journal/FX, expense/income drafts/posting/corrections, receipt upload, minimal overview, document metadata and service registry | Add GBP and foreign-currency expense from phone; receipt protected; totals reproducible; manual income visible exactly once |
| 3 — SMS parity | Narrow source export, backfill/incremental sync, legacy USD report bridge and supplier reconciliation | Frozen-window old/new totals match, differences explained; source app unchanged; GBP conversion independently tested |
| 4 — Doppler money | Invoice/Revolut/OxaPay observations, RevenueCat subscriptions/revenue, settlement imports and dedupe | Duplicate/concurrent/reordered replay gives one economic sale; refunds/fees correct; bank cash separated; source coverage visible |
| 5 — analytics and reports | Visitor imports/tracking, VPN subscription metrics, SMS operating metrics, project/source comparisons, CSV monthly/annual/custom reports | Actual collected visitor data only; equivalent definitions; no SMS MRR; reports reconcile to journal and show incomplete components |
| 6 — operations completion | Recurring schedules, timeline/calendar, registration/renewal records, reminder outbox, integration health | Deadline entered once, correct local-time occurrence, one notification; recurring bill never auto-assumed paid |
| 7 — release verification | Cross-client QA, RLS/financial tests, restore drill, monitoring/runbooks, verified production imports | Owner accepts both interfaces; restore proven; reconciliation and freshness checks pass; rollback documented |

An agent must not mark a provider complete from a mocked UI. Unknown data remains unavailable, with clear required evidence. Telegram core arrives in phase 1 and is used throughout, not tacked on after all desktop work.

## Dependency and ownership order

Prompt 01 freezes database/identity/DTO contracts. Prompt 02 implements financial core; source prompts 03/04 may inspect sources meanwhile but post only after finance contract lands. Prompt 05 builds shared web/mobile views after foundation, with manual finance first. Prompt 06 supplies analytics/operations; it can own isolated modules once contracts stabilize. Prompt 07 independently tests the merged system and release evidence. Run agents in parallel only across agreed file boundaries; one integrator owns migrations, proxy and package changes. Prompts are supplied for the user to dispatch; no agents were launched.

## Immediate work vs external dependencies

Can implement locally now: private route skeleton, shared DTOs/decimal rules, local migrations/policy tests, expense forms, document metadata UI, import fixtures/worker contract, source read-only export design and regression tests.

Needs configuration/evidence: Business OS staging/production Supabase selection, owner email/Telegram ID, bot creation/token/domain, source read-only export deployment, live schema and provider mappings, RevenueCat/report access, Revolut/OxaPay reports, analytics exports and opening balances. Credentials go through a secret manager/environment configuration, not committed files or chat.

Needs business policy before claiming verified profit: accounting vs management recognition basis, VAT status and tax fields, fiscal year, expense allocation (recommend explicit project allocation with unallocated shared overhead visible), FX source/date and historical backfill start. Default operational reporting is purchase-date sales/proceeds plus separate cash and SMS earned panels; this avoids blocking a useful first release on full statutory accounting.

## Project-management checklist

- [x] Inspect current website and main money/auth sources.
- [x] Confirm two-project scope, owner role, GBP and dedicated bot.
- [x] Record source limitations and source-of-truth distinctions.
- [x] Produce audit, architecture, DB, metrics, integrations, security, implementation and deployment documents.
- [x] Produce separately scoped agent prompts.
- [ ] Freeze timezone, reporting policy, FX and opening balances.
- [ ] Confirm infrastructure target and configure staging.
- [ ] Implement and prove identity/RLS.
- [ ] Implement manual finance/documents.
- [ ] Verify SMS native-USD parity.
- [ ] Verify Doppler sales and provider settlements.
- [ ] Deliver analytics, operations and production QA.

## Acceptance scenarios for business use

1. Open bot → authenticated overview with source age → add £25 VPN hosting expense + invoice → operating costs rise once; bank cash moves only if paid from a selected account.
2. Import the same SMS purchase via source ledger and RevenueCat replay → one sale; spend coins later → separate earned/consumption measure, not second consolidated purchase revenue.
3. Top up OnlineSim £100 → bank down, supplier prepayment up; supplier consumption later reduces prepayment and creates cost.
4. Receive store/Revolut payout covering many sales → clearing to bank, no new income; residual fees/FX explained.
5. OxaPay receipt then own-wallet transfer → one customer sale; transfer adds no revenue.
6. Unknown FX or missing source day → visible partial-data warning and exclusions; not a clean-looking zero.
7. Expiring contract → timeline entry + one configurable owner reminder; original document remains private.

## Next business questions (not repeated blockers)

Confirm Europe/London day boundaries; owner email and preferred bot name; earliest backfill date/opening balances; VAT status/fiscal year; whether cash-management reporting suffices initially; existing bank/store reports available; preferred expense allocation and reminder thresholds. Do not request secrets in responses.
