import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { evidenceKind } from "@/lib/business-os/finance/reconcile";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

const BASES = new Set(["purchase", "earned_management", "settled_cash", "sms_legacy"]);

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: { project?: unknown; from?: unknown; to?: unknown; basis?: unknown; evidenceKind?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.project !== "string" || typeof body.from !== "string" || typeof body.to !== "string") {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.basis !== "string" || !BASES.has(body.basis)) return jsonError("invalid_body", 400);
  const evidence = evidenceKind(body.evidenceKind);
  if ("error" in evidence) return jsonError(evidence.error, evidence.error === "live_evidence_unavailable" ? 422 : 400);
  try {
    return financeRpc("compare_shadow", {
      actor_id: profile.userId,
      payload: {
        project_slug: body.project,
        from: body.from,
        to: body.to,
        basis: body.basis,
        evidence_kind: evidence.kind,
      },
    });
  } catch (error) {
    return mapAuthError(error);
  }
}
