# M4 handoff — shadow reconciliation and consolidated reporting

Step ID: **M4**. Project: `simnetiq.store`. Date: 2026-09-29.

## Status

| Stage | State |
|---|---|
| Implemented in this repository | Yes. Journal read models, shadow comparison, dataset gates, member report routes |
| Locally tested | Yes. Commands and results below |
| Staging verified | No. No Business OS database has been migrated, and Doppler D4 / SMS S3 are not in this workspace |
| Production verified | No |

C0 contract version is unchanged. M1, M2, and M3 migrations were not edited. M5 was not started.

## Versions

| Item | Version |
|---|---|
| Contract / schema | Unchanged: `1.0.0` / `business-os.contract.v1` |
| Database migration | `supabase/business-os/migrations/20260929210000_reconciliation.sql` |
| Formula / FX | Unchanged. SMS legacy stays `sms-legacy-usd-v1` and is not recomputed. Central GBP still uses M2 `resolve_gbp` |

## Where to apply migrations

Apply these only to a **new, empty, dedicated Business OS** Supabase project, in this order:

1. `supabase/business-os/migrations/20260929120000_identity_foundation.sql`
2. `supabase/business-os/migrations/20260929150000_finance_core.sql`
3. `supabase/business-os/migrations/20260929180000_project_pulls.sql`
4. `supabase/business-os/migrations/20260929210000_reconciliation.sql`

None of these have been applied remotely. Do not apply them to either project in the linked Supabase organization:

| Project id | Name | Why it is the wrong target |
|---|---|---|
| `eujmomonscnlmwcbkbfy` | simnetiq.store | Public schema is a visa/agency product (`visa_applications`, `agencies`, …). `marketing_contacts` is absent, so the migration guard would not stop a mistaken apply |
| `fzlrhmjdjjzcgstaeblu` | Doppler VPN | Product database, not Business OS |

There is no Business OS database id yet. The marketing database that holds `marketing_contacts` is also the wrong target.

## What was implemented

- Source observations now keep `source_system`, `channel`, `store`, and `processor`. Sale components are stored on `observation_components`. Alias rows with the same `component_id` do not add a second primary fee. The pull mapper passes those fields through. Account mapping is unchanged.
- `financial_report` builds custom, London month, and London year windows from primary observations. Native currency is summed before GBP. Missing tax, fees, direct costs, and FX stay null with a reason. Estimated fees keep their amount and do not become proceeds or profit. Net profit stays null until other income, financing, and profit tax exist, so a window with any observation is coverage `partial`.
- A company report uses one basis. Projects with no rows for that basis are listed and are not filled with zero. SMS legacy rows stay out of purchase gross. A project with `reporting_enabled = false` is still included in the shadow sum and listed as `reporting_disabled`, so the company total is partial rather than labelled complete.
- Shared overhead is reported before allocation, as the project slice, and after that one slice. The company remainder is `unallocated`. Top-ups, transfers, opening balances, and settlements are cash movements, not gross. Unmatched settlements are residuals. Balance snapshots stay non-additive.
- The SMS bridge copies frozen USD gross, Apple fee, refunds, and `cash_net` from the current `finance/reconciliation` snapshot when the cutoff and `sms-legacy-usd-v1` match. It does not recompute them. `cash_net` is flagged as proceeds, not bank cash. `real_spend` stays null with `missing_balance_evidence` unless start and end prepaid/frozen snapshots and a top-up all exist, and even then the amount stays null with `source_formula_not_recomputed`.
- `compare_shadow` compares the current `finance/summary` native subtotals with the journal report. Equal native amounts, including equal nulls, are `match`. A different native amount is `mismatch`. A missing snapshot is `incomplete`. GBP is compared only when the policies match; a policy difference is a residual and does not change the native status. A missing source-admin total is residual `source_admin_not_provided` and does not by itself turn a native match into a mismatch.
- `activate_dataset_gate` rejects `synthetic` and `redacted_real` evidence. It also rejects a live run that is not a native match or that still lacks the export snapshot or the source-admin side. Verifying all finance dataset gates for one project sets `projects.state` and `integration_verified_at`. `reporting_enabled` stays false. The HTTP run route refuses `evidenceKind: "live"` because this environment has no live source.
- Member reads: `GET /api/business-os/finance/reports`, `GET /api/business-os/finance/reports/drill`, `GET /api/business-os/finance/reconciliation`, and `GET /api/business-os/finance/gates`. Writer routes, with the existing CSRF and step-up checks: `POST /api/business-os/finance/reconciliation/run` and `POST /api/business-os/finance/gates/activate`. There is no new dashboard page.

