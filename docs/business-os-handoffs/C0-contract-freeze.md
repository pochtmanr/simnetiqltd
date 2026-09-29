# C0 handoff — freeze the shared reporting contract

Step ID: **C0**. Project: `simnetiq.store`. Date: 2026-09-28.

## Status

| Stage | State |
|---|---|
| Implemented in this repository | Yes. Version `1.0.0`, identifier `business-os.contract.v1` |
| Locally tested | Yes. Command and result below |
| Staging verified | No deployed source API |
| Production verified | No |

D1 and S1 were not started.

## Artifact to hand to D1 and S1

| Field | Value |
|---|---|
| Path | `/Volumes/RomanSSD/Developer/simnetiq.store/contracts/business-os/v1` |
| `contract_version` | `business-os.contract.v1` |
| `schema_version` | `1.0.0` |
| OpenAPI | `contracts/business-os/v1/openapi.json` (`3.1.0`) |
| Manifest SHA-256 | `79b35239d3709bfd80ab07d46fc41199c3e0869d3d34b2eac9427d93cc9ff94d` |
| Git commit | Not pinned. These files are local and uncommitted. Pin the commit after they are committed, then copy or sparse-checkout the directory. Do not publish an npm package. |

Project ids: `doppler` (product name Doppler) and `smscode` (product name SMS Code).

## Versions

| Item | Version |
|---|---|
| Contract / schema | `1.0.0` / `business-os.contract.v1` |
| Database migration | None |
| Doppler formula | Reserved identifier `unconfigured` |
| SMS legacy formula identifier | `sms-legacy-usd-v1` (identifier only; SQL stays in the SMS repository) |
| FX policy | `gbp-unconfigured` |

## What was frozen

- JSON Schemas and OpenAPI 3.1 for eleven `GET` routes under `/api/business-os/v1`.
- Decimal strings, fiat versus crypto, null reasons, separate quality and coverage, provenance, economic identity, revision/void behavior, and fee-component deduplication.
- Cursor bootstrap, frozen high watermark, continuation, next-sync checkpoint, expiry (`410`), and same-snapshot cutoff.
- HMAC-SHA256 test vectors with byte-for-byte canonical strings. Empty GET body hash is SHA-256 of zero bytes. Signature is lowercase hex.
- Synthetic fixtures for sale/refund/reversal, alias ids, fee alias, void, SMS legacy net, missing FX/tax, partial days, non-additive balances, analytics grain, and rejected malformed cases.
- Configuration gate names with `confirmed_value` null. Europe/London and GBP stay proposals.

## Command and result

```bash
npm run test:business-os-contract
```

```text
contract conformance: 51 cases, 4 HMAC vectors, manifest ok
```

An independent HMAC-SHA256 of the `get-health-empty-body` canonical string matched `8dc751a41ba6d4cd5bdf4cb05713f13bf1828714e53f02b3996c99f5533b5aab`.

## Changed files

- `contracts/business-os/v1/` — schemas, OpenAPI, fixtures, HMAC vectors, gates, manifest, runner
- `package.json`, `package-lock.json` — dev dependencies `ajv` and `ajv-formats`; script `test:business-os-contract`
- `.gitignore` — ignores `contracts/business-os/v1/fixtures/redacted-real/`
- `docs/BUSINESS_OS_PROJECT_API_CONTRACT.md` — pointer to the frozen directory
- `docs/business-os-handoffs/C0-contract-freeze.md` — this handoff

## Evidence and residuals

Tracked fixtures are synthetic. They are conformance evidence. They are not production totals.

Real exports, when they exist, follow `contracts/business-os/v1/fixtures/REDACTION.md` and stay in the gitignored `fixtures/redacted-real/` directory until reviewed.

## Configuration names still needed

No values are stored. Names still unconfirmed:

`REPORTING_TIMEZONE`, `REPORTING_CURRENCY`, `RECOGNITION_BASIS_POLICY`, `FX_POLICY_VERSION`, `FX_RATE_SOURCE`, `FX_RATE_EFFECTIVE_TIME_RULE`, `FX_DATASET_ID`, `VAT_STATUS`, `VAT_RATES`, `FISCAL_YEAR_START`, `SHARED_EXPENSE_ALLOCATION_POLICY`, `DOPPLER_HISTORY_START`, `DOPPLER_OPENING_BALANCE_AS_OF`, `DOPPLER_FORMULA_PIN`, `SMS_HISTORY_START`, `SMS_OPENING_BALANCE_AS_OF`, `SMS_LEGACY_FORMULA_PIN`.

## Next dependent steps

D1 in `/Volumes/RomanSSD/Developer/doppler` (`docs/business-os-project-prompts/10-doppler-reporting-foundation.md`).

S1 in `/Volumes/RomanSSD/Developer/smsapp` (`docs/business-os-project-prompts/20-sms-legacy-reporting-foundation.md`).

Both need this directory. M1 can start from the same contract; source integration waits for D4 and S3.

## Completion

C0 is locally tested and not deployed. The shared contract is frozen at `contracts/business-os/v1` version `1.0.0`.
