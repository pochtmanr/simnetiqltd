# Business OS — security and identity design

Owner-only launch; prepare owner/admin/read_only policies with no public registration. Dedicated Simnetiq business bot. Source-product identities remain separate. User-facing admin authentication uses Supabase Auth; Telegram identity maps to the same existing central auth user.

## Telegram session proof of concept is an early gate

1. Owner signs into normal web admin and completes MFA to enroll/link the bot identity. A short-lived, single-use linking challenge connects a server-verified Telegram numeric ID to that exact existing auth user. Never link by Telegram username, supplied email or first visitor.
2. Mini App posts raw initData over HTTPS; validate with the dedicated bot's secret, using the exact Telegram algorithm and constant-time comparison. Reject malformed/duplicate critical fields, wrong bot/signature, non-integer IDs, missing/stale auth_date and future dates outside small clock skew. Proposed exchange age: five minutes. Never authorize from initDataUnsafe.
3. Atomically consume initData fingerprint/nonce for exchange, bound to the initiating secure browser session. Allow only safe same-session retry or require reopening; another client cannot reuse the payload to obtain a new session. Rate-limit exchange and linking server-side.
4. Resolve the pre-linked enabled member. No automatic user or owner creation. Exchange proof for a genuine Supabase session for that member; verify resulting user id and apply the same RLS as web login. Do not mint an arbitrary JWT or treat Telegram HMAC as a Supabase access token.
5. Proposed broker implementation to validate in staging: server-only Supabase Admin generateLink for the pre-linked, already confirmed user's stored email, then server-side verifyOtp on its returned token hash to establish a genuine session; keep link/hash hidden and never accept the email/user target from request data. This is a custom security-sensitive composition of documented primitives, not a built-in Telegram Mini App Supabase feature. Test creation-disabled behavior, concurrent exchange, refresh, revocation and MFA AAL semantics before approving this design. If the composition is unsuitable, use ordinary Supabase login within the Mini App as the explicit fallback and document the convenience limitation.
6. Telegram proof is not Supabase AAL2. Require separate Supabase MFA step-up for identity/role changes, integration settings, financial period reopen and other sensitive administration. Permit routine dashboard/expense operations according to explicit owner policy without falsely claiming MFA.

Use an HTTP-only secure same-origin session/BFF design; browser code calls application endpoints, and server session clients execute RLS queries. Validate session on protected operations, refresh safely, enforce expiry, membership revocation and logout. Origin/CSRF protections apply to writes; cookies have restrictive same-site behavior compatible with tested Telegram clients. Do not put initData/tokens in URLs, analytics or logs. Telegram Desktop/web embedding must be tested for cookie restrictions; do not solve it by exposing service-role tokens.

## Authorization matrix

| Operation | Owner | Admin (future) | Read-only (future) |
|---|---|---|---|
| View authorized reports and documents | Yes | Yes | Yes |
| Draft/post expenses and manual income | Yes | Yes | No |
| Correct posted entries with audit | Yes | Yes within policy | No |
| Change membership, bot links, secrets, reopen period | Yes + step-up | No | No |
| Delete/archive document metadata | Yes | Policy-scoped | No |

Never rely on hidden buttons, Proxy, or layout-only checks. All routes/actions/RPCs enforce authorization. RLS protects direct database access. Service-role keys only in ingestion/admin setup paths; never use them for ordinary user queries after a superficial UI gate. Security-definer exports are narrowly scoped and tested. Audit financial mutations atomically, including actor and reason; logs are append-only to ordinary roles.

## Documents, infrastructure and data controls

Private Supabase bucket, short-lived URLs, no public file list. MIME/size validation and safe previews; prohibit active HTML rendering; prepare scanning/quarantine as needed. Signed URLs are bearer access until expiry, so use brief TTL and avoid forwarding them into Telegram notifications. Notifications deep-link to authenticated documents instead.

Logs exclude secrets, raw initData, customer SMS content and payment PII. Configure retention per data class before launch; ledger/audit obligations depend on owner/accountant policy. Public analytics disabled entirely for private pages. Existing studio custom client-id tracking needs review before wider use. No passwords/seed phrases in business notes; secret references point to managed credentials.

Backups and tested restore, separate staging/production secrets, secret rotation, HTTPS and bot webhook-secret verification. No financial or document payloads in generic error monitoring. Integration errors surface enough context to repair without exposing secrets.

## Required tests

Forged/expired/future/wrong-bot/replayed initData; changed username with same ID; revoked membership; unauthorized link/relink; anonymous and read_only direct REST/RPC/storage writes; cross-record references; session expiry/refresh/logout; CSRF; step-up failure; service key absent from bundles; preview/production isolation; unauthorized signed URLs; notification recipient allowlist; public website routes unchanged.

References: [Telegram Mini Apps validation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app), [Supabase Auth](https://supabase.com/docs/guides/auth), [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Re-check current APIs when implementing; the broker still requires an end-to-end proof.
