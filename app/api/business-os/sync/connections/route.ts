import { NextRequest, NextResponse } from "next/server";
import { assertOwner, assertStepUp } from "@/lib/business-os/auth/authorize";
import { gateWrite, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { createSecretClient, createUserClient } from "@/lib/business-os/db/client";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import { isUuid } from "@/lib/business-os/finance/body";

const ENVIRONMENTS = new Set(["production", "staging", "test"]);
const SECRET_NAME = /^[A-Z][A-Z0-9_]{2,64}$/;
const KEY_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export async function GET() {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const { cookies } = await import("next/headers");
    const access = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!access) return jsonError("unauthenticated", 401);
    const rows = await createUserClient(access)
      .schema("business_os")
      .from("source_connections")
      .select("id, project_id, environment, source_environment, base_url, key_id, secret_reference, enabled, enabled_datasets");
    if (rows.error) return jsonError("unavailable", 500);
    return NextResponse.json({ connections: rows.data ?? [] });
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "sync");
  if (blocked) return blocked;
  let body: {
    projectSlug?: unknown;
    environment?: unknown;
    baseUrl?: unknown;
    keyId?: unknown;
    secretReference?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (
    typeof body.projectSlug !== "string" ||
    typeof body.environment !== "string" ||
    !ENVIRONMENTS.has(body.environment) ||
    typeof body.baseUrl !== "string" ||
    typeof body.keyId !== "string" ||
    !KEY_ID.test(body.keyId) ||
    typeof body.secretReference !== "string" ||
    !SECRET_NAME.test(body.secretReference)
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
    if (project.error || !isUuid(projectId)) return jsonError("not_found", 404);
    const saved = await createSecretClient().schema("business_os").rpc("register_source_connection", {
      actor_id: identity.profile.userId,
      target_project_id: projectId,
      target_source_environment: body.environment,
      target_base_url: body.baseUrl,
      target_key_id: body.keyId,
      target_secret_reference: body.secretReference,
    });
    const failure = mapRpcError(saved.error);
    if (failure) return failure;
    return NextResponse.json({ id: saved.data });
  } catch (error) {
    return mapAuthError(error);
  }
}
