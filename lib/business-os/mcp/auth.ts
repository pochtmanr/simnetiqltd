import "server-only";
import { isUuid } from "@/lib/business-os/finance/body";
import { jobAuthorized } from "@/lib/business-os/sync/store";

export type McpTokenKind = "read" | "write";

/** Which token the caller presented: the write token can do everything, the read token only reads. */
export function mcpTokenKind(authorization: string | null): McpTokenKind | null {
  if (jobAuthorized(authorization, process.env.BUSINESS_OS_MCP_TOKEN_WRITE?.trim() || null)) return "write";
  if (jobAuthorized(authorization, process.env.BUSINESS_OS_MCP_TOKEN_READ?.trim() || null)) return "read";
  return null;
}

/** The member every MCP call runs as. Must be set explicitly; there is no fallback to "some owner". */
export function mcpActorId(): string | null {
  const configured = process.env.BUSINESS_OS_MCP_ACTOR_ID?.trim();
  return configured && isUuid(configured) ? configured : null;
}
