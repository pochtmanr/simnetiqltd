# M2 handoff — central journal, FX and shared expense ownership

Step ID: **M2**. Project: `simnetiq.store`. Date: 2026-09-29.

## Status

| Stage | State |
|---|---|
| Implemented in this repository | Yes. Journal, FX rows, shared expenses, and finance routes |
| Locally tested | Yes. Commands and results below |
| Staging verified | No. No Business OS database has been migrated remotely |
| Production verified | No |

C0 contract version is unchanged. M1 identity migration `20260929120000` was not edited. M3 was not started.

## Versions

| Item | Version |
|---|---|
| Contract / schema | Unchanged: `1.0.0` / `business-os.contract.v1` |
| Database migration | `supabase/business-os/migrations/20260929150000_finance_core.sql` |
| FX policy | `gbp-unconfigured` until a dataset row is registered. GBP amounts post at rate `1` under that same identifier |
| SMS legacy formula | `sms-legacy-usd-v1` stored on observations only. It does not post revenue |

Doppler and SMS Code remain the M1 seeded projects. Organization timezone `Europe/London` is still the stored C0 proposal, not a confirmed gate.

## What was implemented

- Exact decimal checks in Postgres and TypeScript. Fiat scale follows `contracts/business-os/v1/currency-exponents.json`. Crypto scale is 18. JSON numbers are rejected. Missing amounts stay null with a reason. There is no JavaScript `Number` arithmetic on money.
- Revisioned `source_observations` with a unique posting origin. Alias rows and `summary` rows do not post. A fee `component_id` posts once for `posting_role = primary`. A second primary sale with the same economic transaction id is rejected. `sms_legacy` observations keep their USD amounts and never create a revenue line.
- Immutable journal lines. Posting is one transaction and must balance in GBP. A missing FX rate stores the original amount and a `pending_valuation` entry with null GBP. It does not insert a zero. Corrections and voids append a reversal and, when replaced, a new revision. Posted lines are not deleted.
- Simnetiq drafts for manual income and company expenses: due, paid, and service dates, vendor, category, tax inclusion, recoverability, payment account, and receipt path plus checksum. Unpaid expenses credit `payable` and do not move the bank. Imported `source_owner = project` expenses reject updates.
- Shared allocations have stable ids. The unallocated remainder is explicit. Allocation does not create another expense or another operating-expense line. Project profit is reported before allocation, as the allocation, and after allocation.
- Movements for supplier top-up, consumption, payout, own-wallet transfer, and opening balance. None of those set `counts_as_new_revenue`. Balance snapshots are stored with `additive = false`. Settlement fees may be null.
- Versioned FX datasets and rates. Source GBP and central GBP are stored separately, with the conversion difference exposed. Period locks block posting for the organization timezone date. Reopen keeps the report snapshot and requires a reason. CSV cells that start with `=`, `+`, `-`, `@`, or a tab are prefixed, and every export row carries currency, basis, and coverage.
- Routes under `/api/business-os/finance/` reuse the M1 session, CSRF, and step-up checks. Owner and admin may write. `read_only` receives 403. There is no new page UI.

`payable` and `receivable` accounts were added so an unpaid bill or unpaid manual income can balance without moving cash. Non-GBP allocations do not get an invented GBP conversion; that report's profit after allocation is null.

## Commands and results

```bash
npm run test:business-os-finance
```

```text
15 passed, 0 failed
```

Covers balanced posting, duplicate aliases and fee components, unique origin rejection, void and replacement, top-up plus consumption, payout plus a non-additive bank snapshot, own-wallet transfer, exact allocation and one company cost, JPY/KWD/crypto scale, missing FX, source-versus-central conversion, zero and negative margin denominators, Europe/London DST locking, summary and SMS legacy non-posting, audited reopen, and CSV escaping.

```bash
npm run test:business-os-identity
```

```text
14 passed, 0 failed
```

```bash
npm run test:business-os-contract
```

```text
contract conformance: 51 cases, 4 HMAC vectors, manifest ok
```

Evidence is synthetic and from in-process Postgres. It is not a hosted Supabase run and not a second concurrent database session. The unique indexes are what reject a repeated origin, fee component, or economic sale.

## Changed files

- `supabase/business-os/migrations/20260929150000_finance_core.sql`
- `lib/business-os/finance/` — decimal checks, allocation, reporting nulls, CSV, London dates, route guards
- `lib/business-os/auth/authorize.ts`, `http.ts`, `rate-limit.ts` — finance writer check, RPC status mapping, `finance` rate bucket
- `app/api/business-os/finance/` — draft, draft update, post, reverse, allocate, lock, reopen, CSV
- `tests/business-os/finance/`
- `package.json` — `test:business-os-finance`
- `docs/business-os-handoffs/M2-finance-core.md` — this handoff

## Evidence and residuals

No remote migration was applied. Marketing Supabase configuration was not changed. C0 gates still have `confirmed_value` null, including FX source, VAT, fiscal year, and allocation policy.

Receipts store an object path and checksum only. There is no upload screen and no persisted signed URL. Cross-system editing of source expenses remains deferred. Source connectors are M3. Dashboard pages are M5.

The write rate limit is still in-memory and per server instance.

## Configuration names still needed

No values are stored. Names still unconfirmed:

`REPORTING_TIMEZONE`, `REPORTING_CURRENCY`, `RECOGNITION_BASIS_POLICY`, `FX_POLICY_VERSION`, `FX_RATE_SOURCE`, `FX_RATE_EFFECTIVE_TIME_RULE`, `FX_DATASET_ID`, `VAT_STATUS`, `VAT_RATES`, `FISCAL_YEAR_START`, `SHARED_EXPENSE_ALLOCATION_POLICY`, `DOPPLER_HISTORY_START`, `DOPPLER_OPENING_BALANCE_AS_OF`, `DOPPLER_FORMULA_PIN`, `SMS_HISTORY_START`, `SMS_OPENING_BALANCE_AS_OF`, `SMS_LEGACY_FORMULA_PIN`.

Live finance routes also need the M1 Business OS database settings: `BUSINESS_OS_SUPABASE_URL`, `BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY`, `BUSINESS_OS_SUPABASE_SECRET_KEY`, and the owner identity names from the M1 handoff. Do not point this migration at the marketing database.

No FX vendor was selected.

## Deployment

No API host was deployed. There is no staging or production base URL. Private routes stay in this Next.js app.

## Next dependent step

M3 in this repository: `docs/business-os-project-prompts/32-simnetiq-project-pull-connectors.md`. Actual source pulls still need the Doppler and SMS export handoffs.

## Completion

M2 is implemented and locally tested. It is not staging verified and not production verified. The journal posts balanced GBP entries, keeps missing FX as pending valuation, and records one shared expense as one company cost.
