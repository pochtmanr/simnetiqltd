# Business OS — integration contracts and dependencies

> 8 November 2026 amendment (hybrid data path, owner decision): company-level accounts connect directly to Business OS — the Revolut Business bank account (balances and bank transactions) and App Store Connect sales/finance reports. RevenueCat also connects directly, read-only, for pulse metrics only (MRR, active subscriptions, trials). Direct pulls emit the same v1 contract pages and go through the same validation, quarantine and snapshot storage. The money ledger still comes from project exports; direct data is displayed and used for reconciliation, never posted as a second sale. See [the v2 design](superpowers/specs/2026-11-08-business-os-v2-design.md).

> 28 September refinement: project-local reporting services now own their calculations and provider imports; Simnetiq consumes versioned read-only exports. Read [function matrix](BUSINESS_OS_FUNCTION_MATRIX.md) and [project API contract](BUSINESS_OS_PROJECT_API_CONTRACT.md) before implementing. These refine the earlier central-ingestion proposal below.

Production connections have not been tested. All integration status starts unverified. Two live-product targets: Doppler VPN and SMS Code. Provider account membership and RevenueCat account/project structure are still unknown.

## Common ingestion contract

Normalized observations carry organization, project, connection, environment, source event/object/transaction ids, kind, occurred/received timestamps, exact original amounts/currency, amount basis, optional components/tax/fees, customer pseudonymous reference, subscription/product reference, correction linkage and provenance version. Omitted fee/tax means unknown, not zero. Payloads are server-only, minimized/redacted and retained under a documented policy. Never include auth headers or secrets.

Flow: verify origin/signature → durably insert inbox → acknowledge → claim/retry worker → normalize and map economic identity → atomic ledger/subscription upsert → reconcile. Persist transaction and processing state atomically; unique constraints handle simultaneous webhook/backfill delivery. Out-of-order subscriptions use source effective time/version and authoritative refresh when ambiguous. Unknown events remain observable; do not silently discard finance-affecting types. Use exponential backoff, attempt cap, dead-letter state and replay after correction. Backfills use cursor + overlap + dedupe; report earliest reliable timestamp and gaps.

Source exports are preferable to granting central code broad product service-role access. Use narrow signed server endpoints/read-only machine RPCs. Source agents must inspect their own AGENTS.md; SMS landing has a specific Git/deployment policy. No payment-fulfilment rewrite, source auth weakening or production migration is implied by this handoff.

## SMS adapter — first financial milestone

Read `wallet_ledger`, `rc_credit_grants`, activation financial rows, config/version, supplier snapshots and top-ups through an audited export contract. Reuse SQL money helper definitions for comparison; existing human admin RPCs require AAL2 and cannot simply be called with a forged session. Implement a separately scoped machine export without widening existing RPC grants.

Export purchase/refund/regrant origins and sandbox evidence. Map credits consumed separately from pack purchase. Export recorded cost, fallback-rate flags, snapshot coverage and unexplained supplier movements. Avoid phone numbers, SMS content or unnecessary customer identity.

Reconciliation fixture: frozen cutoff, 24h/7d/30d and full available history; native USD gross, legacy commission difference, refunds, proceeds, earned, recorded cost, balance-derived spend, balances. Exact rounded legacy outputs must match; any difference is itemized, never hidden in tolerance. GBP conversions tested separately. Preserve existing money UI and source formulas.

## Doppler Revolut Merchant

Evidence: Merchant base URL and pinned source API version `2025-12-04` in `doppler-web/src/lib/revolut.ts`. Read `vpn_invoices` and authoritative order/payment status. Join invoice provider_payment_id to merchant order; define payment/refund-level unique ids when one order has several operations. Retrieve fees, refunds, chargebacks and settlement reports only through account-supported endpoints/exports. Merchant checkout access does not automatically grant bank-account data; bank balance/statement access is a separate capability or manual statement import.

