# Project reporting API — proposed v1 contract

> Frozen executable contract: [`contracts/business-os/v1`](../contracts/business-os/v1) version `1.0.0` (`business-os.contract.v1`). This file remains the proposal narrative. Where they differ, the frozen schemas, OpenAPI file, and conformance corpus win. Nothing here is a deployed endpoint.

**Not existing endpoints.** This is the implementation contract to build in Doppler and SMS, then consume in Simnetiq. Scope is read-only export; no payment or user-management commands. See BUSINESS_OS_FUNCTION_MATRIX.md for status and ownership. Version/date: proposal 2026-09-28.

## Transport and endpoint table

Base path on each project's backend: `/api/business-os/v1`. Simnetiq pulls over HTTPS from a server job. Local admin calls the same calculation service internally. A successful GET response is the project's “send to Simnetiq”; a separate POST push mechanism is not required for release 1.

| Proposed endpoint | Parameters | Response / use |
|---|---|---|
| `GET /capabilities` | none | project/environment, API and formula versions, supported datasets/filters/currencies, earliest data, max range/page size, timezone, configured sources |
| `GET /overview` | from, to, timezone, currency, basis | financial snapshot, distinct subscriber/access counts, source-specific traffic highlights and warnings; one consistent cutoff |
| `GET /finance/summary` | from, to, timezone, currency, basis, optional source/channel | gross/refund/tax/fee/proceeds/cost/profit components and native-currency subtotals |
| `GET /finance/daily` | same | explicitly non-overlapping daily buckets, including partial-day flags; stock balances are not additive |
| `GET /finance/records` | cursor, limit, optional initial from/to | incremental canonical sale/refund/fee/expense/cost/settlement/transfer facts, original amounts and revisions |
| `GET /finance/balances` | as_of | latest available snapshots on/before timestamp, cash/prepaid/frozen/clearing distinguished |
| `GET /finance/reconciliation` | from, to | matching runs, source-vs-ledger residuals, missing costs/FX and legacy comparison |
| `GET /subscriptions/summary` | from, to, as_of | VPN contracts/customers/paid-access/MRR/churn definitions; SMS unsupported with capability false |
| `GET /operations/daily` | from, to | SMS delivery/coin/cost figures or VPN operational counts; no SMS content/phone numbers |
| `GET /analytics/report` | provider, report, from, to, cursor | report grain, property/site, source timezone, dimensions, metrics, data state and coverage |
| `GET /health` | none | connection/import/export health, last successful sync and covered-through per source; no secrets |

Reporting intervals are `[from,to)` UTC ISO-8601 instants. Daily grouping uses declared IANA timezone; initial proposal Europe/London. Monetary reporting basis enum: `purchase`, `earned_management`, `settled_cash`, `sms_legacy`; endpoint capabilities state support. Unsupported basis yields 422 rather than relabeling another basis. Raw source analytics date boundaries are preserved separately (GSC Pacific; GA property timezone). Daily aggregates cannot be magically rebucketed to London without granular underlying data.

Proposed initial maximum: 366 days per summary request, 500 records per page; source capabilities may lower this. Pagination uses opaque stable keyset cursors with frozen high-watermark/source snapshot. Immutable change sequence records updates/corrections, including changes to older transactions. Cursor expired = 410 and documented resync. Request missing required dates = 400; unknown source access = 403; oversized interval = 422; rate limit = 429 with Retry-After; temporary failure = 503.

## Common formats

