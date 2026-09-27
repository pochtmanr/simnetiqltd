import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
function loadRoute(path, overrides = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const dependencies = {
    'next/server': { NextResponse: Object.assign(Response, { redirect: (url) => new Response(null, { status: 307, headers: { location: url } }) }) },
    '@/lib/rate-limit': { rateLimit: () => true },
    '@/lib/i18n': { isLocale: (locale) => ['en', 'he', 'ru'].includes(locale) },
    '@/lib/site': { SITE_URL: 'https://example.test' },
    '@/lib/subscribe-email': { renderConfirmEmail: (props) => ({ subject: 'Confirm', text: props.confirmUrl }) },
    '@/lib/smtp': { sendEmailTo: async () => {} },
    ...overrides,
  };
  vm.runInNewContext(source, {
    exports, require: (name) => dependencies[name] ?? nativeRequire(name),
    URL, Response, console: { error() {} }, process,
  }, { filename: path });
  return exports;
}
function database(results) {
  const calls = [];
  const client = { from(table) {
    const call = { table, filters: [] }; calls.push(call);
    const query = {
      select() { return query; },
      eq(key, value) { call.filters.push([key, value]); return query; },
      update(value) { call.update = value; return query; },
      insert(value) { call.insert = value; return query; },
      maybeSingle: async () => results.shift(),
      single: async () => results.shift(),
      then(resolve, reject) { return Promise.resolve(results.shift()).then(resolve, reject); },
    };
    return query;
  } };
  return { calls, dependency: { getServiceSupabase: () => client } };
}
const subscribeRequest = (body) => new Request('https://example.test/api/subscribe', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const input = { email: 'person@example.test', consent: true, locale: 'he' };

test('subscribe requires explicit consent and rejects null JSON before touching the database', async () => {
  const route = loadRoute('app/api/subscribe/route.ts', { '@/lib/supabase': { getServiceSupabase: () => { throw new Error('must not access'); } } });
  assert.equal((await route.POST(subscribeRequest({ email: input.email }))).status, 400);
  assert.equal((await route.POST(subscribeRequest(null))).status, 400);
});

test('already confirmed subscribers receive the same success contract', async () => {
  const db = database([{ data: { status: 'confirmed' } }]);
  const route = loadRoute('app/api/subscribe/route.ts', { '@/lib/supabase': db.dependency });
  const response = await route.POST(subscribeRequest(input));
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(db.calls.length, 1);
});

test('resubscription rotates confirmation token and emails the real localized API URL', async () => {
  const db = database([
    { data: { id: 'contact', status: 'unsubscribed', confirmation_token: 'old' } },
    { data: { confirmation_token: 'new', unsubscribe_token: 'unsubscribe', name: null } },
  ]);
  let sent;
  const route = loadRoute('app/api/subscribe/route.ts', {
    '@/lib/supabase': db.dependency,
    '@/lib/smtp': { sendEmailTo: async (mail) => { sent = mail; } },
  });
  assert.equal((await route.POST(subscribeRequest(input))).status, 200);
  assert.notEqual(db.calls[1].update.confirmation_token, 'old');
  assert.match(db.calls[1].update.confirmation_token, /^[a-f0-9-]{36}$/);
  assert.equal(db.calls[1].update.confirmed_at, null);
  assert.equal(sent.text, 'https://example.test/api/subscribe/confirm?token=new&locale=he');
});

test('SMTP and missing database configuration failures return a retryable response', async () => {
  const db = database([{ data: null }, { data: { confirmation_token: 'new', unsubscribe_token: 'out' } }]);
  const smtpFailure = loadRoute('app/api/subscribe/route.ts', {
    '@/lib/supabase': db.dependency,
    '@/lib/smtp': { sendEmailTo: async () => { throw new Error('SMTP unavailable'); } },
  });
  assert.equal((await smtpFailure.POST(subscribeRequest(input))).status, 503);
  const noConfig = { getServiceSupabase: () => { throw new Error('Not configured'); } };
  const route = loadRoute('app/api/subscribe/route.ts', { '@/lib/supabase': noConfig });
  assert.equal((await route.POST(subscribeRequest(input))).status, 503);
});

test('confirmation update is conditional on the same token and pending status', async () => {
  const db = database([{ data: { id: 'contact', status: 'pending' } }, { data: null }]);
  const route = loadRoute('app/api/subscribe/confirm/route.ts', { '@/lib/supabase': db.dependency });
  const response = await route.GET(new Request('https://example.test/api/subscribe/confirm?token=old&locale=ru'));
  assert.equal(response.headers.get('location'), 'https://example.test/ru/subscribe?confirmed=error');
  assert.deepEqual(db.calls[1].filters, [['id', 'contact'], ['confirmation_token', 'old'], ['status', 'pending']]);
});

test('newsletter RFC 8058 POST accepts token from query while GET does not mutate', async () => {
  const db = database([{ data: { id: 'contact', status: 'confirmed' } }, { error: null }]);
  const route = loadRoute('app/api/unsubscribe/route.ts', { '@/lib/supabase': db.dependency });
  const url = 'https://example.test/api/unsubscribe?token=unsub-token';
  assert.equal((await route.GET(new Request(url))).status, 307);
  assert.equal(db.calls.length, 0);
  const response = await route.POST(new Request(url, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click',
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(db.calls[0].filters, [['unsubscribe_token', 'unsub-token']]);
  assert.equal(db.calls[1].update.status, 'unsubscribed');
});
