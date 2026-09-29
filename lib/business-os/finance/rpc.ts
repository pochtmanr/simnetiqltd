import "server-only";
import { NextResponse } from "next/server";
import { mapRpcError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";

export async function readFinanceRpc(
  name: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown } | { error: { message?: string } }> {
  const result = await createSecretClient().schema("business_os").rpc(name, args);
  if (result.error) return { error: result.error };
  return { data: result.data };
}

export async function financeRpc(name: string, args: Record<string, unknown>): Promise<NextResponse> {
  const read = await readFinanceRpc(name, args);
  if ("error" in read) return mapRpcError(read.error) ?? NextResponse.json({ error: "unavailable" }, { status: 500 });
  return NextResponse.json({ result: read.data });
}