Do not infer receipt from checkout redirect or invoice creation. Validate existing invoice status against provider before backfill is certified. Preserve original minor units/currency exponent, metadata project/plan and nullable attribution. Payout matching must support several orders per payout, several partial settlements and fee adjustments. Official reference: [Revolut Merchant API](https://developer.revolut.com/docs/api/merchant).

## Doppler OxaPay

Use invoice/order/track identity, authenticated callback plus provider inquiry/report as needed. Preserve fiat invoice amount/currency, actual crypto quantity/asset, network, transaction hash and index/identifier, received confirmations/status, network/processor fees, settlement asset and wallet/account. Hash alone is insufficient when one chain transaction contains multiple transfers. Crypto fields missing from existing invoices remain unknown until enriched.

Separate customer crypto receipt, processor conversion, processor payout and own-wallet transfer. A crypto payout must not create a second sale. Store receipt GBP valuation independently from later disposal/FX gain/loss; unresolved valuation stays incomplete. Under/overpayment, duplicate callback, delayed confirmation, failed invoice and refund need fixtures. Current OxaPay callback contract expects HTTP 200 with `ok`; follow the configured API version's signature/envelope rules: [OxaPay webhook docs](https://docs.oxapay.com/webhook). Never request seed phrases or signing keys.

## RevenueCat

Inventory project/app/store/product identifiers first. SMS uses consumables; Doppler has subscription ownership/entitlement handling. Existing Doppler webhook is not a complete money export. Use supported RevenueCat event/API/export access for revenue and history; don't assume one API returns every historical sale. Production/sandbox separation is mandatory; unknown environment is quarantined until classified, even if existing fulfilment grants access.

New read-only receiver or durable source outbox must coexist with existing entitlement webhooks. Identify one authoritative normalized sale across source ledger and RevenueCat; use other observations to reconcile/enrich it. Renewal transaction ids differ from original subscription id. Refunds, reversals, cancellations, expirations, pauses, transfers and billing retries are distinct events.

Store gross purchased-currency amount, USD provider value if supplied, estimated tax/commission, product, store, transaction and subscription ids. Later store financial reports/bank payouts establish actual cash; estimated proceeds and actual settlements remain visibly separate. Official reference: [RevenueCat event fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields).

## Revolut Business (direct, company bank account)

Shown on **Money › Bank**. Read-only: the consent asks for scope `READ` only, so nothing in Business OS can move money. Bank rows are cash movements and never post to the ledger.

Storage differs from the 8 November note above: bank data goes to its own tables (`bank_accounts`, `bank_transactions`, `bank_category_rules`, `provider_runs`, `provider_tokens` in migration `20261108140000_bank.sql`), not to contract snapshot pages. Categorisation, statements and agent queries need row-level data that can be updated. Each transaction leg is one row keyed `<transaction id>:<leg id>`. The first pull reads 400 days; later pulls re-read 14 days (or from the oldest pending row) every 30 minutes through `/api/business-os/providers/tick`.

Categories: rules (text → category) apply to new rows and, when saved, to uncategorised and rule-set rows. A category set by hand is never changed by a rule or a re-pull. Exchanges and transfers between own accounts default to "Own-account transfer" and are kept out of money in/out.

Setup (owner):

1. Generate a key and certificate (keep `revolut.key` secret; it never leaves the server env):
   `openssl req -x509 -newkey rsa:2048 -nodes -keyout revolut.key -out revolut.cer -days 1825 -subj "/CN=simnetiq-business-os"`
2. Revolut Business › Settings › APIs › Business API › add API certificate. Upload `revolut.cer`. OAuth redirect URI: `https://<production host>/api/business-os/providers/revolut/callback` (for local testing, a second certificate with `http://localhost:3000/...`). Copy the client ID.
3. Token key: `openssl rand -base64 32`.
4. Set in Vercel (`vercel env add`) and `.env.local`: `REVOLUT_CLIENT_ID`, `REVOLUT_PRIVATE_KEY` (contents of `revolut.key`; `\n` escapes are accepted), `REVOLUT_REDIRECT_URI` (exactly as in step 2), `BUSINESS_OS_TOKEN_KEY`. Optional `REVOLUT_ENVIRONMENT=sandbox` to use Revolut's sandbox.
5. Apply `20261108140000_bank.sql` to the Business OS Supabase project.
6. Open Money › Bank as the owner with step-up and click **Connect Revolut**. Approve in Revolut; the first pull runs on the way back.

Unverified until the first sandbox connect: the auth flow (consent page `app-confirm`, `/auth/token`, client-assertion claims `iss` = redirect host, `aud` = `https://revolut.com`) follows Revolut's developer guide, which could not be fetched for this change. `/accounts` and `/transactions` follow Revolut's published OpenAPI spec. A refused refresh shows "Reconnect needed" on the Bank tab.

## Analytics and business imports

Doppler: assess GA and Vercel account access plus existing analytics jobs; reuse invoice attribution. SMS/studio: Vercel source exists, export capability/history not checked. Keep separate sites for corporate studio and products; studio traffic does not become a third revenue project. Start tracking dates/consent exclusions in coverage registry. Scheduled aggregates must retain original timezone and metric definition.

Manual CSV imports use staging, mapping, preview, row-level errors, file checksum and import idempotency; no direct unreviewed bulk posting. Support supplier top-ups, bank statements, old expenses and opening balances with source documentation. Opening balances need an explicit as-of date and must not overlap imported movements.

## Access checklist for implementer

- Target Supabase project/region and staging project; current schema/grants for target and source systems.
- Owner login email, trusted Telegram numeric ID and dedicated bot username/token via secret manager.
- Doppler/SMS source deployment identifiers and signed read-only export access.
- RevenueCat account/project/app mapping, scoped read credentials, webhook configuration and supported historical reports.
- Revolut Merchant production/sandbox access; settlement reports; optional separate bank statements/access.
- OxaPay merchant read/report capability, supported assets/networks and account ownership list.
- Analytics property/site identifiers and official export access; historical dates and consent policy.
- Store financial reports or payout/bank exports to distinguish proceeds from received cash.
- FX source and valuation policy, opening balances/date, shared-cost allocation, fiscal/VAT data supplied by owner/accountant.

Integration screen: configured/unconfigured, mode (webhook/poll/CSV), last receipt, last processed event, last successful sync, covered-through date, last reconciliation, unresolved count, staleness and permission errors. A valid key alone does not mean healthy data.
