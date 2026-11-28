import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { mcpActorId, mcpTokenKind } from "@/lib/business-os/mcp/auth";
import { activitySummary, dispatchMcpTool, MCP_TOOLS } from "@/lib/business-os/mcp/dispatch";

/** Machine access for the Business OS MCP server. Bearer BUSINESS_OS_MCP_TOKEN_READ or _WRITE. */
export async function GET(request: NextRequest) {
  const kind = mcpTokenKind(request.headers.get("authorization"));
  if (!kind) return jsonError("forbidden", 403);
  return NextResponse.json({ result: { name: "business-os", access: kind, tools: MCP_TOOLS } });
}

export async function POST(request: NextRequest) {
  const kind = mcpTokenKind(request.headers.get("authorization"));
  if (!kind) return jsonError("forbidden", 403);
  const actorId = mcpActorId();
  if (!actorId) return jsonError("mcp_actor_missing", 503);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const tool = typeof body.tool === "string" ? body.tool : "";
  const args = body.arguments && typeof body.arguments === "object" && !Array.isArray(body.arguments) ? (body.arguments as Record<string, unknown>) : {};
  const outcome = await dispatchMcpTool(tool, args, { actorId, kind });

  // Every call is logged for the owner. A failed log must not hide the result of the call itself.
  const logged = await readFinanceRpc("record_agent_activity", {
    actor_id: actorId,
    token_kind: kind,
    tool: tool.slice(0, 80) || "unknown",
    summary: activitySummary(args),
    outcome: outcome.ok ? "ok" : outcome.status === 403 ? "refused" : "failed",
    error_code: outcome.ok ? null : outcome.error,
  });
  if ("error" in logged) console.error("business-os mcp: activity log failed", logged.error.message);

  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  return NextResponse.json({ result: outcome.result });
}