| Value | Format / rule |
|---|---|
| IDs | Stable strings; namespaced project/source; never infer identity from amount/date |
| Time | UTC ISO 8601 timestamps; local days `YYYY-MM-DD` plus timezone |
| Money | Decimal string in major units and ISO currency, e.g. amount `12.50`, currency `GBP`; no floating-point finance |
| Crypto | Decimal string + asset/network separately; never label crypto units as ISO fiat currency |
| Counts | Nonnegative integers in safe JSON range; larger counts serialized as strings under a versioned schema |
| Ratios | Decimal strings, scale 0–1 (e.g. `0.25` = 25%); average position is a positive numeric decimal, not ratio |
| Missing | value null plus quality/reason; zero only for known measured zero |
| Quality | actual / estimated / legacy_derived / unavailable; coverage independently complete / partial / missing |
| Revision | Increasing integer per stable record; correction reference or void marker; same ID/revision with different hash rejected |
| Provenance | provider/account/project, original source record IDs, formula version, source as_of and retrieved time |

Synthetic example only (not actual company figures):

```json
{
  "schema_version": "1.0",
  "project_id": "doppler",
  "environment": "production",
  "snapshot_id": "example-snapshot-01",
  "generated_at": "2026-09-28T09:00:00Z",
  "data_as_of": "2026-09-28T08:55:00Z",
  "period": {"from": "2026-09-26T23:00:00Z", "to": "2026-09-27T23:00:00Z", "timezone": "Europe/London"},
  "reporting_currency": "GBP",
  "basis": "purchase",
  "formula_version": "finance-v1",
  "coverage": {"status": "partial", "missing": ["processor_fees", "sales_tax"]},
  "metrics": {
    "gross_customer_sales": {"amount": "100.00", "currency": "GBP", "quality": "actual"},
    "refunded_principal": {"amount": "10.00", "currency": "GBP", "quality": "actual"},
    "net_proceeds": {"amount": null, "currency": "GBP", "quality": "unavailable", "reason": "missing_fee_and_tax_components"},
    "net_profit": {"amount": null, "currency": "GBP", "quality": "unavailable", "reason": "incomplete_costs_and_taxes"}
  },
  "warnings": ["Synthetic example; source coverage is incomplete"]
}
```

Every summary metric also supplies a dataset/filter drill-through reference in the final schema. Summaries are **non-posting observations**. The central journal imports record-level facts only; importing a source summary never books additional revenue.

## Canonical finance record fields

Required: record_id, revision, change_sequence, record_type, project_id, source_system, source_account_id, environment, external_object_id, economic_transaction_id, occurred_at, updated_at, status, original_amount (decimal/currency), quality and formula_version. Optional according to type: parent_record_id, subscription_id, product_id, channel, store, processor, settled_at, service_period, expense_category, vendor_reference, financial_account_id, destination_account_id, tax/fee components, document references, acquisition attribution, GBP valuation with rate/policy.

Types: sale, refund, refund_reversal, chargeback, fee, expense, direct_cost, settlement, transfer, opening_balance. A detailed sale may contain fee components: if separately exported fee records represent the same fees, link them with a stable component ID so the consumer posts them once. VAT recoverability remains explicit, not inferred from tax amount.

Original gross/refund and legacy SMS net amounts remain separate fields/records. Unknown raw gross is flagged reconstructed; do not treat SMS legacy net refund as gross refunded principal. Source financial identity excludes transport identity: provider webhook and source invoice for one sale share one economic transaction mapping.

GBP policy: source admin and Simnetiq use a common versioned FX dataset/policy. Central receives original amounts and any source conversion evidence. If central converts under another policy, store a separate central valuation and expose conversion differences; do not replace source amounts or expect same totals. Matching source/admin/API tests use original currency first.

## Analytics reports and provider setup

| Provider/report | Returned fields | Import method and limits |
|---|---|---|
| GA4 overview/daily | date, activeUsers, newUsers, sessions, screenPageViews, property timezone | Data API runReport, read access to numeric GA4 property; enabled API and authorized server identity |
| GA4 breakdowns | explicit dimensions such as pagePath, sessionDefaultChannelGroup, country; metric list | Request compatible dimensions, page results; preserve quota/threshold/sampling/other-row metadata when present |
| GA4 period unique users | activeUsers for entire requested interval | Separate provider query, never sum daily/country/page distinct-user counts |
| GSC daily totals | date, clicks, impressions, ctr, position, search type, aggregation type | Search Analytics query; preserve Pacific source days, final/partial state and retrieval date |
| GSC pages/queries | page/query/country/device dimensions and same metrics | Top-row limitations; detailed query rows are not complete property totals. Query property totals separately |
| Vercel events → daily | pageviews/custom-event counts and supported visitor/session identity semantics | Web Analytics Drain to project HTTPS collector; verify plan/cost, auth, retry/delivery and sampling contract |

