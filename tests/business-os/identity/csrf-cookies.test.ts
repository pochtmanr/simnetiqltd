import assert from "node:assert/strict";
import test from "node:test";
import {
  accessCookiePolicy,
  csrfCookiePolicy,
  pendingCookiePolicy,
  refreshCookiePolicy,
  sessionCookiePolicy,
} from "@/lib/business-os/auth/cookies";
import { assertCsrf, CsrfError } from "@/lib/business-os/auth/csrf";

test("session cookies are httpOnly, lax, and the refresh token stays on auth routes", () => {
  const access = accessCookiePolicy(true);
  const refresh = refreshCookiePolicy(true);
  const session = sessionCookiePolicy(true);
  const pending = pendingCookiePolicy(true);
  const csrf = csrfCookiePolicy(true);
  for (const policy of [access, refresh, session, pending]) {
    assert.equal(policy.httpOnly, true);
    assert.equal(policy.secure, true);
    assert.equal(policy.sameSite, "lax");
  }
  assert.equal(access.path, "/");
  assert.equal(refresh.path, "/api/business-os/auth");
  assert.equal(pending.path, "/api/business-os/auth");
  assert.equal(csrf.httpOnly, false);
  assert.equal(csrf.path, "/");
});

test("writes require a matching origin and csrf token", () => {
  const headers = new Headers({ origin: "https://simnetiq.com", host: "simnetiq.com", "x-business-os-csrf": "token-value" });
  assert.doesNotThrow(() => assertCsrf(headers, "token-value"));
  assert.throws(() => assertCsrf(new Headers({ host: "simnetiq.com" }), "token-value"), CsrfError);
  assert.throws(
    () => assertCsrf(new Headers({ origin: "https://evil.test", host: "simnetiq.com", "x-business-os-csrf": "token-value" }), "token-value"),
    CsrfError,
  );
  assert.throws(() => assertCsrf(headers, "other-token"), CsrfError);
});
