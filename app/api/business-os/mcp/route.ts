import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { mcpTokenAuthorized } from "@/lib/business-os/mcp/auth";
import { dispatchMcpTool, MCP_TOOLS } from "@/lib/business-os/mcp/dispatch";

/** Machine access for the Business OS Files MCP server. Bearer BUSINESS_OS_MCP_TOKEN. */
export async function GET() {
  return NextResponse.json({
    result: {
      name: "business-os-files",
      tools: MCP_TOOLS,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!mcpTokenAuthorized(request)) return jsonError("forbidden", 403);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const tool = typeof body.tool === "string" ? body.tool : "";
  const args = body.arguments && typeof body.arguments === "object" && !Array.isArray(body.arguments) ? (body.arguments as Record<string, unknown>) : {};
  const outcome = await dispatchMcpTool(tool, args);
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  return NextResponse.json({ result: outcome.result });
}
