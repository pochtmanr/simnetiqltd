# Project reporting APIs — function and delivery matrix

Updated 28 September 2026. This supplements the audit with deeper Doppler analytics inspection. **Design and source-code status only; no API implemented or production integration certified by this document.**

## Architecture decision for this iteration

Each project owns its local financial and analytics reporting service. Doppler admin displays Doppler gross/net/cost/profit; SMS admin retains its existing figures. Their admin UI and export API must call the same local calculation service. Simnetiq fetches both using one versioned contract, stores revisioned observations, reconciles them and renders the consolidated business view. This supersedes any earlier suggestion that Simnetiq should independently reimplement each project's financial formulas.

Recommended transport: **Simnetiq pulls scheduled snapshots and incremental records**; projects return data over HTTPS. Optional project-to-Simnetiq change notifications can reduce latency later; do not build two independent ingestion paths now. A Vercel Drain is different: Vercel pushes events into the relevant project collector, which exports aggregates through the same project API.

Source-provider imports live with each project. Simnetiq does not also poll the same GA/RevenueCat account for those projects. It may collect the corporate Simnetiq website's own analytics separately. Provider credentials remain with project backends. Each expense has one write owner: project-local expenses belong to that project; shared/company expenses belong to Simnetiq. Cross-system editing is deferred. An expense never gets re-imported as a new expense merely because it appears in another view.

Legend: **E** = implemented in inspected source; **I** = exists partially / needs improvement; **N** = new work not found in inspected source; **—** = not applicable. E does not mean production verified. Mixed codes distinguish an existing source from missing reporting. All exported rows need the common provenance envelope in BUSINESS_OS_PROJECT_API_CONTRACT.md.

## Financial functions

| Function / output | Doppler | SMS Code | Required work and owner | Data to provide |
|---|---|---|---|---|
| Payment source records | E/I: web invoices, Revolut/OxaPay; RevenueCat entitlement handling | E: RC credit grants + wallet ledger | Doppler: normalize money history, not just access grants. SMS: read-only export of existing ledger | source/account/environment, external transaction ID, product, event type, original amount/currency, purchased/received time |
| Gross sales (brutto) | I: invoice inputs; complete financial report not found | E/I: SQL gross, sometimes reconstructed | Doppler: common sales report. SMS: preserve native USD and expose derived-gross flag | completed gross purchases; amount basis/tax inclusion; original and GBP value; count; source coverage |
| Refunds / refund reversals | I: lifecycle sources, complete finance coverage unverified | E/I: clawback/regrant logic | Separate refund principal, tax and fee reversal; identify parent purchase; preserve legacy SMS net-refund presentation | adjustment ID, parent transaction ID, amount, effective date, reason/status |
| Store / processor fees | N/I: payment inputs; fee/settlement reporting not verified | I: gross-minus-net and estimated proceeds | Retrieve actual fees where available; distinguish estimate from confirmed fee; do not call inferred difference exact commission | commission, processor/network fee, tax components, estimate method and provider evidence |
| Net sales | N: defined normalized report needed | I: legacy proceeds are not net sales | Both: gross less refunds and sales tax on comparable basis; leave unknown components null | net_sales, refunds, sales_tax, coverage and calculation version |
| Net proceeds (netto after provider deductions) | N/I: payment inputs available | E/I: cash_net ledger-derived | Doppler: calculate through shared local service. SMS: expose cash_net as legacy proceeds, not bank settlement | proceeds + component breakdown, estimated/actual/legacy_derived labels |
| Direct service costs | N: hosting/infrastructure expense report not found | E/I: activation recorded costs and OnlineSim spend | Doppler: server/vendor bills, periods and allocations. SMS: missing-cost indicators, retain alternative cost methods | category/vendor, service period, project amount, cost basis, source expense/activation ID |
| Operating expenses / spent | N | N beyond supplier/top-up functionality inspected | Both: manual/imported expenses with paid/due dates, receipts and categories; separate spent cash from incurred expense | expense ID, vendor, category, amount/currency, tax, paid/due dates, payment account, recurrence |
| Supplier top-ups / prepaid credit | — unless another prepaid supplier exists | E/I: topups + balance snapshots | SMS: export top-ups as prepaid transfer, consumption as cost; do not expense both | topup ID, source account, supplier account, amount, effective date; frozen/available balances |
| Contribution / gross profit | N | E/I: earned minus recorded cost or real spend | Doppler: proceeds minus delivery costs. SMS: retain exact existing definitions and bridge to comparable reporting | revenue basis, cost basis, profit, numerator/denominator, fallback share |
| Operating / net profit and margin | N | N/I: existing SMS profit excludes full company overhead/taxes | Both: operating profit from complete costs; only publish net profit when required components exist; Simnetiq allocates shared overhead once | operating_profit, net_profit nullable, margin nullable, completeness and missing components |
| Bank cash / payouts / reserves | N | N: current cash_net is not bank cash | Add settlement/statement imports and matching; balances timestamped; unavailable until verified | account kind, as_of, available/pending/reserved, payout and matched transaction IDs |
| FX and GBP reporting | N for common export contract | N: legacy reports USD | Common exact-decimal library/policy; source native figures retained; central conversion for consolidation under shared policy | original amount/currency, GBP amount, rate/source/effective time/policy version |
| Revenue by channel/provider/plan | I: store and account breakdowns, invoice sources | I: purchase/product breakdown inputs | Separate channel, processor/store, ingestion source and acquisition attribution | project, channel, store, processor, plan/product, acquisition source/model |
| Subscriptions / active paid access | E/I: tier/expiry/store statistics | — for inspected consumable flow | Doppler: separate paid access from recurring contracts; source billing status | active_contracts, active_customers, paid_access_accounts, auto_renew, period boundaries |
| MRR / ARR / churn / trials | I: admin-bot analytics table reader, upstream completeness unverified | —: coin packs are not subscriptions | Doppler: verify upstream jobs and definitions; calculate recurring-only values with coverage; no SMS MRR | recurring price/interval, trial/grace/cancel/expiry state, cohort and formula |
| Coin and delivery economics | — | E/I: delivered earnings, costs, balance reconciliation | SMS: expose reusable API with frozen window and legacy version | coins bought/spent/refunded/outstanding, delivered/attempted, cost/activation, supplier gap |
| Manual income and corrections | N | N for general business workflow | Add audited drafts/post/reversal; no overwrite of imported financial evidence | manual origin, amount, supporting reference, actor, correction link/reason |
| Financial history / backfill | I: invoices/source events | E/I: SQL/ledger history | Cursor exports with fixed snapshot cutoff, overlap recovery, revisions and coverage dates | stable record ID, updated sequence, revision, deleted/voided marker, next cursor |

