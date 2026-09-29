# Business OS — repository audit

Audit date: 28 September 2026. Scope: local source inspection, not a production security or financial audit.

## Confirmed scope and decisions

The owner's answers supersede the original master prompt: integrate **Doppler VPN and SMS Code only** in release 1. Owner: **Simnetiq Ltd, London**. Reporting currency: **GBP**; preserve every original currency. Owner-only initially, with owner/admin/read-only roles prepared. Create a dedicated Simnetiq business Telegram bot. Revolut and crypto payments are on Doppler's landing site. Europe/London reporting boundaries are a proposed default, not an explicitly confirmed timezone. Argus, Physics and Greenflagged are deferred and excluded from totals.

This delivery is an audit and implementation handoff, as requested. No application code, source databases, provider configuration or deployments were changed.

## Evidence and limits

Inspected the complete tracked application-file inventory in simnetiq.store and targeted payment, financial, authentication and analytics sources in neighboring repositories. Did not read secret values, call live financial APIs, query production databases or verify deployed revisions. Source code proves an implementation exists, not that its deployment, credentials, permissions or historical data are complete. Working tree was clean before documentation work. Existing six mailing-list route tests pass.

## Repository and directory map

| Directory | Observed implementation | Business OS implication |
|---|---|---|
| `simnetiq.store/app/[locale]` | Next.js App Router marketing pages, en/he/ru, public root layout, navigation/footer and Vercel Analytics | Preserve public routes; private admin needs separate root layout |
| `app/api` | Contact, account-deletion request, subscribe/confirmation, unsubscribe and outreach opt-out handlers | No financial API or owner login found here |
| `components` | Theme, panels, navigation, CSS modules, public charts/figures | Reuse tokens and appropriate primitives; public chart illustrations are not business data |
| `lib` | i18n, SMTP, rate limit, analytics wrapper, lazy server-only Supabase service client | Keep mailing-list client intact; add separate session-bound admin DB access |
| `supabase` | README contracts for existing `marketing_contacts` and `outreach_prospects`; migration directory empty | Full live schema and RLS not versioned here; introspect before migration |
| `scripts` | i18n validation and `tests/subscription-routes.test.mjs` | Regression baseline exists, no financial/auth/RLS suite here |
| `messages`, `public` | Localized copy and marketing assets | Do not interpret provider logos or marketing copy as integration evidence |
| `proxy.ts` | Locale negotiation and known-path redirects; API paths excluded | Unknown `/admin` and `/tg` would currently redirect to public home |
| `next.config.ts`, `.vercel`, `OPS.md` | Canonical simnetiq.com redirects, local Vercel metadata and operational docs | Preserve canonical redirects; verify actual production project separately |
| `doppler/doppler-web` | Next.js landing/checkout; Revolut Merchant and OxaPay handlers; Supabase; RevenueCat Edge Function; consent/GA/Vercel sources | Primary VPN web-payment adapter and attribution source |
| `doppler/doppler-admin` | Separate Next.js 15 admin, Supabase auth, `/tg`, admin APIs and Telegram validation | Useful UI/auth reference, not a drop-in Next.js 16 implementation |
| `doppler/doppler-admin-bot` | Queries subscription/install/App Store/blog analytics tables/RPCs | Determine how upstream jobs populate them before trusting freshness |
| `doppler/doppler-apple`, `doppler-android`, `doppler-windows` | Native client directories present | Detailed SDK/product inventory remains an integration-agent task |
| `doppler/doppler-infra`, Telegram/support bot directories | VPN infrastructure, bots, monitoring sources | Source VPN direct costs and service-health summaries later; don't rebuild operational controls |
| `smsapp/landing` | Next.js marketing site plus `/admin`, money, purchases, activations, delivery, users | Existing SMS management and reconciliation reference |
| `smsapp/sms-expo` | Expo client, RevenueCat IAP, Supabase Edge Functions and SQL migrations | Primary SMS purchase, coin ledger and supplier-cost source |
| `smsapp/docs`, `marketing`, `scripts` | Documentation and operating assets | Use existing source contracts and tests when extending SMS exports |

Current site package manifest: Next ^16.3.6, React 19.2.4, TypeScript 5, Tailwind 4, Motion, Supabase JS ^2.117.2, Nodemailer and Vercel Analytics. No Supabase SSR package in this site's manifest. Installed Next guides for Proxy and authentication were read: Proxy is not the authorization boundary.

Deferred discovery only: Argus appears under `hesper` (landing billing and launcher database); Greenflagged is referenced by `ContractChecker/README.md`. Physics already contains billing modules and migrations despite being in development. Owner explicitly deferred these projects; no readiness certification was performed.

## Verified integrations and source-of-truth map

