import "server-only";
import { cookies } from "next/headers";
import { createPublishableClient, createSecretClient, createUserClient } from "@/lib/business-os/db/client";
import { BusinessOsUnconfiguredError, requireBusinessOsConfig } from "@/lib/business-os/env";
import {
  assuranceFromAccessToken,
  profileFromMembership,
  type IdentityProfile,
  type IdentityProject,
} from "@/lib/business-os/auth/authorize";
import { ACCESS_COOKIE, SESSION_COOKIE } from "@/lib/business-os/auth/cookies";

export type IdentityLoad =
  | { kind: "anonymous" }
  | { kind: "denied" }
  | { kind: "ready"; profile: IdentityProfile };

type MembershipRow = {
  organization_id: string;
  role: string;
  revoked_at: string | null;
};

export async function loadIdentity(): Promise<IdentityLoad> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return { kind: "anonymous" };

  let config;
  try {
    config = requireBusinessOsConfig();
  } catch (error) {
    if (error instanceof BusinessOsUnconfiguredError) throw error;
    throw error;
  }

  const userClient = createUserClient(accessToken, config);
  const userResult = await userClient.auth.getUser(accessToken);
  if (userResult.error || !userResult.data.user) return { kind: "anonymous" };

  const userId = userResult.data.user.id;
  const db = userClient.schema("business_os");
  const membershipResult = await db
    .from("memberships")
    .select("organization_id, role, revoked_at")
    .eq("user_id", userId)
    .limit(1);
  if (membershipResult.error) return { kind: "denied" };
  const membership = (membershipResult.data?.[0] ?? null) as MembershipRow | null;
  if (!membership) return { kind: "denied" };

  const organizationResult = await db
    .from("organizations")
    .select("slug")
    .eq("id", membership.organization_id)
    .limit(1);
  const organizationSlug = organizationResult.data?.[0]?.slug;
  if (typeof organizationSlug !== "string") return { kind: "denied" };

  const projectResult = await db.from("projects").select("slug, name, state, reporting_enabled");
  const projects: IdentityProject[] = (projectResult.data ?? []).map((row) => ({
    slug: String(row.slug),
    name: String(row.name),
    state: String(row.state),
    reportingEnabled: Boolean(row.reporting_enabled),
  }));

  const telegramResult = await db
    .from("telegram_identities")
    .select("id")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(1);

  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return { kind: "denied" };

  const profile = profileFromMembership({
    userId,
    organizationId: membership.organization_id,
    organizationSlug,
    role: membership.role,
    revokedAt: membership.revoked_at,
    assurance: assuranceFromAccessToken(accessToken),
    telegramLinked: (telegramResult.data?.length ?? 0) > 0,
    sessionId,
    projects,
  });
  if (!profile) return { kind: "denied" };
  return { kind: "ready", profile };
}

export async function findLinkedMember(telegramUserId: number, botId: string): Promise<{ userId: string; email: string } | null> {
  const admin = createSecretClient();
  const resolved = await admin.schema("business_os").rpc("resolve_telegram_member", {
    lookup_bot_id: botId,
    lookup_telegram_user_id: telegramUserId,
  });
  if (resolved.error || typeof resolved.data !== "string") return null;
  const user = await admin.auth.admin.getUserById(resolved.data);
  const email = user.data.user?.email;
  if (user.error || !email || !user.data.user?.email_confirmed_at) return null;
  if (user.data.user.id !== resolved.data) return null;
  return { userId: user.data.user.id, email };
}

export async function mintBrokerSession(email: string, expectedUserId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
} | null> {
  const admin = createSecretClient();
  const publisher = createPublishableClient();
  const linked = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hashedToken = linked.data?.properties?.hashed_token;
  if (linked.error || !hashedToken || linked.data.user?.id !== expectedUserId) return null;
  const verified = await publisher.auth.verifyOtp({ token_hash: hashedToken, type: "email" });
  const session = verified.data.session;
  if (verified.error || !session || verified.data.user?.id !== expectedUserId) return null;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: verified.data.user.id,
  };
}
