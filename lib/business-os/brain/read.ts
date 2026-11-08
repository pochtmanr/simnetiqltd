import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import { createUserClient } from "@/lib/business-os/db/client";

/** The signed-in user's client on the business_os schema, so row-level security applies to reads. */
export async function userDb() {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access) return null;
  return createUserClient(access).schema("business_os");
}

/** PostgREST returns at most 1000 rows per request; page through up to `cap` rows. */
export async function selectAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, cap: number): Promise<T[] | null> {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; from < cap; from += size) {
    const result = await page(from, Math.min(from + size, cap) - 1);
    if (result.error) return null;
    const batch = result.data ?? [];
    rows.push(...batch);
    if (batch.length < size) break;
  }
  return rows;
}
