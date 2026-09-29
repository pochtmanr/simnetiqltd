import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { profileFromMembership } from "@/lib/business-os/auth/authorize";
import { exchangeTelegramSession, linkTelegramIdentity } from "@/lib/business-os/auth/telegram-exchange";

const BOT = "123456:test-token";
const NOW = 1_700_000_100_000;

function initData(id = 42): string {
  const fields = {
    auth_date: String(Math.floor(NOW / 1000) - 5),
    user: JSON.stringify({ id, username: "owner" }),
  };
  const dataCheck = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key as keyof typeof fields]}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(BOT).digest();
  const hash = createHmac("sha256", secret).update(dataCheck).digest("hex");
  return `auth_date=${fields.auth_date}&user=${encodeURIComponent(fields.user)}&hash=${hash}`;
}

test("broker stays off until enabled and does not mint a session", async () => {
  let calls = 0;
  const result = await exchangeTelegramSession({
    rawInitData: initData(),
    botToken: BOT,
    nowMs: NOW,
    sessionId: "session-a",
    brokerEnabled: false,
    findMember: async () => {
      calls += 1;
      return { userId: "user-1", email: "owner@example.test" };
    },
    consume: async () => {
      calls += 1;
      return "consumed";
    },
    mint: async () => {
      calls += 1;
      return null;
    },
  });
  assert.equal(result.status, "broker_unavailable");
  assert.equal(calls, 0);
});

test("exchange mints only the stored member and rejects a mismatched user", async () => {
  const minted: string[] = [];
  const ok = await exchangeTelegramSession({
    rawInitData: initData(),
    botToken: BOT,
    nowMs: NOW,
    sessionId: "session-a",
    brokerEnabled: true,
    findMember: async () => ({ userId: "user-1", email: "stored@example.test" }),
    consume: async () => "consumed",
    mint: async (email, expectedUserId) => {
      minted.push(`${email}:${expectedUserId}`);
      return { accessToken: "access", refreshToken: "refresh", userId: expectedUserId };
    },
  });
  assert.equal(ok.status, "session");
  assert.deepEqual(minted, ["stored@example.test:user-1"]);

  const mismatch = await exchangeTelegramSession({
    rawInitData: initData(),
    botToken: BOT,
    nowMs: NOW,
    sessionId: "session-a",
    brokerEnabled: true,
    findMember: async () => ({ userId: "user-1", email: "stored@example.test" }),
    consume: async () => "consumed",
    mint: async () => ({ accessToken: "access", refreshToken: "refresh", userId: "someone-else" }),
  });
  assert.equal(mismatch.status, "identity_mismatch");
});

test("a second session cannot replay initData, and an unlinked id is refused", async () => {
  const replayed = await exchangeTelegramSession({
    rawInitData: initData(),
    botToken: BOT,
    nowMs: NOW,
    sessionId: "session-b",
    brokerEnabled: true,
    findMember: async () => ({ userId: "user-1", email: "stored@example.test" }),
    consume: async () => "replayed",
    mint: async () => {
      throw new Error("mint should not run");
    },
  });
  assert.equal(replayed.status, "replayed");

  const unlinked = await exchangeTelegramSession({
    rawInitData: initData(99),
    botToken: BOT,
    nowMs: NOW,
    sessionId: "session-a",
    brokerEnabled: true,
    findMember: async () => null,
    consume: async () => {
      throw new Error("consume should not run");
    },
    mint: async () => null,
  });
  assert.equal(unlinked.status, "unlinked");
});

test("linking requires an owner AAL2 session and does not run before that", async () => {
  let created = 0;
  const stepUp = await linkTelegramIdentity({
    actor: { userId: "user-1", role: "owner", assurance: "aal1", sessionId: "session-a" },
    rawInitData: initData(),
    botToken: BOT,
    botId: "123456",
    nowMs: NOW,
    createChallenge: async () => {
      created += 1;
      return "challenge";
    },
    consumeChallenge: async () => undefined,
  });
  assert.equal(stepUp.status, "step_up_required");
  assert.equal(created, 0);

  const linked = await linkTelegramIdentity({
    actor: { userId: "user-1", role: "owner", assurance: "aal2", sessionId: "session-a" },
    rawInitData: initData(),
    botToken: BOT,
    botId: "123456",
    nowMs: NOW,
    createChallenge: async () => "challenge",
    consumeChallenge: async () => undefined,
  });
  assert.equal(linked.status, "linked");
});

test("a revoked membership does not become a profile", () => {
  assert.equal(
    profileFromMembership({
      userId: "user-1",
      organizationId: "org-1",
      organizationSlug: "simnetiq",
      role: "owner",
      revokedAt: "2026-09-29T00:00:00Z",
      assurance: "aal2",
      telegramLinked: true,
      sessionId: "session-a",
      projects: [],
    }),
    null,
  );
});
