import { NextResponse } from "next/server";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";

export async function GET() {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const profile = identity.profile;
    return NextResponse.json({
      profile: {
        userId: profile.userId,
        organizationId: profile.organizationId,
        organizationSlug: profile.organizationSlug,
        role: profile.role,
        assurance: profile.assurance,
        telegramLinked: profile.telegramLinked,
        projects: profile.projects,
      },
    });
  } catch (error) {
    return mapAuthError(error);
  }
}
