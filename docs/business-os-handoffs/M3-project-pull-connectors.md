# M3 handoff — scheduled project pulls and revision-safe ingestion

Step ID: **M3**. Project: `simnetiq.store`. Date: 2026-09-29.

## Status

| Stage | State |
|---|---|
| Implemented in this repository | Yes. HMAC pull client, leases, page commit, non-posting snapshots, tick route |
| Locally tested | Yes. Commands and results below |
| Staging verified | No. No Business OS database has been migrated, and Doppler D4 / SMS S3 are not in this workspace |
| Production verified | No |

C0 contract version is unchanged. M1 and M2 migrations were not edited. M4 was not started.

## Versions

| Item | Version |
|---|---|
| Contract / schema | Unchanged: `1.0.0` / `business-os.contract.v1` |
| Database migration | `supabase/business-os/migrations/20260929180000_project_pulls.sql` |
| Formula / FX | Unchanged. Source formula versions are stored from capabilities. Central GBP still uses M2 `resolve_gbp` |

## Where to apply migrations

Apply these only to a **new, empty, dedicated Business OS** Supabase project, in this order:

1. `supabase/business-os/migrations/20260929120000_identity_foundation.sql`
2. `supabase/business-os/migrations/20260929150000_finance_core.sql`
3. `supabase/business-os/migrations/20260929180000_project_pulls.sql`

None of these have been applied remotely. Do not apply them to either project in the linked Supabase organization:

| Project id | Name | Why it is the wrong target |
|---|---|---|
| `eujmomonscnlmwcbkbfy` | simnetiq.store | Public schema is a visa/agency product (`visa_applications`, `agencies`, …). `marketing_contacts` is absent, so the migration guard would not stop a mistaken apply |
| `fzlrhmjdjjzcgstaeblu` | Doppler VPN | Product database, not Business OS |

There is no Business OS database id yet. The marketing database that holds `marketing_contacts` is also the wrong target.

## What was implemented

- Owner registration of an HTTPS source URL, key id, and secret reference bound to one project and environment. The payload cannot choose a different project or environment. Capabilities must validate as `business-os.contract.v1` before datasets are enabled. Disabled analytics flags are not pulled.
- HMAC GET client using `contracts/business-os/v1/hmac-sign.mjs`. Every attempt, including timeout and retry, uses a new nonce and timestamp. `Retry-After` above two seconds is stored instead of slept. Redirects are not followed.
- One worker lease per connection (`FOR UPDATE SKIP LOCKED`). A tick pulls one page. Facts, reversals, and the cursor commit in one function. A raised error rolls the page back and leaves the cursor. Equal content hashes replay. A changed hash or a project/environment mismatch is quarantined and does not advance the cursor.
- Void revisions reverse the superseded posting and store the new revision as void. `sms_legacy` does not post revenue. Alias rows do not post.
- Overview, finance summary/daily/balances/reconciliation, subscriptions, operations, and analytics are stored as non-posting snapshots. An outage marks the last current snapshot `stale` and does not delete it. Analytics pages do not create journal lines.
- `410` drops the cursor, keeps the original from/to, and the next pull dedups overlap by content hash.
- `GET` and `POST /api/business-os/sync/tick` require `BUSINESS_OS_JOB_SECRET`. Vercel cron calls that path every five minutes. Members can read runs, quarantine, and health. They cannot write those tables.

## Commands and results

```bash
npm run test:business-os-sync
```

```text
15 passed, 0 failed
```

Covers the frozen HMAC vectors, fresh nonces, Retry-After, 503, timeout, two workers, lease resume, transactional failure before cursor commit, duplicate replay, void revision, hash conflict, wrong project, 410 resync, stale snapshot, analytics non-posting, and read-only denial.

```bash
npm run test:business-os-finance
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

Evidence is synthetic, from PGlite, and from the frozen fixtures. It is not a hosted Supabase run and not a call to a deployed Doppler or SMS export. Request paths in the client test stay under `/api/business-os/v1/`. That is the local proof that a failed central tick does not call a source payment route. It is not a live payment-isolation test.

## Changed files

- `supabase/business-os/migrations/20260929180000_project_pulls.sql`
- `lib/business-os/sync/` — signing, pull, schema checks, record mapping, worker, secret-client store
- `app/api/business-os/sync/` — tick, connection registration, capability enablement, runs, quarantine, health
- `lib/business-os/auth/http.ts`, `rate-limit.ts` — sync error mapping and write limit
- `tests/business-os/sync/`
- `package.json` — `test:business-os-sync`
- `vercel.json` — five-minute cron
- `.env.example`
- `docs/business-os-handoffs/M3-project-pull-connectors.md` — this handoff

## Evidence and residuals

No remote migration was applied. No staging export was called. Doppler D4 and SMS S3 handoffs are not in this repository, so base URLs, key ids, and export credentials were not invented. D5 and S4 are still required before configured analytics can be enabled from a real source. The tick route was not exercised in a browser; there is no Business OS database and no job secret configured in this environment.

## Configuration names still needed

No values are stored. Names still required before a real pull:

`BUSINESS_OS_SUPABASE_URL`, `BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY`, `BUSINESS_OS_SUPABASE_SECRET_KEY`, `BUSINESS_OS_JOB_SECRET`, and `CRON_SECRET` set to the same value as `BUSINESS_OS_JOB_SECRET`.

Each connection stores a secret reference name, not the secret. Expected names once the sources exist: `BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION` and `BUSINESS_OS_SOURCE_SMSCODE_PRODUCTION`. Also required, with no values recorded here: deployed Doppler and SMS HTTPS base URLs, key ids, rate limits, and the D4/S3 handoffs. Analytics datasets stay off until D5/S4 say those capability flags are true.

Expose the `business_os` schema to the Business OS Data API the same way M1 already requires. Do not point that project at the marketing database.

## Deployment

No API host was deployed for this step. There is no staging or production source base URL. The cron entry is in this Next.js app and does not run until the job secret and a Business OS database exist.

## Next dependent step

M4 in this repository: `docs/business-os-project-prompts/33-simnetiq-reconciliation-and-consolidation.md`. Real financial parity still needs the Doppler and SMS export handoffs.

## Completion

M3 is implemented and locally tested. It is not staging verified and not production verified. One leased worker pulls a signed page, commits facts and the cursor together, and leaves the previous snapshot in place when the source is down.
