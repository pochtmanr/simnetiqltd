import "server-only";
import { NextResponse } from "next/server";
import { mapRpcError } from "@/lib/business-os/auth/http";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";

export async function operationsRpc(name: string, args: Record<string, unknown>): Promise<NextResponse> {
  const read = await readFinanceRpc(name, args);
  if ("error" in read) return mapRpcError(read.error) ?? NextResponse.json({ error: "unavailable" }, { status: 500 });
  return NextResponse.json({ result: read.data });
}

export async function operationsData(name: string, args: Record<string, unknown>): Promise<unknown | NextResponse> {
  const read = await readFinanceRpc(name, args);
  if ("error" in read) return mapRpcError(read.error) ?? NextResponse.json({ error: "unavailable" }, { status: 500 });
  return read.data;
}
