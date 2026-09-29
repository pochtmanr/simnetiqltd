# M1 — Simnetiq private dashboard and identity foundation

- **Implement in:** Simnetiq main dashboard
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** C0 completed. This can be done before source deployments; the simple README order runs it after source work.
- **Scope:** Implement private web/Telegram foundation and database access. Preserve the existing public website.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Read BUSINESS_OS_ARCHITECTURE.md, DATABASE.md and SECURITY.md for the established owner-only scope, taking the two authoritative source documents first where they conflict. Inspect installed Next docs before editing route groups, layouts or proxy.ts.
2. Add a separate Business OS local database/migration configuration, organization, memberships and Doppler/SMS project registry. Keep marketing Supabase configuration intact. Confirm actual staging/production target before provisioning or applying remote migrations; local implementation can proceed without live access.
3. Create /admin, /tg and login private shells, keeping locale routing and public layouts/analytics separate. Add owner login/logout/session refresh and MFA, no public signup, server-owned owner/admin/read_only roles and session-bound RLS. Authorization belongs in every protected service/RPC, not only navigation/proxy.
4. Implement the early Telegram identity proof from SECURITY.md using a dedicated bot, MFA-authenticated linking, verified raw initData, freshness/future/replay checks and prelinked enabled members only. Validate any proposed generateLink/verifyOtp composition with current official APIs and real staging sessions; use ordinary Supabase login inside Telegram if the broker cannot be proven. Never treat Telegram proof as AAL2.
5. Test direct database authorization, private session cookies/CSRF, membership revocation and step-up for sensitive actions. Add integration configuration storing secret references only.
6. Establish migration ordering and C0 artifact ownership; source data starts unverified. Build only the shell and identity now, with shared web/mobile service boundaries for M5.

## Verification / done when

Owner browser and Telegram resolve to the same profile; anonymous/unlinked/revoked/replayed identities fail. Test read_only mutation rejection, direct REST/RPC/storage grants, refresh/logout, no client secrets, no private analytics/sitemap leakage and existing localized public flows. Actual Telegram staging proof is a separate gate from mocked tests.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
