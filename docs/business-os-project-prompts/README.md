# Business OS — project-sorted implementation prompts

Created 28 September 2026 from BUSINESS_OS_FUNCTION_MATRIX.md and BUSINESS_OS_PROJECT_API_CONTRACT.md. **Planning artifacts only: these prompts do not mean the APIs or dashboard are implemented.**

All 17 step prompts live in this single folder. Use this pack for the new project-owned reporting architecture. The older `../business-os-prompts/` pack remains untouched for historical context; do not run it alongside this pack, because its tasks mix source and central ownership.

## How to run

1. Run **C0 in simnetiq.store first** to freeze one contract for all projects.
2. Open the **Doppler** project and run **D1 → D2 → D3 → D4 → D5**, one prompt at a time.
3. Open the **SMS Code** project and run **S1 → S2 → S3 → S4**, one prompt at a time.
4. Return to **simnetiq.store** and run **M1 → M2 → M3 → M4 → M5 → M6 → M7** to build and verify your main dashboard.
5. For each step, paste the entire file (including project/prerequisites) into your coding chat, or ask it to read and execute that exact file. Review its handoff/test evidence before the next step. Every new chat needs access to the two source documents, C0 artifacts and predecessor handoffs. For a remote machine, copy those artifacts and replace the local absolute roots with their real equivalents.

This is a simple serial order, not a requirement to finish optional analytics before foundation work. After C0, Doppler and SMS are independent, and M1/M2 can be implemented while source APIs are being prepared. M3 needs the D4/S3 financial handoffs to verify real integrations. D5/S4 supply analytics; unavailable provider access should remain visibly unavailable. M4's real-data reconciliation gate must pass before imported financial totals are labelled verified. No agents or implementations were started by creating this pack.

## Which project owns what

| Project to open | Actual implementation locations | Responsibility |
|---|---|---|
| `/Volumes/RomanSSD/Developer/doppler` | `doppler-admin` local UI; one verified backend/service host selected in D1; `doppler-web` payment/GA/GSC evidence and source-owned Supabase where applicable | Doppler money, local expenses, subscriptions, provider imports, analytics and read-only export API. No native-client changes planned. |
| `/Volumes/RomanSSD/Developer/smsapp` | `landing` admin + server API; `sms-expo/supabase` reporting SQL/migrations, after verifying ownership | Wrap existing USD money SQL, preserve MFA/legacy formulas, add supplier/cost/expense reporting, analytics and export API. No mobile app changes planned. |
| `/Volumes/RomanSSD/Developer/simnetiq.store` | This Next.js project and dedicated Business OS database configuration | Shared contract, owner identity, scheduled pulls, journal/consolidation, GBP valuation, dashboard + Telegram, shared expenses, documents, registry, deadlines and reports. |

If your editor opens individual Git repositories rather than their parent folder, D1 must record which Doppler repository hosts the service and how its admin consumes it. SMS steps may require opening both landing and sms-expo for their explicitly scoped changes. Inspect nested AGENTS.md and repository boundaries before edits; a parent folder is not assumed to be one deployable app.

## Prompts by project

Files sort as C0 (shared contract), 10–14 (Doppler), 20–23 (SMS), 30–36 (main Simnetiq dashboard). These filename prefixes are project groups, not a continuous execution counter.

