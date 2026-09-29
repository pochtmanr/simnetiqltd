# Business OS — deployment and operating runbook proposal

Nothing has been provisioned or deployed by this audit. Local Vercel metadata is not a verified production target. Confirm deployment account/project/domain before publishing.

## Environment separation

Keep current marketing Supabase settings intact. Proposed private settings: BUSINESS_OS_SUPABASE_URL, BUSINESS_OS_SUPABASE_PUBLISHABLE_KEY, BUSINESS_OS_SUPABASE_SECRET_KEY (or server-only legacy service-role credential supported by selected project), BUSINESS_OS_TELEGRAM_BOT_TOKEN, BUSINESS_OS_TELEGRAM_WEBHOOK_SECRET, BUSINESS_OS_JOB_SECRET and connection-specific source secrets. Names are proposals; implementation must document exact chosen names and validation. No server secret gets a NEXT_PUBLIC prefix. Prefer scoped source credentials and secret references over database-stored plaintext.

Staging and production use separate DB/storage/bot or explicitly isolated test bot setup, callback URLs and provider environments. Preview builds must not ingest production webhooks or send production notifications. Ensure migrations target Business OS, not existing marketing or product databases.

## Release steps

1. Record target project/region/plan, schema version, backups and restore procedure. Introspect existing schema and keep a schema/grants snapshot.
2. Run local migrations, constraints, RLS, exact-money and import tests; deploy staging only.
3. Seed Simnetiq organization, GBP settings, confirmed owner and two projects with sources unverified. Set timezone after confirmation. No hardcoded company number/VAT/tax dates.
4. Configure web Supabase callback allowlist, bot HTTPS Mini App menu URL, server bot webhook secret, private storage and signed-source exports.
5. Prove owner web/Mini App login, refresh/revoke/MFA and direct database denial tests. Test Telegram iOS, Android and desktop/web behavior plus ordinary browser fallback.
6. Run manual expense/document smoke scenarios; keep notification jobs disabled until recipient and preferences are configured.
7. Backfill sources read-only into staging; compare frozen SMS USD windows and Doppler provider exports. Attach reconciliation evidence with redacted identifiers.
8. Apply reviewed forward migrations to target after backup; deploy additive routes; enable one verified source at a time. Start scheduled workers with locked leases, budgets and paging.
9. Validate public en/he/ru routes, SEO/canonical redirects, mailing-list flow, contact and account-deletion behavior. Check admin routes remain private and absent from sitemap, llms documents and analytics.
10. Enable notifications only for owner-configured events. Record release version, source coverage and known limitations.

## Monitoring and recovery

Observe inbox backlog/oldest event, worker failures, sync lag, missing currency rates, data coverage, reconciliation residuals, database/storage utilization, scheduled-job health and expired source permissions. Alert on actionable changes; no endless unchanged notifications.

Rollback app deployment without rewriting source data. Stop a faulty connector/job, preserve inbox evidence and replay after fix. Correct posted money with reversals, not deleting ledger rows. Database destructive rollback is not an automatic deployment step. Exercise restoration of database plus private files into an isolated environment and verify access policies and report snapshots; a configured backup is not a tested restore.

## Verification recorded in planning

`node --test scripts/tests/subscription-routes.test.mjs`: **6 passed** on 2026-09-28. Documentation-only change; no new application feature, source integration, production balance, Telegram session, RLS policy or deployment was tested. Future execution must report actual commands/results and unresolved gates, not inherit this baseline as release certification.