## Commands and results

```bash
npm run test:business-os-finance
```

```text
29 passed, 0 failed
```

Covers component storage, native gross and refunds, null tax and fees, a complete stack with null net profit, estimated fees that are not doubled, top-up and settlement exclusion, void replacement, before/after allocation, company exclusion of SMS legacy, frozen SMS USD fields, matching and differing GBP policies, partial London buckets, interval and mixed-basis rejection, synthetic match that stays unverified, a one-penny mismatch, and read-only report access.

```bash
npm run test:business-os-sync
```

```text
15 passed, 0 failed
```

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

Evidence is synthetic, from PGlite, and from the frozen fixtures. It is not a hosted Supabase run and not a call to a deployed Doppler or SMS export. No file was added under `contracts/business-os/v1/fixtures/redacted-real/`.

## Changed files

- `supabase/business-os/migrations/20260929210000_reconciliation.sql`
- `lib/business-os/sync/map.ts` — dimensions and components passed through
- `lib/business-os/finance/reconcile.ts` — report query parsing and live-evidence refusal
- `lib/business-os/finance/rpc-status.ts` — 422 for basis, interval, and grain errors
- `app/api/business-os/finance/reports/route.ts`
- `app/api/business-os/finance/reports/drill/route.ts`
- `app/api/business-os/finance/reconciliation/route.ts`
- `app/api/business-os/finance/reconciliation/run/route.ts`
- `app/api/business-os/finance/gates/route.ts`
- `app/api/business-os/finance/gates/activate/route.ts`
- `tests/business-os/finance/reconciliation.test.ts`
- `tests/business-os/finance/domain.test.ts`
- `tests/business-os/sync/ingest.test.ts` — applies the new migration after pulls
- `docs/business-os-handoffs/M4-reconciliation-and-consolidation.md` — this handoff

## Evidence and residuals

No remote migration was applied. No redacted comparison file was saved. Doppler D4 and SMS S3 handoffs are not in this repository, so base URLs, key ids, and export credentials were not invented. Source-admin totals are therefore an open residual on every local run. Native parity against a frozen snapshot can match in PGlite, and that match does not verify a dataset.

Report coverage stays `partial` while net profit is null. That is the current state of every tested window, because other income, financing, and profit tax are not posted.

## Configuration names still needed

No values are stored. Names still required before a real pull or a live gate:

`BUSINESS_OS_SUPABASE_URL`, `BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY`, `BUSINESS_OS_SUPABASE_SECRET_KEY`, `BUSINESS_OS_JOB_SECRET`, and `CRON_SECRET` set to the same value as `BUSINESS_OS_JOB_SECRET`.

Each connection stores a secret reference name, not the secret. Expected names once the sources exist: `BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION` and `BUSINESS_OS_SOURCE_SMSCODE_PRODUCTION`. Also required, with no values recorded here: deployed Doppler and SMS HTTPS base URLs, key ids, and the D4/S3 handoffs.

Unconfirmed reporting gates, still with no values: `REPORTING_TIMEZONE`, `REPORTING_CURRENCY`, `RECOGNITION_BASIS_POLICY`, `FX_POLICY_VERSION`, `FX_RATE_SOURCE`, `FX_RATE_EFFECTIVE_TIME_RULE`, `FX_DATASET_ID`, `VAT_STATUS`, `VAT_RATES`, `FISCAL_YEAR_START`, `SHARED_EXPENSE_ALLOCATION_POLICY`, `DOPPLER_HISTORY_START`, `DOPPLER_OPENING_BALANCE_AS_OF`, `DOPPLER_FORMULA_PIN`, `SMS_HISTORY_START`, `SMS_OPENING_BALANCE_AS_OF`, `SMS_LEGACY_FORMULA_PIN`.

Expose the `business_os` schema to the Business OS Data API the same way M1 already requires. Do not point that project at the marketing database.

## Deployment

No API host was deployed for this step. There is no staging or production source base URL. Private routes stay in this Next.js app and do not run against a Business OS database until that database and the owner session exist.

## Next dependent step

M5 in this repository: `docs/business-os-project-prompts/34-simnetiq-dashboard-and-telegram.md`. The report routes above are the service that dashboard should render. Real verified reporting still needs the Doppler and SMS export handoffs.

## Completion

M4 is implemented and locally tested. It is not staging verified and not production verified. Central reports sum posted records in native currency, compare them with imported snapshots, and leave every dataset unverified until live evidence passes.
