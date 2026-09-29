import { NextRequest, NextResponse } from "next/server";
import { assertOwner, assertStepUp } from "@/lib/business-os/auth/authorize";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import { gateWrite, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { createSecretClient, createUserClient } from "@/lib/business-os/db/client";

export async function GET() {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const { cookies } = await import("next/headers");
    const access = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!access) return jsonError("unauthenticated", 401);
    const rows = await createUserClient(access)
      .schema("business_os")
      .from("integration_configs")
      .select("id, provider, environment, secret_reference, project_id");
    if (rows.error) return jsonError("unavailable", 500);
    return NextResponse.json({ configs: rows.data ?? [] });
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "integration");
  if (blocked) return blocked;
  let body: { projectSlug?: unknown; provider?: unknown; environment?: unknown; secretReference?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (
    typeof body.projectSlug !== "string" ||
    typeof body.provider !== "string" ||
    typeof body.environment !== "string" ||
    typeof body.secretReference !== "string"
  ) {
    return jsonError("invalid_body", 400);
  }
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    assertOwner(identity.profile.role);
    assertStepUp(identity.profile.assurance);
    const { cookies } = await import("next/headers");
    const access = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!access) return jsonError("unauthenticated", 401);
    const project = await createUserClient(access)
      .schema("business_os")
      .from("projects")
      .select("id")
      .eq("slug", body.projectSlug)
      .limit(1);
    const projectId = project.data?.[0]?.id;
    if (project.error || typeof projectId !== "string") return jsonError("not_found", 404);
    const saved = await createSecretClient().schema("business_os").rpc("upsert_integration_config", {
      actor_id: identity.profile.userId,
      target_project_id: projectId,
      target_provider: body.provider,
      target_environment: body.environment,
      target_secret_reference: body.secretReference,
    });
    const failure = mapRpcError(saved.error);
    if (failure) return failure;
    return NextResponse.json({ id: saved.data });
  } catch (error) {
    return mapAuthError(error);
  }
}
