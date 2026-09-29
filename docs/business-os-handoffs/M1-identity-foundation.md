# M1 handoff — private dashboard and identity foundation

Step ID: **M1**. Project: `simnetiq.store`. Date: 2026-09-29.

## Status

| Stage | State |
|---|---|
| Implemented in this repository | Yes. Identity shell, session routes, and migration `20260929120000` |
| Locally tested | Yes. Commands and results below |
| Staging verified | No. No Business OS Supabase project, bot, or Telegram client session |
| Production verified | No |

C0 contract version is unchanged. M2 was not started.

## Versions

| Item | Version |
|---|---|
| Contract / schema | Unchanged: `1.0.0` / `business-os.contract.v1` |
| Database migration | `supabase/business-os/migrations/20260929120000_identity_foundation.sql` |
| Formula / FX | Unchanged |

Doppler and SMS Code are seeded as `unverified` with `reporting_enabled = false`. Organization timezone `Europe/London` is the stored C0 proposal, not a confirmed gate.

## What was implemented

- Separate local Business OS database config in `supabase/business-os/`. It is not linked or applied to a remote project. The migration aborts if `public.marketing_contacts` exists.
- Tables for the organization, memberships, Telegram identities, link challenges, initData exchanges, project registry, integration secret references, and append-only identity events. Writes go through `security definer` functions granted only to `service_role`.
- Private root layout for `/admin`, `/tg`, and `/login`. `proxy.ts` returns those paths before locale normalization. Public layout, analytics, and locale routes are unchanged.
- Password login, TOTP enroll/challenge/verify, refresh, logout, CSRF, and membership revocation. Sessions are HttpOnly cookies. The refresh token cookie path is `/api/business-os/auth`.
- Telegram initData validation and a same-session replay record. `generateLink` plus `verifyOtp({ token_hash, type: "email" })` is implemented and unit-tested with a fake admin client. It stays off unless `BUSINESS_OS_TELEGRAM_SESSION_BROKER=enabled`. `/tg` otherwise uses the same password and TOTP login as the browser.
- Integration rows store a secret reference name only.

There is no public signup route. Marketing `lib/supabase.ts` and its env names are unchanged.

## Commands and results

```bash
npm run test:business-os-identity
```

```text
14 passed, 0 failed
```

Covers initData forgery, expiry, future dates, wrong bot, duplicate fields, non-integer ids, username change, broker-off behavior, replay, step-up, revoked membership, cookie flags, CSRF, proxy bypass, robots/sitemap/llms exclusion, client secret scan, RLS/grants, read-only mutation denial, and the marketing-table guard.

```bash
npm run test:business-os-contract
```

```text
contract conformance: 51 cases, 4 HMAC vectors, manifest ok
```

```bash
node --test scripts/tests/subscription-routes.test.mjs
```

```text
6 passed
```

```bash
npx next build
```

```text
Next.js 16.3.6 compiled successfully. Routes include /admin, /login, /tg, and /api/business-os/auth/*.
```

Local dev server, unauthenticated:

- `/login` rendered the Business OS sign-in shell with no marketing nav and no Vercel analytics markup.
- `/admin` redirected to `/login?next=/admin`. `/tg` redirected to `/login?next=/tg`.
- `/en` still rendered the public studio page, including navigation.
- `POST /api/business-os/auth/login` with a synthetic password returned `503 {"error":"business_os_unconfigured"}`.
- The same route without a CSRF token, and with a foreign `Origin`, returned `403 {"error":"csrf"}`.
- `/robots.txt` disallows `/admin`, `/tg`, and `/login`.

## Changed files

- `supabase/business-os/` — local config, migration, ownership notes
- `lib/business-os/` — env, database clients, session, CSRF, Telegram validation and exchange
- `app/(business)/` — private root layout and `/admin`, `/tg`, `/login`
- `app/api/business-os/` — auth, Telegram, and integration routes
- `components/business-os/` — shared shell, login form, and identity actions
- `tests/business-os/` — identity tests and the server-only test stub
- `scripts/business-os/bootstrap-owner.mjs` — manual owner grant, not run
- `proxy.ts`, `app/robots.txt/route.ts`, `.env.example`, `package.json`, `package-lock.json`
- `docs/business-os-handoffs/M1-identity-foundation.md` — this handoff

Dependencies added: `@supabase/ssr`, `server-only`, and dev dependency `@electric-sql/pglite`.

## Evidence and residuals

RLS evidence is from in-process Postgres, not a hosted Supabase project. Telegram HMAC tests are synthetic. No live owner, bot, or Mini App session was used.

`generateLink({ type: "magiclink" })` is documented by the installed Auth admin client as able to create a user. The exchange refuses the result unless the returned user id is the prelinked member, and it does not read an email from the request. That composition is still not approved for staging. Leave `BUSINESS_OS_TELEGRAM_SESSION_BROKER` unset.

The write rate limit is in-memory and per server instance. Cookie behavior inside Telegram Desktop or Web was not tested. SameSite remains `Lax`.

## Configuration names still needed

No values are stored. Names still required before a real owner session:

`BUSINESS_OS_SUPABASE_URL`, `BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY`, `BUSINESS_OS_SUPABASE_SECRET_KEY`, `BUSINESS_OS_TELEGRAM_BOT_TOKEN`, `BUSINESS_OS_TELEGRAM_BOT_ID`, `BUSINESS_OS_TELEGRAM_WEBHOOK_SECRET`, `BUSINESS_OS_OWNER_EMAIL`, and either `BUSINESS_OS_OWNER_PASSWORD` or `BUSINESS_OS_OWNER_USER_ID`.

Also confirm the Business OS Supabase target, region, and plan; disable public signup on that project; then run `scripts/business-os/bootstrap-owner.mjs`. Do not point the migration at the marketing database.

`REPORTING_TIMEZONE` remains an unconfirmed C0 gate.

## Deployment

No API host was deployed. There is no staging or production base URL. This app is the Simnetiq Next.js project; private routes are not a separate service.

## Next dependent step

M2 in this repository: `docs/business-os-project-prompts/31-simnetiq-finance-core.md`.

## Completion

M1 is implemented and locally tested. It is not staging verified and not production verified. The owner browser and Telegram shells share one identity loader, and anonymous requests stop at login. A live shared profile still needs the Business OS database, owner user, and bot configured outside this repository.
