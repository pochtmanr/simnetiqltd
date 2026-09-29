import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { validateInitData } from "@/lib/business-os/auth/telegram-init-data";

const BOT = "123456:test-token";
const NOW = 1_700_000_100_000;

function sign(fields: Record<string, string>, token = BOT): string {
  const dataCheck = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(dataCheck).digest("hex");
  const encoded = Object.entries(fields)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `${encoded}&hash=${hash}`;
}

function userPayload(id: number, username: string) {
  return sign({
    auth_date: String(Math.floor(NOW / 1000) - 10),
    user: JSON.stringify({ id, username }),
  });
}

test("accepts a fresh initData payload and ignores username for identity", () => {
  const first = validateInitData(userPayload(42, "owner"), BOT, NOW);
  const renamed = validateInitData(userPayload(42, "renamed"), BOT, NOW);
  assert.equal(first.ok, true);
  assert.equal(renamed.ok, true);
  if (!first.ok || !renamed.ok) return;
  assert.equal(first.data.telegramUserId, 42);
  assert.equal(renamed.data.telegramUserId, 42);
  assert.equal(first.data.username, "owner");
  assert.equal(renamed.data.username, "renamed");
  assert.notEqual(first.data.fingerprint, renamed.data.fingerprint);
});

test("rejects forged, stale, future, wrong-bot, duplicate, and non-integer initData", () => {
  const valid = userPayload(7, "owner");
  assert.equal(validateInitData(`${valid}x`, BOT, NOW).ok, false);
  assert.equal(validateInitData(valid, "999:other-bot", NOW).ok, false);

  const stale = sign({
    auth_date: String(Math.floor(NOW / 1000) - 301),
    user: JSON.stringify({ id: 7 }),
  });
  assert.deepEqual(validateInitData(stale, BOT, NOW), { ok: false, reason: "stale" });

  const future = sign({
    auth_date: String(Math.floor(NOW / 1000) + 120),
    user: JSON.stringify({ id: 7 }),
  });
  assert.deepEqual(validateInitData(future, BOT, NOW), { ok: false, reason: "future" });

  const user = JSON.stringify({ id: 7 });
  const duplicate = sign({ auth_date: String(Math.floor(NOW / 1000)), user });
  const duplicated = `${duplicate}&user=${encodeURIComponent(user)}`;
  const duplicateResult = validateInitData(duplicated, BOT, NOW);
  assert.equal(duplicateResult.ok, false);
  if (!duplicateResult.ok) assert.equal(duplicateResult.reason, "duplicate_field");

  const stringId = sign({
    auth_date: String(Math.floor(NOW / 1000)),
    user: JSON.stringify({ id: "7" }),
  });
  assert.deepEqual(validateInitData(stringId, BOT, NOW), { ok: false, reason: "bad_user" });
  assert.equal(validateInitData("auth_date=1", BOT, NOW).ok, false);
});
