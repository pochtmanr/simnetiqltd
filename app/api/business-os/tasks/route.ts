import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

const FIELDS = [
  ["title", "title"],
  ["notes", "notes"],
  ["dueOn", "due_on"],
  ["status", "status"],
  ["assignee", "assignee"],
  ["project", "project_slug"],
] as const;

/** Create a task, or change the one named by `id`. Only the keys sent are changed. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const payload: Record<string, unknown> = {};
  if ("id" in body) {
    if (!isUuid(body.id)) return jsonError("invalid_body", 400);
    payload.id = body.id;
  }
  for (const [key, column] of FIELDS) {
    if (!(key in body)) continue;
    const value = body[key];
    if (value !== null && typeof value !== "string") return jsonError("invalid_body", 400);
    payload[column] = value ?? "";
  }
  return operationsRpc("save_task", { actor_id: profile.userId, payload });
}
