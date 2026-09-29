# Business OS — metric definitions and management policy

GBP reporting; original amounts retained. Proposed reporting day: Europe/London (DST aware), storage UTC. Every card exposes date basis, filter scope, freshness, formula version, completeness and drill-through. Unknown is not zero. Current periods compare with the same elapsed prior period. Business OS provides management figures; statutory recognition, VAT status and fiscal year require owner/accountant input.

## Money definitions

| Metric | Definition | Evidence/guardrail |
|---|---|---|
| Gross customer sales | Completed customer charges before fees/refunds; label tax-inclusive amount separately | Purchase date, exclude sandbox/failed and internal transfers |
| Net sales | Gross charges − refunded principal − applicable sales taxes, with matching tax reversals | Do not silently assume taxes are zero |
| Net proceeds | Net sales − store commissions − processing fees ± fee adjustments | Mark estimated components; separate actual settlements |
| Direct costs / COGS | SMS supplier consumption; VPN attributable delivery costs under documented allocation | Do not expense prepaid top-up and consumption twice |
| Contribution profit | Net proceeds − direct costs | Basis consistently selected; never add SMS pack sales and SMS earned revenue |
| Operating profit | Contribution profit − operating expenses | Shared expenses allocated once, unallocated shared costs remain visible |
| Net profit | Operating profit + other income − financing costs − profit taxes | If components incomplete, show provisional operating profit instead of verified net profit |
| Profit margin | Corresponding profit / net sales × 100 on the same recognition basis | N/A when denominator <= 0; SMS legacy margin shown separately |
| Net cash movement | Actual external bank/wallet inflows − outflows; internal transfers excluded in consolidation | Payouts are receipts, not fresh sales; owner funding is financing, not revenue |
| Available cash | Latest liquid bank/wallet balances, with as-of per account | Exclude pending payouts, reserves and OnlineSim prepaid/frozen credit |
| Pending payouts | Provider-reported unsettled amount, or explicitly estimated clearing receivable | Do not sum a balance snapshot with its component transactions |
| Runway | Available cash / trailing average monthly net cash burn | N/A when cash-generating; show input window/coverage |
| Revenue/expense growth | (Current − comparable prior) / prior | N/A when prior is zero; distinguish date bases |

Use separate Sales/proceeds, Earned profit, and Cash views. Default first-release sales view is purchase-date management reporting. Earned profit for SMS remains a dedicated legacy-compatible panel until recognition policy is agreed. Never consolidate SMS delivered revenue with VPN purchase-date revenue under a label implying consistent recognized revenue. Cash-based surplus and accrual-style profit are different outputs.

Income dimensions are independent: **product** (VPN/SMS), **channel** (iOS/Android/web/manual), **processor/store** (App Store/Google Play/Revolut/OxaPay), **ingestion source** (RevenueCat/source ledger/provider export), **marketing source** (organic/paid/referral/direct/unknown). RevenueCat is a subscription data layer, not a bank or an acquisition channel. A sale imported from both a product DB and RevenueCat remains one sale.

## SMS Code exact compatibility target

Source: `20260845000000_admin_money.sql` and existing Money page.

- `gross`: live purchase gross USD, from stored event or reconstructed net/commission.
- `apple_fee`: gross minus net for purchase rows; this is a legacy derived difference, not independently verified commission/tax separation.
- `refunds`: net USD clawbacks less refund reversals.
- `cash_net = gross - apple_fee - refunds`: ledger-derived proceeds, not confirmed bank cash.
- `earned`: delivered activation coins × buyer lifetime net USD/coin, fallback configured rate. Preserve fallback share and missing-cost counts.
- `gross_profit = earned - recorded_cost`; margin denominator is legacy earned revenue, already net of store cut.
- `real_spend = start(balance + frozen) + applied topups + unexplained increases - end(balance + frozen)` as implemented through snapshot intervals. Unexplained increases and gaps make this provisional.
- `real_profit = earned - real_spend`; reconciliation gap = real_spend − recorded_cost.

