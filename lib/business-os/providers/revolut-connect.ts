import "server-only";
import { readRevolutConfig, type RevolutConfig } from "@/lib/business-os/providers/revolut";
import { bankStore } from "@/lib/business-os/providers/store";
import { runBankSync } from "@/lib/business-os/providers/bank-sync";
import { tokenKey } from "@/lib/business-os/providers/seal";

/** Cookie holding the consent `state` between the connect click and Revolut's redirect back. */
export const REVOLUT_STATE_COOKIE = "bos_revolut_state";
export const REVOLUT_STATE_PATH = "/api/business-os/providers/revolut";

/** Config and token key together, or the name of what is missing. */
export function revolutReady(): { config: RevolutConfig; key: Buffer } | { missing: "revolut_unconfigured" | "token_key_missing" } {
  const config = readRevolutConfig();
  if (!config) return { missing: "revolut_unconfigured" };
  try {
    return { config, key: tokenKey() };
  } catch {
    return { missing: "token_key_missing" };
  }
}

export async function syncRevolut(fetcher?: typeof fetch) {
  const ready = revolutReady();
  if ("missing" in ready) return { outcome: ready.missing, rows: 0 };
  return runBankSync(bankStore("revolut"), { ...ready, fetcher });
}
