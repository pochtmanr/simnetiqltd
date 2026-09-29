# Business OS — proposed database contract

Design only. No migrations were generated/applied because the handoff scope is planning and the target live database is unverified. Implementation agent 01 owns executable migrations after introspection. Do not infer missing source tables from these proposals.

## Tables by phase

All business rows are scoped to one `organization_id` (Simnetiq Ltd), with UUID identifiers, UTC `timestamptz`, creator and modification metadata as appropriate. UUID generation must use supported installed Postgres features, not an assumed UUIDv7 extension. One organization is sufficient; do not build SaaS tenancy UI.

| Group | Proposed tables | Key fields and invariants |
|---|---|---|
| Access | `organizations`, `memberships`, `telegram_identities` | reporting currency GBP, timezone; unique organization/user, owner/admin/read_only; unique bot_id/telegram_user_id linked to existing auth.users.id; revoked_at |
| Projects | `projects` | unique org/slug, name, state, website, reporting_enabled, integration_verified_at; seed only doppler and smscode as eligible, enable totals per verified source |
| Company | `legal_entities` | legal name, jurisdiction, registration/tax references, addresses, fiscal settings; values user supplied, not invented |
| Integration | `provider_connections`, `provider_events`, `sync_runs` | source account/project/environment, secret reference only; external event id, payload hash, occurred/received time, retry state, lease, error, version, cursor and coverage |
| Finance | `financial_accounts`, `financial_entries`, `financial_lines` | account kind/currency/entity; entry source/manual, origin key, economic transaction key, dates, status, reversal reference; debit/credit lines, account, project/allocation, original and GBP valuation |
| Rates | `exchange_rates` | base/quote, exact rate, effective/fetched time, source/version; unique source/pair/effective-time |
| Manual workflows | `expenses`, `expense_categories`, `expense_allocations`, `recurring_expenses` | editable drafts; paid/due date, vendor, amount, tax/recoverability, receipt, payment method, posted entry; allocations sum exactly to expense; recurrence schedule separate from actual payment |
| Cash reconciliation | `balance_snapshots`, `settlements`, `settlement_matches`, `reconciliation_runs` | external account, amount/currency/as_of, available/pending/reserved type; payout id, amounts/fees; many-to-many sales/payout allocation; residual and explanation |
| Products | `products`, `subscriptions`, `subscription_events` | source product/type; store subscription identity, status and periods, auto-renew flag; unique source event; no fabricated SMS subscriptions |
| Analytics | `analytics_daily`, `analytics_funnels` | project/site/provider/date/timezone/definition-version, dimensions, actual/estimated, coverage; funnel period/cohort and denominator |
| Operations | `documents`, `document_links`, `service_registrations`, `timeline_events`, `reminders`, `notification_deliveries` | private object path; typed FK links; dates/tags/vendor; service/account reference and renewal; reminder schedule and unique occurrence/delivery |
| Audit | `audit_logs`, `report_snapshots` | actor, reason, before/after redacted metadata, correlation id; report basis, cutoff, formula version and source coverage |

`financial_entries` is the canonical journal, not a second mutable copy of a revenue table. Manual income posts through the same service. Expenses contain workflow metadata, while financial values for reports come from posted journal lines. Avoid adding independent transactions/revenue_records ledgers with diverging totals. Financial UI exposes a simplified transaction view.

## Monetary and posting rules

Use exact Postgres `numeric` and decimal-string API values. Fiat original amounts obey ISO currency exponent; crypto quantities allow up to 18 decimals initially with supported assets explicitly validated (wider scales require an explicit schema change). GBP report values retain extra precision internally and round to pennies at presentation or controlled posting boundaries. Exchange rates use high precision, source and effective timestamp. Missing FX leaves GBP valuation NULL and flags incomplete totals.

Every posted entry balances in reporting currency; FX conversion entries may have different native currencies with an explicit FX gain/loss line. Posting occurs in one transaction through a narrow RPC/service; enforce balanced lines at commit, not a per-row CHECK. Drafts may be edited; posted entries use reversal + replacement, never silent overwrites. Lock periods through report snapshots and a controlled reopen workflow. Original data and the policy/rate used must remain reproducible.

Keep purchased_at, effective_at, received_at, settled_at and service_period separate. Flags distinguish actual/estimated/legacy_derived. Processor clearing, deferred revenue/customer credits, supplier prepaid credit, revenue, fees, COGS, OPEX, tax, owner funding and bank/wallet accounts are distinct. A supplier top-up debits prepaid credit and credits bank; usage debits COGS and credits prepaid credit. A payout debits bank and credits provider clearing. Neither creates fresh sales.

Source identity constraints: unique `(connection_id, environment, external_event_id)` for events. Unique normalized posting origin `(connection_id, environment, external_object_id, event_kind, external_adjustment_id)` with non-null normalized keys; a refund and refund reversal must not collide with the purchase. Canonical sales mapping links source invoice/store transaction to provider webhook and backfill; distinct event ids alone do not prevent economic duplication. Aliases and linked observations are evidence, not extra entries.

SMS legacy compatibility snapshots store original USD outputs, frozen cutoff, definition/version and provenance separately from journal-derived consolidated results. They never add a second income stream. Document the bridge between legacy net-valued earned revenue and centrally selected gross/fee presentation.

## RLS, constraints and indexes

Enable RLS and explicitly revoke unintended grants on every new table and storage bucket. Owner/admin/read_only membership is server-owned; users cannot write their own role. Read-only can query authorized reports/documents but cannot mutate or create signed uploads. Only owner configures identities/integrations and users. Ordinary user requests use session-bound DB clients; ingestion service credentials are not a substitute for user authorization.

Index organization/project/effective-date report filters, foreign keys, external uniqueness keys, pending-job predicates and membership lookup. Constrain allowed statuses, positive exchange rates and allocation totals; financial lines are immutable after posting. Database uniqueness enforces races, not pre-insert lookups. Security-definer functions require fixed search_path, minimum grants and explicit checks. Prevent deleting posted finance through cascading project/account deletes.

Storage: private bucket with organization/object paths, authorized metadata link, size/type limits and storage policies. Short-lived signed download/preview URLs created only after permission checks; never persist signed URLs. Store checksums; quarantined files cannot render as HTML. Prevent cross-organization attachments and orphan uploads.

## Migration sequence

1. Verify target project and export current schema/grants; establish separate local Business OS migration configuration.
2. Access/project registry + RLS, then ledger/FX + constraints, then import inbox and source mappings.
3. Expense/documents/operations, then subscriptions/analytics/report views as their agents land.
4. Each migration includes policy and rollback/recovery notes. Test a clean database and upgrade path, plus unauthorized direct REST/RPC/storage calls. Never apply source-product or marketing migrations using the Business OS deployment target.
