import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { assertOwner, assertStepUp, type Assurance, type Role } from "@/lib/business-os/auth/authorize";
import { validateInitData, type ValidInitData } from "@/lib/business-os/auth/telegram-init-data";

export type ExchangeResult =
  | { status: "invalid_init_data" }
  | { status: "broker_unavailable" }
  | { status: "unlinked" }
  | { status: "replayed" }
  | { status: "inactive" }
  | { status: "identity_mismatch"; sessionId: string }
  | { status: "session"; accessToken: string; refreshToken: string; userId: string; sessionId: string };

export type LinkedMember = { userId: string; email: string };

export async function exchangeTelegramSession(input: {
  rawInitData: string;
  botToken: string;
  nowMs: number;
  sessionId: string | null;
  brokerEnabled: boolean;
  findMember: (telegramUserId: number, init: ValidInitData) => Promise<LinkedMember | null>;
  consume: (input: { userId: string; initDataHash: string; sessionId: string }) => Promise<"consumed" | "replayed" | "inactive">;
  mint: (email: string, expectedUserId: string) => Promise<{ accessToken: string; refreshToken: string; userId: string } | null>;
}): Promise<ExchangeResult> {
  const validated = validateInitData(input.rawInitData, input.botToken, input.nowMs);
  if (!validated.ok) return { status: "invalid_init_data" };
  if (!input.brokerEnabled) return { status: "broker_unavailable" };

  const member = await input.findMember(validated.data.telegramUserId, validated.data);
  if (!member?.email) return { status: "unlinked" };

  const sessionId = input.sessionId ?? crypto.randomUUID();
  const consumed = await input.consume({
    userId: member.userId,
    initDataHash: validated.data.fingerprint,
    sessionId,
  });
  if (consumed === "replayed") return { status: "replayed" };
  if (consumed === "inactive") return { status: "inactive" };

  const minted = await input.mint(member.email, member.userId);
  if (!minted || minted.userId !== member.userId) return { status: "identity_mismatch", sessionId };
  return {
    status: "session",
    accessToken: minted.accessToken,
    refreshToken: minted.refreshToken,
    userId: minted.userId,
    sessionId,
  };
}

export type LinkResult =
  | { status: "step_up_required" }
  | { status: "forbidden" }
  | { status: "invalid_init_data" }
  | { status: "linked" };

export async function linkTelegramIdentity(input: {
  actor: { userId: string; role: Role; assurance: Assurance; sessionId: string };
  rawInitData: string;
  botToken: string;
  botId: string;
  nowMs: number;
  createChallenge: (input: {
    actorId: string;
    tokenHash: string;
    boundSessionId: string;
    expiresAt: string;
  }) => Promise<string>;
  consumeChallenge: (input: {
    actorId: string;
    challengeId: string;
    tokenHash: string;
    boundSessionId: string;
    botId: string;
    telegramUserId: number;
    telegramUsername: string | null;
  }) => Promise<void>;
}): Promise<LinkResult> {
  try {
    assertOwner(input.actor.role);
    assertStepUp(input.actor.assurance);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "step_up_required") return { status: "step_up_required" };
    return { status: "forbidden" };
  }

  const validated = validateInitData(input.rawInitData, input.botToken, input.nowMs);
  if (!validated.ok) return { status: "invalid_init_data" };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(input.nowMs + 5 * 60 * 1000).toISOString();
  const challengeId = await input.createChallenge({
    actorId: input.actor.userId,
    tokenHash,
    boundSessionId: input.actor.sessionId,
    expiresAt,
  });
  await input.consumeChallenge({
    actorId: input.actor.userId,
    challengeId,
    tokenHash,
    boundSessionId: input.actor.sessionId,
    botId: input.botId,
    telegramUserId: validated.data.telegramUserId,
    telegramUsername: validated.data.username,
  });
  return { status: "linked" };
}
