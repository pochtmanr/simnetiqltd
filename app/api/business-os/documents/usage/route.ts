import { NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { readStorageUsage } from "@/lib/business-os/files/usage";
import { beginOperationsRead } from "@/lib/business-os/operations/route-guard";

/** Org storage usage against the 10 GiB Files quota. */
export async function GET() {
  const profile = await beginOperationsRead();
  if (profile instanceof NextResponse) return profile;
  const usage = await readStorageUsage(profile.userId);
  if ("error" in usage) return jsonError("unavailable", 500);
  return NextResponse.json({ result: usage });
}
