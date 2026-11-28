import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsSensitive } from "@/lib/business-os/operations/route-guard";

const FIELDS = [
  ["legalName", "legal_name"],
  ["companyNumber", "company_number"],
  ["utr", "utr"],
  ["address", "address"],
  ["incorporatedOn", "incorporated_on"],
  ["yearEndMonth", "year_end_month"],
  ["yearEndDay", "year_end_day"],
  ["vatNumber", "vat_number"],
  ["vatStagger", "vat_stagger"],
  ["directorName", "director_name"],
] as const;

/** Edit the company's legal details. These feed forms and filing dates, so the browser must be confirmed. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsSensitive(request);
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const payload: Record<string, string> = {};
  for (const [key, column] of FIELDS) {
    if (!(key in body)) continue;
    const value = body[key];
    if (typeof value !== "string") return jsonError("invalid_body", 400);
    payload[column] = value;
  }
  if (Object.keys(payload).length === 0) return jsonError("invalid_body", 400);
  return operationsRpc("save_company_profile", { actor_id: profile.userId, payload });
}