| Data | Source evidence | What it establishes / missing evidence |
|---|---|---|
| Studio visitors | `lib/analytics.ts`, `app/[locale]/layout.tsx` | Vercel page analytics/custom events. No central visitor warehouse; persistent local client ID in custom events needs privacy review |
| Doppler Revolut | `doppler-web/src/lib/revolut.ts`, `src/app/api/revolut/webhook/route.ts` | Merchant API, order retrieval, signed webhook and `vpn_invoices`; no verified bank-balance or settlement import |
| Doppler crypto | `src/lib/oxapay.ts`, `src/app/api/oxapay/webhook/route.ts` | OxaPay signed callbacks and pending-to-paid invoice flow. Need provider inquiry/export for token/network/fees/settlement history |
| Doppler RevenueCat | `doppler-web/supabase/functions/revenuecat-webhook/index.ts` | Subscription entitlement/ownership event handling. Do not assume it stores a complete monetary ledger |
| Doppler attribution | `supabase/migrations/010_invoice_attribution.sql`, `src/lib/purchase-events.ts` | Nullable order attribution snapshot; historical/Telegram orders may be unattributed |
| Doppler analytics | `src/components/analytics/google-analytics.tsx`, `analytics-consent.tsx`; admin-bot analytics service | GA consent-mode and Vercel code; analytics tables queried elsewhere. Live access/history unverified |
| SMS purchases | `sms-expo/supabase/functions/rc-webhook/index.ts` | RevenueCat **non-renewing consumable coin packs**, grant/refund/reversal flow, environment metadata |
| SMS financial ledger | `wallet_ledger`, `rc_credit_grants`, `pricing_config`, `activations`, `provider_balance_log`, `provider_topups` referenced in SQL | Purchase proceeds, coin usage, recorded supplier cost, balance samples and manual top-ups |
| SMS reports | `supabase/migrations/20260845000000_admin_money.sql`; `landing/lib/admin/rpc.ts`; `app/(admin)/admin/money/page.tsx` | `admin_money_summary`, `admin_money_pnl`, `admin_money_breakdown`, `admin_provider_spend`, top-up RPCs |
| SMS visitors | Public en/ru layouts use Vercel Analytics; admin layout intentionally excludes it | No centrally imported visitor history established |

## Financial findings requiring explicit treatment

1. SMS is not a recurring-subscription product in the inspected purchase flow. Show repeat-purchase rate and coin consumption, not invented SMS MRR or subscriber churn.
2. SMS `cash_net` is the sum of ledger USD values for live purchases/refunds/reversals. It is **not proof of an Apple bank payout**, despite the existing UI's “Net cash received” label.
3. SMS gross can be reconstructed from net and configured commission when original gross is absent. Webhook code uses `takehome_percentage` or configured commission; preserve the legacy calculation and mark estimates. RevenueCat's current docs describe estimated tax/commission fields separately.
4. SMS earned revenue uses delivered activations × a user's lifetime net USD/coin rate; fallback `pricing_config.net_usd_per_coin` applies without purchase history. This is a management valuation, not automatically formal revenue recognition. Historical outputs can change when lifetime averages change.
5. SMS recorded supplier cost and balance-derived supplier spend are two alternative cost views. Do not subtract both. Missing recorded costs currently count as zero; expose coverage before reporting margins.
6. Supplier balance is prepaid operating credit, not free bank cash. Frozen balances are separate. Top-ups move value to supplier credit; later consumption is cost.
7. Doppler Revolut order amounts are minor units; OxaPay route converts fiat major amounts using Number/rounding. New adapters must use exact decimal parsing and validate currency exponent. Do not copy floating-point conversion.
8. Doppler entitlement state does not establish auto-renewing status or sales amount. Separate recurring store subscriptions from one-time web access terms.
9. Existing webhook duplicate guards and side effects require race/failure testing; observed code is not certification of exactly-once processing.

## Authentication and reuse constraints

SMS AuthGate delegates authority to Postgres `is_admin()` and requires allowlisting plus AAL2; do not weaken it to export data. Add a narrow machine-read export, not a fabricated operator session. Doppler Telegram validation is reusable reference material but permits 24-hour initData and does not explicitly reject future auth dates; its comment notes the admin surface bypasses RLS. Central admin should use a short exchange window, replay control, linked Supabase identity and RLS-bound user queries instead of copying that trust model.

## Missing functionality in this repository

Owner login, role policies, Telegram identity/session exchange, financial ledger and FX, imports/reconciliation, private documents, business registry, expense entry, recurring schedules, timeline/reminders, central analytics and exports. Existing newsletter tables must remain untouched.

## Strategy and next evidence

Build an additive private `/admin` and `/tg` surface within this site, sharing backend and components. Bootstrap a separately provisioned Business OS Supabase project (recommended isolation), retaining this site's existing marketing connection. Verify project choice before provisioning. Import read-only from product systems; do not migrate customer accounts or redirect existing purchase webhooks.

Next integration evidence: actual source schema/version and RLS grants, redacted representative production events, RevenueCat project/store mapping, provider report permissions, earliest reliable dates, balances and payout exports, analytics access. No secrets are needed in chat. See architecture, database, integration and implementation documents for exact file ownership and acceptance gates.
