import { NextRequest, NextResponse } from "next/server";
import { assertOwner, assertStepUp } from "@/lib/business-os/auth/authorize";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import { gateWrite, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { createSecretClient } from "@/lib/business-os/db/client";
import { isUuid } from "@/lib/business-os/finance/body";
import { pullSigned } from "@/lib/business-os/sync/pull";
import { readSourceSecret } from "@/lib/business-os/sync/store";
import {
  datasetsFromCapabilities,
  pageLimit,
  preferredBasis,
  validateContract,
  type Capabilities,
} from "@/lib/business-os/sync/validate";

const INSTANT = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "sync");
  if (blocked) return blocked;
  let body: { connectionId?: unknown; initialFrom?: unknown; initialTo?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.connectionId) || typeof body.initialFrom !== "string" || typeof body.initialTo !== "string") {
    return jsonError("invalid_body", 400);
  }
  if (!INSTANT.test(body.initialFrom) || !INSTANT.test(body.initialTo) || body.initialFrom >= body.initialTo) {
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

    const secret = createSecretClient();
    const connection = await secret
      .schema("business_os")
      .from("source_connections")
      .select("id, project_id, source_environment, base_url, key_id, secret_reference")
      .eq("id", body.connectionId)
      .maybeSingle();
    if (connection.error) return jsonError("unavailable", 500);
    if (!connection.data) return jsonError("not_found", 404);
    const project = await secret
      .schema("business_os")
      .from("projects")
      .select("slug")
      .eq("id", connection.data.project_id)
      .maybeSingle();
    if (project.error || !project.data) return jsonError("not_found", 404);

    const sourceSecret = readSourceSecret(connection.data.secret_reference);
    if (!sourceSecret) return jsonError("source_secret_missing", 503);
    const pulled = await pullSigned({
      claim: {
        endpoint: "capabilities",
        cursor: null,
        initial_from: body.initialFrom,
        initial_to: body.initialTo,
        page_limit: 100,
        recognition_basis: "purchase",
        timezone: "Europe/London",
      },
      baseUrl: connection.data.base_url,
      keyId: connection.data.key_id,
      secret: sourceSecret,
    });
    if (pulled.kind !== "ok" || !validateContract("capabilities", pulled.body)) {
      return jsonError("source_unavailable", 502);
    }
    const capabilities = pulled.body as Capabilities;
    if (capabilities.project_id !== project.data.slug || capabilities.environment !== connection.data.source_environment) {
      return jsonError("project_mismatch", 422);
    }
    const basis = preferredBasis(capabilities.supported_bases);
    const datasets = datasetsFromCapabilities(capabilities);
    if (!basis || datasets.length === 0) return jsonError("dataset_invalid", 422);

    const enabled = await secret.schema("business_os").rpc("enable_source_connection", {
      actor_id: identity.profile.userId,
      target_connection_id: connection.data.id,
      target_capabilities: capabilities,
      target_datasets: datasets,
      target_basis: basis,
      target_page_limit: pageLimit(capabilities),
      target_from: body.initialFrom,
      target_to: body.initialTo,
    });
    const failure = mapRpcError(enabled.error);
    if (failure) return failure;
    return NextResponse.json({ id: enabled.data, datasets });
  } catch (error) {
    return mapAuthError(error);
  }
}
