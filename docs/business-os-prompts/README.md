# Agent prompt pack

Give each agent its numbered prompt together with access to the repository's `docs/BUSINESS_OS_*.md` documents. Each file contains a complete task and shared guardrails. No agents were launched during planning.

1. [Foundation and identity](01-foundation-and-identity.md) — first; owns contracts and migration integration.
2. [Financial core](02-financial-core.md) — after foundation contract.
3. [SMS reconciliation](03-sms-source-and-reconciliation.md) — inspect early, integrate after financial contract.
4. [Doppler and providers](04-doppler-and-payment-sources.md) — same dependency; can run alongside SMS with separate modules.
5. [Web and Telegram workspace](05-web-and-telegram-workspace.md) — after shared auth/DTOs, iterate with finance.
6. [Analytics and operations](06-analytics-and-operations.md) — after contracts, alongside isolated UI/adapter work.
7. [Verification and release](07-verification-and-release.md) — final independent acceptance.

Do not run all seven concurrently against shared migrations. One integrator owns proxy.ts, package changes, schema migrations and DTO revisions. Each agent stops its scope at its stated deliverable and reports evidence to the human/integrator; do not assume cross-chat messaging authorization.
