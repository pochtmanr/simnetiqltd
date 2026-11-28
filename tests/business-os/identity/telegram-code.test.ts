import assert from "node:assert/strict";
import test from "node:test";
import { assertStepUp } from "@/lib/business-os/auth/authorize";
import {
  CODE_TTL_MS,
  deviceHash,
  generateCode,
  newDeviceId,
  sendTelegramCode,
  signCodeTicket,
  signStepUp,
  STEP_UP_TTL_MS,
  stepUpExpiry,
  stepUpKey,
  verifyCodeTicket,
} from "@/lib/business-os/auth/telegram-code";

const NOW = 1_700_000_000_000;
const key = stepUpKey("123456:test-token");
const binding = { userId: "user-1", sessionId: "session-a", nowMs: NOW, key };

test("codes are six digits", () => {
  for (let i = 0; i < 200; i += 1) assert.match(generateCode(), /^\d{6}$/);
});

test("a code ticket accepts the right code only, for the same user and session, before it expires", () => {
  const ticket = signCodeTicket("012345", binding);
  assert.equal(verifyCodeTicket(ticket, "012345", binding), "ok");
  assert.equal(verifyCodeTicket(ticket, "012346", binding), "code_invalid");
  assert.equal(verifyCodeTicket(ticket, "12345", binding), "code_invalid");
  assert.equal(verifyCodeTicket(ticket, "012345", { ...binding, userId: "user-2" }), "code_invalid");
  assert.equal(verifyCodeTicket(ticket, "012345", { ...binding, sessionId: "session-b" }), "code_invalid");
  assert.equal(verifyCodeTicket(ticket, "012345", { ...binding, key: stepUpKey("other") }), "code_invalid");
  assert.equal(verifyCodeTicket(ticket, "012345", { ...binding, nowMs: NOW + CODE_TTL_MS }), "code_expired");
  assert.equal(verifyCodeTicket(undefined, "012345", binding), "code_expired");
  const [, sig] = ticket.split(".");
  assert.equal(verifyCodeTicket(`${NOW + 10 * CODE_TTL_MS}.${sig}`, "012345", binding), "code_invalid");
});

test("a step-up cookie is bound to the user and the browser and lasts thirty days", () => {
  const device = { userId: "user-1", deviceId: "device-a", nowMs: NOW, key };
  const stepUp = signStepUp(device);
  assert.equal(STEP_UP_TTL_MS, 30 * 24 * 60 * 60 * 1000);
  assert.equal(stepUp.expiresAt, NOW + STEP_UP_TTL_MS);
  assert.equal(stepUpExpiry(stepUp.value, device), stepUp.expiresAt);
  assert.equal(stepUpExpiry(stepUp.value, { ...device, nowMs: NOW + STEP_UP_TTL_MS - 1 }), stepUp.expiresAt);
  assert.equal(stepUpExpiry(stepUp.value, { ...device, nowMs: NOW + STEP_UP_TTL_MS }), null);
  assert.equal(stepUpExpiry(stepUp.value, { ...device, userId: "user-2" }), null);
  assert.equal(stepUpExpiry(stepUp.value, { ...device, deviceId: "device-b" }), null);
  assert.equal(stepUpExpiry(undefined, device), null);
  assert.equal(stepUpExpiry("garbage", device), null);
  // A code ticket is not a step-up cookie, even when the session id equals the device id.
  assert.equal(stepUpExpiry(signCodeTicket("012345", { ...binding, sessionId: "device-a" }), device), null);
});

test("a device id is random and only its hash is stored", () => {
  assert.notEqual(newDeviceId(), newDeviceId());
  assert.match(deviceHash(newDeviceId()), /^[a-f0-9]{64}$/);
  assert.equal(deviceHash("a"), deviceHash("a"));
});

test("the step-up key is not Telegram's init-data key", () => {
  assert.notDeepEqual(stepUpKey("t"), stepUpKey("u"));
  assert.equal(stepUpKey("t").length, 32);
});

test("assertStepUp enforces AAL2 again", () => {
  assert.throws(() => assertStepUp("aal1"), /step_up_required/);
  assert.doesNotThrow(() => assertStepUp("aal2"));
});

test("the code goes to sendMessage with the given chat id", async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  const sent = { botToken: "BOT", chatId: "218545546", code: "654321", label: "Delete <b>x</b>.pdf", fetchImpl: fakeFetch };
  assert.equal(await sendTelegramCode({ ...sent, approveUrl: "https://example.test/tg/approve?r=1" }), true);
  assert.equal(calls[0].url, "https://api.telegram.org/botBOT/sendMessage");
  assert.equal(calls[0].body.chat_id, "218545546");
  assert.equal(calls[0].body.parse_mode, "HTML");
  assert.match(String(calls[0].body.text), /<code>654321<\/code>[\s\S]*expires in 5 minutes/);
  // The label is the browser's words: it must not be able to inject markup.
  assert.match(String(calls[0].body.text), /Delete &lt;b&gt;x&lt;\/b&gt;\.pdf/);
  const buttons = (calls[0].body.reply_markup as { inline_keyboard: { text: string; web_app: { url: string } }[][] }).inline_keyboard[0];
  assert.deepEqual(buttons.map((button) => [button.text, button.web_app.url]), [
    ["Approve", "https://example.test/tg/approve?r=1"],
    ["Not me", "https://example.test/tg/approve?r=1&d=1"],
  ]);
  assert.equal(await sendTelegramCode(sent), true);
  assert.equal(calls[1].body.reply_markup, undefined);

  const refused = (async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
  assert.equal(await sendTelegramCode({ botToken: "BOT", chatId: "1", code: "1", label: "x", fetchImpl: refused }), false);
  const offline = (async () => {
    throw new Error("offline");
  }) as unknown as typeof fetch;
  assert.equal(await sendTelegramCode({ botToken: "BOT", chatId: "1", code: "1", label: "x", fetchImpl: offline }), false);
});
