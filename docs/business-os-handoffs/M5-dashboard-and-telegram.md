# M5 handoff — main dashboard and Telegram workspace

Step ID: **M5**. Project: `simnetiq.store`. Date: 2026-09-29.

## Status

| Stage | State |
|---|---|
| Implemented in this repository | Yes. `/admin` and `/tg` render the same report, snapshot, and draft services |
| Locally tested | Yes. Commands and results below. Signed-in browser flows were not run |
| Staging verified | No. No Business OS database has been migrated, and Doppler D4 / SMS S3 are not in this workspace |
| Production verified | No |

C0 contract version is unchanged. M1–M4 migrations were not edited. M6 was not started.

## Versions

| Item | Version |
|---|---|
| Contract / schema | Unchanged: `1.0.0` / `business-os.contract.v1` |
| Database migration | None |
| Formula / FX | Unchanged. The dashboard displays `financial_report` and imported snapshot bodies. It does not recompute them |

## Where to apply migrations

No new migration. The M1–M4 files listed in the M4 handoff are still the full set, and they still have not been applied remotely. Do not apply them to `eujmomonscnlmwcbkbfy` (simnetiq.store) or `fzlrhmjdjjzcgstaeblu` (Doppler VPN).

## What was implemented

- `/admin` sections: Overview, Projects, Sales, Expenses, Subscriptions, Traffic, Accounts, Reports, Integrations, and Settings. Documents, Business records, and Timeline open one panel that says those sections are the next step.
- `/tg` uses Overview, Money, Add, Documents, and More. The bottom bar stays those five destinations. Money also reaches Sales, Expenses, Accounts, Subscriptions, and Reports. More reaches Projects, Traffic, Timeline, Business records, Integrations, and Settings. The page loads `telegram-web-app.js`, applies theme and safe-area values when `window.Telegram.WebApp` exists, and shows the BackButton for every section except Overview. A normal browser still renders the same sections.
- Overview, Money, Accounts, and Reports read `financial_report`. Cards show currency, basis, the window, quality, and coverage. Native and GBP metric cards both open Sales drill-through. A null amount is “Unavailable” with its reason. An actual `0.00` stays zero. Each project row shows that project’s native sales, proceeds, and operating profit, or the report error when the read failed. Source freshness lists each connection’s health status and last successful sync, or “no successful sync”. Cash is “Verified cash” only when the balance kind is `cash` and every `finance/balances` gate for that basis is verified. Balances stay non-additive. Top-ups and other movements are labeled not revenue.
- Reports renders the same report figures for the active window, then the CSV link.
- Sales lists observations and components, and a metric card opens `report_drill`. Currency, source, and status narrow those rows. Headline totals stay the report figures.
- Central drafts use the existing draft, update, post, reverse, and allocation routes. Project-owned expenses are read-only. Shared allocation shows before, the slice, and after from `allocation_block`.
- Subscriptions and operations render `subscriptions/summary` and `operations/daily` snapshot bodies. Unsupported SMS subscriptions show the stored reason and do not show MRR as zero. Traffic renders each analytics row at its stored grain and timezone. Daily or cross-project distinct users are not added. Search Console dimension rows are not treated as a property total.
- CSV export now requires `from`, `to`, `basis`, and `grain`. Coverage and basis are copied from `financial_report`. Posted lines outside that window are omitted. Formula-injection escaping remains. The file no longer stamps a caller-supplied coverage or a single caller-supplied currency.

## Commands and results

```bash
npm run test:business-os-finance
```

```text
41 passed, 0 failed
```

Includes the previous journal tests, CSV window and coverage checks, London month boundaries, null versus estimated versus actual zero, analytics rows that are not summed, unsupported subscriptions, and a server render of overview, expenses, documents, traffic, and subscriptions. The render tests also cover a project amount of `9.00 USD`, a failed project with no invented zero, GBP card drill-through with basis and window, a last-success timestamp, Money and More links, and report figures above the CSV link.

Identity, sync, and contract were not re-run for this gap closure. The counts below are from the earlier M5 run on 2026-09-29. This change did not edit those modules.

```bash
npm run test:business-os-identity
```

```text
14 passed, 0 failed
```

```bash
npm run test:business-os-sync
```

```text
15 passed, 0 failed
```

```bash
npm run test:business-os-contract
```

```text
contract conformance: 51 cases, 4 HMAC vectors, manifest ok
```

Evidence is synthetic, from PGlite, and from frozen fixtures. It is not a hosted Supabase run and not a call to a deployed Doppler or SMS export.

## Browser clients actually opened