Reproduce these figures in **USD first** at an identical frozen UTC cutoff and lookback. Existing RPCs anchor to now and charts bucket UTC; don't compare two moving windows or GBP London buckets. Then translate separate canonical events into GBP at their economic dates. A single current USD/GBP rate for a historical aggregate is only an explicitly labelled preview. Do not change source formulas during central integration.

SMS product metrics: paid pack buyers, repeat-purchase rate by cohort, coins purchased/spent/refunded/outstanding, delivered/requested SMS, delivery success, cost per delivered SMS, margin by service/country, balance depletion, default-rate share, missing-cost share, supplier reconciliation gap. Outstanding coins are operational units, not automatically a currency liability valuation. Exclude free promotional grants from sales.

## Doppler subscription and operations metrics

Count paying auto-renewing subscriptions separately from all valid paid access (which may include fixed-term web purchases). Cancellations mean auto-renew turned off, not necessarily access ended. Active subscribers are distinct source-linked customers; active subscriptions count contracts, and the two may differ.

MRR = sum recurring net-of-discount contractual price excluding sales taxes, normalized to calendar month (annual /12; monthly unchanged). Show gross-before-store-fee MRR and any proceeds estimate separately. Trials/free/fixed-term non-renewing purchases excluded; do not derive MRR from this month's cash. ARR = 12 × MRR. Grace/billing retry policy must be specified and shown. Churn = opening paid subscriber cohort that loses all paid access during period / opening cohort; new subscribers are not its denominator. ARPPU = period net sales / distinct period paying customers; do not confuse with MRR per active subscriber. Trial conversion uses matured trial cohorts. Retention uses cohorts with enough elapsed observation; LTV deferred until stable cohorts exist.

VPN management metrics: paid access, recurring subscribers, renewal failures, gross/net proceeds by store and website processor, expiry trend, refunds/chargebacks, hosting cost per paid account, contribution profit and uptime summary. Avoid bringing all server controls into this admin.

## Traffic, funnels and attribution

Daily unique visitors are per-site provider-defined observed visitors; label method and consent coverage. Never add daily uniques to claim monthly uniques, or sum site uniques as distinct people across the business. Combined dashboard may show **sum of site-level daily uniques** explicitly. Pageviews and sessions also need provider-specific definitions; proposed first-party session gap is 30 minutes if new tracking is necessary.

Prefer importing existing Vercel/GA reports through supported account-access/export paths; verify plan/API availability first. Do not assume a public Vercel Analytics reporting API exists. If unavailable, accept official CSV imports and establish prospective tracking as a separate task. Never scrape provider UI as a production data pipeline or fabricate history.

Funnel: landing session → relevant CTA/sign-up → paywall → checkout → server-confirmed purchase. Mobile app paywalls/store purchases require app telemetry and a supported consented attribution link; website visitors cannot be the denominator for all app sales. Keep website and app funnels separate when joins are absent. Count conversions using distinct transaction ids; client purchase event is attribution evidence, not additional revenue.

Default proposed attribution: last eligible non-direct web touch within 30 days, captured on order; retain first-touch too if available. Historical missing attribution = unknown. Preserve source/model/window version; compare providers only on equivalent definitions. CAC = attributable acquisition spend / new paying customers for matched channel/cohort; LTV absent until adequate cohorts, refund/cost history and attribution exist.

## Alerts and records

Low supplier balance (GBP threshold or observed days of cover), failed/stale import, unresolved reconciliation residual, payment failure spike, renewal/document deadline. Owner chooses thresholds and notification schedule. Default quiet operation: notify only actionable changes, deduplicate and resolve alerts; optional daily digest, not an assumed recurring notification.

Business profile: company number, registered address, VAT status/reference, financial-year dates, accountant and account references are user-entered/verified. Tax/legal deadlines are manually entered from verified records; no invented deadlines or rates.

## References checked during planning

RevenueCat fields include estimated tax/commission, not bank settlement proof: [taxes and commissions](https://www.revenuecat.com/docs/dashboard-and-metrics/taxes-and-commissions), [event fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields). UK analytics design must be checked against current [ICO storage/access exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/); do not assume cookieless or statistical tooling automatically permits individual cross-site tracking.
