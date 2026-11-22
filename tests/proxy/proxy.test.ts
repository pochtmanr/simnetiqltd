import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function run(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`https://simnetiq.com${path}`, { headers }));
}

// The proxy leaves a request to the router by returning nothing, or a
// pass-through response that carries no redirect.
function passesThrough(path: string) {
  const response = run(path);
  if (!response) return;
  assert.equal(response.status, 200, `${path} status`);
  assert.equal(response.headers.get("location"), null, `${path} location`);
}

test("proxy: known locale-prefixed paths pass through", () => {
  for (const path of ["/en", "/he/about", "/ru/projects/sms-code", "/en/services/markdown", "/en/legal/"]) {
    passesThrough(path);
  }
});

test("proxy: unknown locale-prefixed paths reach the router for a real 404", () => {
  for (const path of ["/en/nope-404", "/he/esim/israel", "/ru/services/nope/deeper"]) {
    passesThrough(path);
  }
});

test("proxy: unknown bare paths are not redirected to the home page", () => {
  for (const path of ["/nope-404", "/esim/israel", "/nope-404?utm_source=x"]) {
    passesThrough(path);
  }
  assert.equal(run("/nope-404")?.headers.get("set-cookie") ?? null, null);
});

test("proxy: the root gets a temporary locale redirect and the locale cookie", () => {
  const response = run("/", { "accept-language": "he-IL,he;q=0.9,en;q=0.8" });
  assert.equal(response?.status, 307);
  assert.equal(response?.headers.get("location"), "https://simnetiq.com/he");
  assert.match(response?.headers.get("set-cookie") ?? "", /NEXT_LOCALE=he/);
});

test("proxy: known bare paths keep their path and query on the locale redirect", () => {
  const response = run("/about?utm_source=x");
  assert.equal(response?.status, 307);
  assert.equal(response?.headers.get("location"), "https://simnetiq.com/en/about?utm_source=x");
});

test("proxy: an existing locale cookie wins and is not set again", () => {
  const response = run("/projects", { cookie: "NEXT_LOCALE=ru", "accept-language": "he" });
  assert.equal(response?.status, 307);
  assert.equal(response?.headers.get("location"), "https://simnetiq.com/ru/projects");
  assert.equal(response?.headers.get("set-cookie"), null);
});

test("proxy: private prefixes are left alone", () => {
  for (const path of ["/admin", "/tg", "/login", "/admin/notes"]) {
    passesThrough(path);
  }
});
