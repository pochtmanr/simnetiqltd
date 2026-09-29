# Business OS reporting contract v1

Version `1.0.0`. Identifier `business-os.contract.v1`. Frozen 2026-09-28.

This directory is the executable contract for the read-only project reporting API. It is not a deployed service. Doppler and SMS Code implement it. Simnetiq consumes it. Schemas and the conformance runner win over narrative docs when they disagree.

## Project ids

| `project_id` | Product name | Source repository |
|---|---|---|
| `doppler` | Doppler | `/Volumes/RomanSSD/Developer/doppler` |
| `smscode` | SMS Code | `/Volumes/RomanSSD/Developer/smsapp` |

`smscode` is the frozen slug. Do not send `sms-code` or `sms_code`.

## How another project consumes this version

Do not publish an npm package. Pin a git commit of `simnetiq.store` and copy or sparse-checkout `contracts/business-os/v1`. Verify `manifest.json`: every listed path must match its SHA-256, and no extra file may appear. Record `contract_version`, the git commit, and the manifest file hashes in the source handoff (D1, S1, and later steps). A later contract change is a new version in this directory, not a silent edit of `1.0.0`.

Run the corpus from this repo:

```bash
npm run test:business-os-contract
```

## Money

Amounts are decimal strings in major units. There is no floating-point finance and no leading sign. Direction is `economic_direction`, not a negative amount.

| `record_type` | Direction | Counts as new revenue |
|---|---|---|
| `sale` | `inflow` | yes |
| `refund`, `chargeback` | `outflow` | no, and `parent_record_id` is required |
| `refund_reversal` | `inflow` | no, and `parent_record_id` is required |
| `fee` | `inflow` or `outflow` | no; `component_id` and `posting_role` are required |
| `expense` | `outflow` | no; `expense_category` is required |
| `direct_cost` | `outflow` | no |
| `settlement` | `inflow` or `outflow` | no |
| `transfer` | `transfer` | no; both account ids are required |
| `opening_balance` | `inflow` or `outflow` | no |

Fiat uses ISO currency. Crypto uses `asset` and `network` and must not use `currency`. Scale cannot exceed `currency-exponents.json`. Unknown fiat currencies fail closed.

`quality` is `actual`, `estimated`, `legacy_derived`, or `unavailable`. `coverage` is separately `complete`, `partial`, or `missing`. Unavailable amounts are JSON `null` plus `reason`. A measured zero is the string `0` or `0.00` with quality `actual`. Zero is never a stand-in for unknown tax, fees, FX, or MRR.

SMS legacy net refunds use `legacy_net_amount` and `legacy_formula_version` `sms-legacy-usd-v1`. `counts_as_gross_refunded_principal` is false. That net figure is not gross refunded principal.

Fee components and separate fee records that share a `component_id` have exactly one `posting_role` of `primary`. Aliases must carry the same currency and amount. Webhook and invoice ids for one sale are `alias_ids` on one record, not two sales. The same `record_id` and `revision` with a different `content_hash` is rejected.

`content_hash` is lowercase SHA-256 of the record's canonical JSON with `content_hash` removed. Canonical JSON sorts object keys, keeps array order, and has no whitespace. See `canonical.mjs`.

`source_gbp_valuation` is the source project's evidence. Missing FX leaves amount and rate null under policy `gbp-unconfigured`. Central conversion, when it exists later, is a separate valuation and does not replace this object.

Summaries set `posting` to false. The central journal posts records, not summary payloads.

## Intervals, days, and balances

`from` is inclusive and `to` is exclusive. Both are UTC instants with a `Z` suffix and whole seconds. A summary request may cover at most 366 days. A page may contain at most 500 records. Capabilities may advertise lower limits.

Finance daily buckets use the requested IANA timezone. A bucket is `partial` when the request or the source coverage does not contain the whole local day. Partial buckets are not complete day totals. `balances_included` is false: cash, prepaid, frozen, and clearing stocks are not in daily finance payloads and must not be summed across days. Read them from `GET /finance/balances`, where every snapshot has `additive: false`.

Operations flows are additive. Stocks such as `coins_outstanding` and `paid_access_accounts` are not. SMS Code does not emit Doppler subscription stocks. Doppler does not emit coin or SMS flow names.

## Cursor and cutoff

`GET /finance/records` without `cursor` is the bootstrap. The response freezes `snapshot_id`, `high_watermark`, and `query_binding_sha256`. Later pages for that cursor return only revisions with `change_sequence` less than or equal to the watermark. Records that arrive later wait for the next sync.

The wire cursor is unpadded base64url of the UTF-8 JSON payload in `schemas/responses.json` `#/$defs/cursorPayload`. Clients treat it as opaque. It binds project, environment, endpoint, query hash, snapshot, watermark, and expiry. Sending it with a different query is `422 cursor_query_mismatch`. An expired cursor or snapshot is `410` with `resync.drop_cursor` true. The client then bootstraps again. A failed page does not advance the stored checkpoint. When `has_more` is false, `next_sync_checkpoint` is the cursor for the next sync and `next_cursor` is null.

Overview, summaries, and records are comparable only when `snapshot_id` and `data_as_of` match. Pass `snapshot_id` to pin another endpoint to that cutoff.

Corrections keep `record_id`, increment `revision` by 1, set `supersedes_revision`, and allocate a new `change_sequence`. A void is a later revision with `status` `void`. Consumers replace the prior revision. They do not post it as new revenue.

## Analytics

Report ids are `ga4_overview_daily`, `ga4_breakdown`, `ga4_period_unique_users`, `gsc_daily_totals`, `gsc_dimension_rows`, and `vercel_daily`. An unknown id is `422 unsupported_dataset`. A known report the project does not run returns `200` with `availability` `unsupported` or `unavailable`, `rows` empty, and a reason. It does not return zeros.

`ga4_period_unique_users` contains at most one row and `must_not_sum_daily_uniques` true. GSC dimension pages set `complete_property_total` false. GSC `source_timezone` is `America/Los_Angeles`. Those civil dates are not rebuckeled to Europe/London. CTR is a ratio string from 0 to 1. Average position is a positive decimal and is not a ratio.

## HTTP and authentication

Eleven GET routes live under `/api/business-os/v1`. See `openapi.json`. Successful responses send `Cache-Control: private, no-store`.

| Status | When |
|---|---|
| 400 | Missing or malformed parameters, or a non-empty GET body |
| 403 | Bad signature, clock skew, replayed nonce, revoked key, or project/environment mismatch |
| 410 | Cursor or snapshot expired |
| 422 | Unsupported basis or dataset, inverted or oversized interval, cursor/query mismatch |
| 429 | Rate limit, with `Retry-After` delay-seconds |
| 503 | Temporary failure; `Retry-After` is optional |

Signing rules are in [hmac.md](hmac.md). Test vectors are in `hmac/vectors.json`. The test secret there is not a credential.

## Configuration gates

`configuration-gates.json` freezes input names. `confirmed_value` stays null. Europe/London and GBP are proposals, not confirmed policy. No VAT rate is proposed. Formula text for SMS legacy SQL stays in the SMS repository; this contract only reserves `sms-legacy-usd-v1`.

## Real fixtures

Synthetic files in `fixtures/` are conformance evidence only. The procedure for redacted production fixtures is [fixtures/REDACTION.md](fixtures/REDACTION.md).
