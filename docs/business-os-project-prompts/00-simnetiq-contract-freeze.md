# C0 — Freeze the shared reporting contract

- **Implement in:** Simnetiq — contract ownership
- **Open project / working directory:** `/Volumes/RomanSSD/Developer/simnetiq.store`
- **Prerequisites:** None. Run this first, before either source implementation.
- **Scope:** Create executable contract artifacts and redacted fixtures, not the dashboard or provider integrations.

## Copy/paste prompt

Read these authoritative documents first (absolute paths work when this prompt is pasted into another project):
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_FUNCTION_MATRIX.md`
- `/Volumes/RomanSSD/Developer/simnetiq.store/docs/BUSINESS_OS_PROJECT_API_CONTRACT.md`

Read applicable AGENTS.md in every directory you touch. Before Next.js code, read relevant guides from that project's installed `node_modules/next/dist/docs/`; verify actual installed APIs if the documentation path differs. Inspect existing code/schema and keep edits scoped. Verify current official provider documentation when implementing external integrations. Do not assume audited paths or proposed endpoints are still current.

Architecture rules: each source project owns its financial calculations and provider imports; local admin and export call the same service. Simnetiq pulls versioned records and non-posting snapshots. Provider credentials stay source-side. Project expenses have one local write owner; company/shared expenses belong to Simnetiq. Money uses exact decimals; missing is null with a reason, never fabricated zero. Preserve source formulas/identity, payment fulfilment, authentication and public routes. Do not add a second push path or duplicate central provider polling. Secrets go through server configuration/secret managers, never docs/chat/fixtures. No destructive migrations.

Implement this step only, after inspecting the preceding handoff artifacts. Do not invent absent predecessor output. State a short implementation → verification plan, complete meaningful local work, and identify exact external configuration/evidence blockers separately. No autonomous delegation or cross-chat messages are requested. Keep changes in the stated project scope; shared contract changes go through C0 and require updating consumers/conformance artifacts.

## Work to implement

1. Inspect the two authoritative documents and current repository. Resolve schema gaps explicitly: record-type requirements and signs, summary envelopes, drill-through references, balance/operations/subscription shapes, analytics pagination and unsupported-dataset behavior. Freeze project IDs `doppler` and `smscode` consistently; document the mapping to the SMS Code product name. Do not treat proposed endpoints as existing.
2. Create versioned JSON Schemas/OpenAPI 3.1 and a small reusable conformance test corpus. Define decimal strings, fiat vs crypto, null reasons, quality and coverage independently, source provenance, economic transaction/component identity, revision/void behavior, and formula/FX policy versions. Describe how each project consumes the same immutable artifact version without inventing a package publishing platform.
3. Freeze all eleven GET endpoint contracts under `/api/business-os/v1`, including parameters, [from,to) UTC intervals, IANA daily grouping, supported basis enums, at most 366 days/500 records or advertised lower limits, and private caching. Define 400/403/410/422/429 with Retry-After/503 behavior and authentication failure responses. Explain partial daily buckets and non-additive balances.
4. Define cursor bootstrap, frozen high watermark, continuation, next-sync checkpoint, immutable change sequence for old-record corrections, query binding, expiry and resync. Specify cross-endpoint snapshot/cutoff behavior so UI, summaries and records can be compared reproducibly.
5. Specify exact HMAC encoding and test vectors: method, raw path+query, timestamp, nonce, SHA256 body, newline separators, signature encoding, empty GET body, clock skew, durable replay handling and retry with a fresh nonce. Include key rotation and credential-to-project/environment binding.
6. Record unresolved business inputs (timezone, VAT/fiscal settings, recognition and FX policy, history/opening balances) as explicit configuration gates. Europe/London is proposed, GBP is reporting currency. Freeze policy identifiers/interfaces without inventing tax rates or provider credentials. Produce synthetic edge cases and a procedure for obtaining redacted real fixtures.

## Verification / done when

Schemas validate positive fixtures and reject malformed money, inconsistent identity, unsupported basis and missing required provenance. Test vectors specify byte-for-byte signing inputs and outputs. Include sale/refund/reversal, duplicate aliases, component fee deduplication, correction/void, missing FX/tax, SMS legacy values and analytics grain cases. Document the artifact version/path to hand to D1 and S1. Contract fixtures alone are not production evidence.

## Required handoff

Write or update a step-specific handoff in this project's existing documentation area, naming this step ID. Include changed files, schema/migration/contract/formula versions, reproducible commands and actual test results, redacted evidence and residuals, exact configuration names still needed (no values), deployment/production verification status, and the next dependent step. Source handoffs must identify the actual API-host subproject and base URL when deployed. Distinguish implemented, locally tested, staging verified and production verified. End with a concise completion report; do not implement the next prompt automatically.
