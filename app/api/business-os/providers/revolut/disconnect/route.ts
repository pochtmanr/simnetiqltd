import { NextRequest, NextResponse } from "next/server";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginOperationsOwner } from "@/lib/business-os/operations/route-guard";

/** Forgets the Revolut token. Transactions already pulled stay, so statements keep working. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsOwner(request);
  if (profile instanceof NextResponse) return profile;
  return financeRpc("disconnect_provider", { actor_id: profile.userId, target_provider: "revolut" });
}
