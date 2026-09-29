# Agent 04 — Doppler and payment ingestion

Read docs/BUSINESS_OS_FUNCTION_MATRIX.md and docs/BUSINESS_OS_PROJECT_API_CONTRACT.md first: the latest project-local calculation and provider-import ownership supersedes any conflicting central reimplementation below. Local admin and project API share calculations; Simnetiq consumes original financial facts plus non-posting report snapshots.

Read AGENTS.md in each repository you touch and the installed Next.js documentation before Next code. Read docs/BUSINESS_OS_AUDIT.md, BUSINESS_OS_ARCHITECTURE.md, BUSINESS_OS_DATABASE.md, BUSINESS_OS_METRICS.md, BUSINESS_OS_INTEGRATIONS.md, BUSINESS_OS_SECURITY.md and BUSINESS_OS_IMPLEMENTATION_PLAN.md first. These plans are source-grounded proposals: introspect actual schema and verify current provider APIs before implementation. Do not invent missing fields/endpoints or silently change agreed contracts.

Scope: Simnetiq Ltd, GBP, Doppler VPN + SMS Code only, owner-only initially, prepared owner/admin/read_only roles, dedicated Simnetiq Telegram business bot. Proposed timezone Europe/London; confirm before production aggregation. Preserve public website, source payment fulfilment and source auth. No Argus/Physics/Greenflagged implementation. Never expose credentials or send them in chat. No destructive database changes. Keep changes within this task's ownership; coordinate shared-file/migration changes with the foundation integrator. Do not deploy financial integrations until staging tests and reconciliation pass. Missing live access means explicitly unverified, not completed.

For handoff report: changed files, migration/contract version, tests and actual results, redacted reconciliation evidence, credentials/configuration still needed, remaining limitations, and next dependent task. Update relevant Business OS documentation to match final behavior.

Work in /Volumes/RomanSSD/Developer/doppler and central lib/business-os/integrations. Dependencies: agent 01 inbox/source identity contract and agent 02 finance posting. Inspect existing Doppler sources and deployment rules before changes.

Verify RevenueCat account/project/store/product structure; existing entitlement handler is not assumed to contain money history. Verify Revolut Merchant configuration and OxaPay API version, invoice schema, provider ids, currency units and attribution. Add read-only source exports/secondary inbox delivery without changing existing entitlement/checkout fulfilment. Source webhooks keep working during OS downtime.

Implement provider adapters with authenticated durable receipt, unique event keys, canonical sale mapping, leases/retry/dead-letter state, paginated history and overlap dedupe. Handle partial refunds/reversals, chargebacks, fees and payout matching where account access supports them. If report/API permissions are missing, provide CSV staging/import and show unverified status. Merchant API checkout credentials alone do not establish bank balances.

RevenueCat distinguishes transactions from original subscription identity, cancellation from expiry, consumables from recurring plans, trials from paying access and production from sandbox. Coordinate SMS ownership with agent 03 so direct RC events enrich/reconcile source ledger rather than duplicate sales. Store estimates as estimates; actual cash uses settlement/statement evidence.

OxaPay preserves fiat invoice and actual token amounts/network/hash/confirmation, account and fees when available. Handle partial/overpayment and processor conversion/payout separately; use decimal strings. Own-wallet transfer is not revenue. Do not request private keys.

Acceptance: replay same event, two concurrent deliveries, webhook plus historical import and webhook plus invoice import result in one economic sale. Test refund, reversal, out-of-order lifecycle, sandbox/unknown environment, missed callback recovered by poll, supplier/report timeout, missing FX, stale source and multi-sale payout with residual. Reconcile native amounts to real redacted provider reports before enabling consolidated verified totals. Record coverage and unresolved differences.