Cursor’s browser against the already running `next dev` on `127.0.0.1:3000`. Desktop for `/admin`, `/tg`, and `/en`. A 390×844 mobile emulation for `/he`, `/ru`, and `/login?next=/admin`.

| URL | Result |
|---|---|
| `/admin` | 307 to `/login?next=/admin`. Sign-in form rendered on desktop and at 390×844. No session, so the dashboard was not opened |
| `/tg` | 307 to `/login?next=/tg`. Same sign-in form |
| `/en` | 200. English home page rendered with Home, Projects, Services, and Book a call |
| `/he` | 200. Hebrew home page rendered. At 390×844 the public nav is a collapsed menu button |
| `/ru` | 200. Russian home page rendered at 390×844, including the collapsed menu button |
| `/robots.txt` | Still disallows `/admin`, `/tg`, and `/login` |

Signed-in filter, draft, post, correction, allocation, CSV download, and drill-through were not clicked. Those paths remain the route tests and the server render tests. Telegram iOS, Android, and Desktop were not opened. The WebApp theme and back button run only when the Telegram script injects `window.Telegram`.

## Changed files

- `app/(business)/admin/page.tsx`
- `app/(business)/tg/page.tsx`
- `app/(business)/layout.tsx` — viewport-fit cover for safe area
- `app/api/business-os/finance/exports/csv/route.ts`
- `components/business-os/workspace.tsx`
- `components/business-os/sections.tsx`
- `components/business-os/entry-form.tsx`
- `components/business-os/expense-actions.tsx`
- `components/business-os/telegram-frame.tsx`
- `components/business-os/business-post.ts`
- `components/business-os/identity-actions.tsx` — session and integration forms are separate
- `components/business-os/private-shell.tsx` — unconfigured message only
- `lib/business-os/workspace/filters.ts`
- `lib/business-os/workspace/present.ts`
- `lib/business-os/workspace/load.ts`
- `lib/business-os/finance/csv.ts`
- `lib/business-os/finance/london.ts`
- `lib/business-os/finance/rpc.ts`
- `lib/business-os/finance/rpc-status.ts`
- `tests/business-os/finance/domain.test.ts`
- `tests/business-os/finance/present.test.ts`
- `tests/business-os/finance/workspace-render.test.ts`
- `docs/business-os-handoffs/M5-dashboard-and-telegram.md` — this handoff

## Evidence and residuals

No remote migration was applied. No owner session was available, so draft, post, correction, allocation, CSV download, and drill-through were not clicked in a browser. Those write paths remain the existing route and PGlite tests. The dashboard render test used fixture JSON, not a live report.

The expense table has no notes column, so the form does not pretend to save notes. Receipt upload stays with documents in the next step. App and web funnel denominators stay unavailable unless an imported analytics row actually contains `app`, `web`, or `unknown_attribution`.

Real analytics still need D5 and S4. Until those snapshots exist, traffic and subscriptions say they are unavailable.

## Configuration names still needed

No values are stored. Names still required before a signed-in dashboard or a live pull:

`BUSINESS_OS_SUPABASE_URL`, `BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY`, `BUSINESS_OS_SUPABASE_SECRET_KEY`, `BUSINESS_OS_JOB_SECRET`, and `CRON_SECRET` set to the same value as `BUSINESS_OS_JOB_SECRET`.

Telegram, still with no values recorded here: `BUSINESS_OS_TELEGRAM_BOT_TOKEN` and `BUSINESS_OS_TELEGRAM_BOT_ID`, plus the owner numeric id configured privately.

Each connection stores a secret reference name, not the secret. Expected names once the sources exist: `BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION` and `BUSINESS_OS_SOURCE_SMSCODE_PRODUCTION`. Also required: deployed Doppler and SMS HTTPS base URLs, key ids, and the D4/S3 handoffs. D5/S4 are required before imported analytics can replace the unavailable traffic state.

Unconfirmed reporting gates remain those listed in the M4 handoff, including `REPORTING_TIMEZONE`, `REPORTING_CURRENCY`, `RECOGNITION_BASIS_POLICY`, and the FX, VAT, and history names.

## Deployment

No API host was deployed for this step. There is no staging or production source base URL. Private routes stay in this Next.js app.

## Next dependent step

M6 in this repository: `docs/business-os-project-prompts/35-simnetiq-documents-registry-reminders.md`. Documents, business records, and the timeline are labeled as that step and are not implemented here.

## Completion

M5 is implemented and locally tested. It is not staging verified and not production verified. The dashboard and Telegram workspace show the existing report and snapshot services, leave missing figures unavailable, and do not add a second calculation path.