## Traffic and acquisition functions

| Function | Doppler | SMS Code | Required work / method | Data to provide |
|---|---|---|---|---|
| GA4 report retrieval | E/I: admin `ga-data.ts` uses report API | N: no equivalent connector found in landing search | Doppler: reuse service-account client; add explicit dates, durable cache, pagination/metadata and export. SMS: configure property and same connector if GA tracking exists/enabled | daily active/new users, sessions, page views; period distinct users separately |
| GA4 source/landing/device/country reports | E/I: current pages/countries/channels reports | N | Extend compatible dimension/metric queries, preserve report grain; top-N separate from totals | source/medium/channel, landing page, device category, country, report range and metrics |
| GA4 conversion funnel | I: purchase attribution/event sources, full funnel unverified | N/I: app purchase data separate from web analytics | Define events and denominators; server-confirmed payments; do not divide app sales by website visitors | event counts, distinct converted sessions, eligible sessions, attribution window/unknown share |
| Search Console search performance | E/I: `doppler-web/scripts/gsc-api.py` CLI | N: automated connector not found | Reuse auth logic after review; scheduled API collector, retries/paging, daily totals and separate top queries/pages | clicks, impressions, CTR, average position; query/page/country/device/search type |
| Search Console indexing status | I: script capabilities must be scoped if required | N | Optional later targeted URL Inspection, not required for v1 financial dashboard; no invented site-wide indexing API | inspected URL, inspection time, coverage/verdict/canonical if supported |
| Vercel pageview/event collection | E: website instrumentation | E: public layouts | Existing collection is not an export API. Add supported Web Analytics Drain if account supports it | original event timestamp, project/environment, path, referrer, supported device/session fields |
| Vercel centralized analytics | N/I: workflow file exists, reporting completeness unverified | N | Drain collector + durable aggregate job; historic CSV/export only if account supports it; verify sampling and delivery semantics | pageviews, event counts, daily provider-defined visitors where reconstructable; source timezone/sampling |
| Visitor headline | I: GA active users available | I: Vercel UI collection present | Choose one primary per project; retain GA and Vercel comparisons separately | metric name/provider/identity definition, period, coverage, unique count |
| SEO → visit → purchase comparison | N | N | Align landing pages/date ranges as aggregate analysis; search query clicks do not identify customers | separate GSC, GA and sales series; no false user-level join |
| Revenue by marketing source | I: nullable invoice attribution migration | I: no full app acquisition join verified | Use recorded order attribution; missing historical source remains unknown | order/transaction ID, source/medium/campaign, model/window, consent state |

## Project API and central functions

