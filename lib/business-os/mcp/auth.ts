import "server-only";
import { NextRequest } from "next/server";
import { createSecretClient } from "@/lib/business-os/db/client";
import { jobAuthorized } from "@/lib/business-os/sync/store";

export function mcpTokenAuthorized(request: NextRequest): boolean {
  const secret = process.env.BUSINESS_OS_MCP_TOKEN?.trim() || null;
  return jobAuthorized(request.headers.get("authorization"), secret);
}

/** Actor used for document RPCs. Prefer env; otherwise the first owner membership. */
export async function resolveMcpActorId(): Promise<string | null> {
  const configured = process.env.BUSINESS_OS_MCP_ACTOR_ID?.trim();
  if (configured) return configured;
  const result = await createSecretClient()
    .schema("business_os")
    .from("memberships")
    .select("user_id")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (result.error || !result.data?.user_id) return null;
  return result.data.user_id as string;
}