| Step | Prompt | Prerequisites |
|---|---|---|
| C0 | [Freeze the shared reporting contract](00-simnetiq-contract-freeze.md) | None. Run this first, before either source implementation. |
| D1 | [Doppler reporting service and canonical history](10-doppler-reporting-foundation.md) | C0 completed; shared contract artifacts available. |
| D2 | [Doppler Money page, expenses and settlement reconciliation](11-doppler-money-expenses-settlements.md) | D1 completed. |
| D3 | [Doppler subscription and operational metrics](12-doppler-subscriptions-operations.md) | D1 completed; D2 recommended before local UI integration. |
| D4 | [Doppler read-only Business OS API](13-doppler-secure-export-api.md) | D1–D3 completed; C0 conformance artifacts pinned. |
| D5 | [Doppler analytics collectors and final source handoff](14-doppler-analytics-and-handoff.md) | D4 completed. |
| S1 | [SMS frozen legacy reporting service](20-sms-legacy-reporting-foundation.md) | C0 completed; shared contract artifacts available. |
| S2 | [SMS supplier economics, local expenses and reconciliation](21-sms-costs-expenses-reconciliation.md) | S1 completed. |
| S3 | [SMS read-only Business OS API](22-sms-secure-export-api.md) | S1–S2 completed; C0 conformance artifacts pinned. |
| S4 | [SMS analytics collectors and final source handoff](23-sms-analytics-and-handoff.md) | S3 completed. |
| M1 | [Simnetiq private dashboard and identity foundation](30-simnetiq-identity-foundation.md) | C0 completed. This can be done before source deployments; the simple README order runs it after source work. |
| M2 | [Central journal, FX and shared expense ownership](31-simnetiq-finance-core.md) | M1 and C0 completed. |
| M3 | [Scheduled project pulls and revision-safe ingestion](32-simnetiq-project-pull-connectors.md) | M2 completed; D4 and S3 source handoff required for actual source integration. D5/S4 required for configured analytics. |
| M4 | [Shadow reconciliation and consolidated reporting](33-simnetiq-reconciliation-and-consolidation.md) | M3 completed; source financial handoffs and frozen native fixtures available. |
| M5 | [Main dashboard and responsive Telegram workspace](34-simnetiq-dashboard-and-telegram.md) | M1–M4 completed; D5/S4 needed for real analytics. Financial UI may ship with honest analytics-unavailable states. |
| M6 | [Private documents, business registry and deadlines](35-simnetiq-documents-registry-reminders.md) | M5 completed. |
| M7 | [End-to-end verification and release runbook](36-simnetiq-release-verification.md) | M1–M6 and both source handoffs completed; optional provider gaps explicitly declared. |

## What the owner needs to configure

Supply non-secret project identifiers and policy choices through the relevant step; credentials only through server environment/secret manager. These inputs are not all prerequisites for starting local implementation.

| Needed by | Inputs / evidence |
|---|---|
| C0 / M2 | Reporting timezone (Europe/London proposed), recognition basis, FX source/date/version policy, VAT/fiscal settings, allocation policy, history/opening-balance dates. No assumed tax rates. |
| D1–D4 | Existing RevenueCat/Revolut/OxaPay source access, app/store/account mapping, actual historical transactions/fees/refunds; project costs/receipts and settlement statements. |
| S1–S3 | SMS current SQL/ledger access, RevenueCat-to-ledger mapping, OnlineSim cost/top-up/balance evidence, project costs and settlement statements. |
| D5 / S4 | GA property ID/timezone and read access; exact GSC property and read access; optional Vercel project/team/plan eligibility and Drain credentials. |
| M1 | Dedicated Business OS Supabase target and approved owner identity; dedicated Telegram bot/domain/owner numeric ID configured privately. |
| M3 | Deployed source HTTPS base URLs, source handoffs, scoped export credentials, rates/limits and versions. |
| M6 / M7 | Owner-verified legal/service dates, reminder recipient/preferences, staging access, backup/restore target and release evidence. |

## Coverage and release boundaries

| Required function group | Source steps | Central steps |
|---|---|---|
| Sales/refunds/fees/tax/proceeds, revisions and backfill | D1/D4; S1/S3 | M2/M3/M4 |
| Local expenses/manual income, costs, receipts, cash/settlements | D2; S2 | M2/M4/M6 (central-owned entries + read-only source views) |
| Subscriptions/MRR and delivery/coin economics | D3; S1/S2 | M3/M5; no SMS MRR |
| GA/GSC and optional Vercel collection | D5; S4 | M3/M5 (consume only) |
| Authentication, versioned API and durable health | D4/D5; S3/S4 | C0/M1/M3/M7 |
| Company expenses, allocation and consolidated journal | Source facts only | M2/M4/M5 |
| Web dashboard + Telegram Mini App | Local admins in D2/S1/S2 | M1/M5/M6 |
| Documents, business registry, deadlines/reminders | Redacted source document references | M6 |
| Reconciliation, reports, staging and release | Each source handoff | M4/M5/M7 |

Acceptance requires source-admin/API equality at fixed cutoff, SMS native-USD legacy parity, source/central native parity, matching-policy GBP parity and deduplication/correction/security tests. Missing or estimated data remains labelled. Real bank cash requires settlement/statement evidence. Successful mocked tests alone do not establish production readiness.

Deferred: project-to-central change notifications, cross-system expense editing, optional GSC URL Inspection, OCR/full-text receipt search, PDF reporting and advanced CAC/LTV. No redundant central polling of source GA/RevenueCat accounts; corporate Simnetiq website analytics are separate and not required by this pack.