| Function | Existing state | Work required | Output / verification |
|---|---|---|---|
| Same local UI + export calculation | N standardized service; SMS SQL logic reusable | Doppler creates report service; SMS wraps SQL without formula changes | Same cutoff/config gives identical source admin and API values |
| Versioned read-only project API | N | Implement endpoints in contract; machine credentials separate from human admin auth | capabilities, overview, records, finance, analytics, health |
| Durable provider import jobs | I in sources, uniform status missing | Explicit schedules, leases, cursors/retry and stale-data states | successful sync, covered-through, lag, failures and source permissions |
| Simnetiq project connector | N | Scheduled server pull, credential-project binding, staged validation, cursor commit after transaction | one stored observation per source/id/revision; project cannot impersonate another |
| Consolidated financial reporting | N | Journal facts drive totals; source summaries validate, never post them again | project and overall views with consistent basis/GBP valuation |
| Shared overhead allocation | N | Simnetiq owns shared expense and allocation ID; source costs remain original | pre-allocation project profit, central allocation, post-allocation profit |
| Document / receipt metadata | N shared export | Source exports redacted references; access through authenticated proxy or authorized short-lived URL | document ID/title/category/checksum; no permanent public link |
| Business registry / deadlines | N central | Simnetiq owns legal/service records, project association and reminders | service/registration reference, dates, related documents; no secrets |
| Contract validation / reconciliation | N | Schema tests + frozen source snapshots + native-currency matching + same-window comparison | mismatch list, quality flags; no success based solely on mock data |
| Health / alerting | I scattered source status | Shared health shape; missing/error returns unknown rather than zeros | source status/as_of/coverage/warnings; owner-configured alerts |

## Evidence map

Paths under `/Volumes/RomanSSD/Developer/`:

- Doppler payments: `doppler/doppler-web/src/lib/revolut.ts`, `src/lib/oxapay.ts`, `src/app/api/{revolut,oxapay}/webhook/route.ts`, `supabase/functions/revenuecat-webhook/index.ts`.
- Doppler admin: `doppler/doppler-admin/src/lib/statistics-data.ts`, `ga-data.ts`, `dashboard-data.ts`, `subscription-display.ts`. GA configuration reads GA_PROPERTY_ID, GA_SA_CLIENT_EMAIL and GA_SA_PRIVATE_KEY. Values were not read.
- Doppler GSC: `doppler/doppler-web/scripts/gsc-api.py` has search analytics query/date/dimension/rowLimit support. A script is not yet a scheduled, central-ready connector.
- Doppler analytics table readers: `doppler/doppler-admin-bot/src/services/analytics.ts`; some errors/empty results become zero and must become explicit unavailable states in financial exports.
- SMS: `smsapp/sms-expo/supabase/migrations/20260845000000_admin_money.sql`, `functions/rc-webhook/index.ts`, `smsapp/landing/lib/admin/rpc.ts`, `app/(admin)/admin/money/page.tsx` and public locale layouts.

## What the owner supplies

| Input | Purpose | Handling |
|---|---|---|
| Deployed Doppler and SMS API base URLs | Route central connectors to correct source | Non-secret configuration; verify deployment versions |
| Google GA4 property ID per site and property timezone | Select GA reports | Property access granted to connector identity; ID alone insufficient |
| Search Console exact property identifier | Domain or URL-prefix property selection | Grant read access to service account or use approved OAuth; API enabled |
| Google API credentials / access | GA/GSC scheduled reporting | Secret manager only; never paste private key into docs/chat |
| Vercel team/project IDs and plan/access | Drain setup and scope | Confirm feature eligibility/cost, endpoint verification and credentials before enabling |
| RevenueCat projects/apps/store mapping; Revolut and OxaPay source access | Source-side financial imports | Existing secrets stay on project server; central gets only export credentials |
| Hosting/software/advertising bills and supplier top-ups | Complete project costs | Upload receipts; record currency, paid date and service period |
| Bank/store payout statements and opening balances/date | Verify actual cash | Private import; separate unsettled proceeds from settled money |
| VAT status, fiscal year, FX policy and shared-expense allocation | Comparable profit reports | Owner/accountant-verified inputs; no assumed tax rates |

## Execution order

1. Freeze API/metric contract and source-authority rules; create redacted fixtures.
2. Doppler financial service + local Money page; structured expenses and provider reconciliation.
3. SMS API wrapper around existing money SQL, with fixed cutoff and coverage flags.
4. GA/GSC scheduled source connectors and optional Vercel Drain collector in each project.
5. Simnetiq connector and consolidated UI; shadow-import until native financial parity passes.
6. Add optional change notifications only if measured polling latency requires them.

Official capabilities checked: [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/basics), [Search Console query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [Vercel Drains](https://vercel.com/docs/drains), [Web Analytics event schema](https://vercel.com/docs/drains/reference/analytics). Actual account access remains unverified.