GA proposed cadence: daily plus optional few-hour refresh, requery previous 7 days for revisions. GSC: daily, requery previous 14 days; label provisional vs final rather than assuming a universal delay. Vercel: streaming drain with hourly/day aggregation; no promised historical replay. Final cadence depends on quota and cost. Export actual covered-through dates, not scheduler run time as evidence of freshness.

GSC CTR = clicks/impressions; aggregate position requires matching aggregation semantics, not arithmetic averaging. Query/page dimensions may overlap or omit data. Google query rows are not user-level acquisition links. GA activeUsers and Vercel visitors are different definitions: choose a primary headline, never sum them. GA analytics revenue is an attribution/check signal, not the financial ledger. Financial revenue and GA purchase events must not be booked twice.

Vercel drain events do not guarantee a stable unique event ID in every payload. Validate actual delivery semantics and preserve batch/retry metadata; do not deduplicate on path+timestamp alone and lose legitimate identical events. If exact reconstruction or unsampled distinct visitors cannot be guaranteed, export the limitations and keep corresponding verified metrics unavailable. Provider totals vs warehouse comparison may differ; record reasons.

## Machine security and reliability

Proposed request auth: per-project scoped rotating key id with HMAC-SHA256 over a canonical UTF-8 string containing method, raw path+query, timestamp, nonce and SHA256(body), newline-separated. Document encoding with test vectors before implementation. Headers X-BOS-Key-Id, X-BOS-Timestamp, X-BOS-Nonce, X-BOS-Signature. Verify freshness (proposed 5 minutes), constant-time signature, nonce replay protection and project binding. GET still signs empty body. Credentials stored only server-side; no human Supabase token or service-role key passed to Simnetiq. HMAC does not replace TLS.

Source exports receive a narrowly scoped machine-read identity; do not weaken human SMS MFA requirements. No customer email, device secrets, SMS content or phone numbers in reporting exports. Configurable request limits/timeouts and range guards; cache private responses per exact query/snapshot. Revoke a key without affecting product checkout.

Simnetiq validates schema and source/project binding, stages pages and commits facts/cursor atomically. On timeout it retries; source stays available even if central is offline. Keep previous valid snapshots visible with stale status. Corrections update observation revisions; posted central ledger changes use reversal/replacement. Partial sources remain individually labelled. Failed import never advances the cursor.

## Acceptance gates and delivery to central integrator

Provide: deployed base URL, capabilities response, OpenAPI 3.1/JSON Schemas generated from actual implementation, redacted native-currency fixtures, mapping of economic transaction IDs, machine credential through secret manager, earliest reliable dates, formula/FX versions, rate limits, health response and reconciliation report.

Tests: same source UI/API totals at fixed cutoff; SMS frozen legacy USD parity; source/central native-currency parity; GBP policy parity; missing fee/FX gives incomplete report; duplicate/correction/backfill doesn't duplicate revenue; concurrent pages freeze high watermark; revoked/replayed/wrong-project credentials fail; GA period uniques not summed; GSC partial rows not mistaken for full totals; Vercel unavailable/sampled data labelled; Simnetiq downtime doesn't affect payments.

Official references checked 2026-09-28: [GA4 reporting](https://developers.google.com/analytics/devguides/reporting/data/v1/basics), [Search Console](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [Vercel Drains](https://vercel.com/docs/drains), [Analytics Drain schema](https://vercel.com/docs/drains/reference/analytics). All routes/field envelopes above are proposed internal contracts, not provider endpoints.
