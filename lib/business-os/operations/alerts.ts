export type AlertInput = {
  health: { rows: { connectionId: string; status: string; lastSuccessAt: string | null; projectSlug?: string | null }[] } | { error: string };
  quarantine: { rows: { endpoint: string; reason: string }[] } | { error: string };
  mismatches: { rows: { projectSlug: string | null; dataset: string }[] } | { error: string };
};

export type AlertRow = {
  key: string;
  message: string;
};

const STALE_MS = 36 * 60 * 60 * 1000;

export function buildAlerts(input: AlertInput, now: Date): AlertRow[] {
  const rows: AlertRow[] = [];
  const seen = new Set<string>();
  const push = (key: string, message: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ key, message });
  };

  if (!("error" in input.health)) {
    for (const row of input.health.rows) {
      const where = row.projectSlug ? ` for ${row.projectSlug}` : "";
      if (row.status !== "ok") {
        push(`health:${row.connectionId}:${row.status}`, `Source health is ${row.status}${where}. Open integrations to repair it.`);
        continue;
      }
      if (row.lastSuccessAt && now.getTime() - Date.parse(row.lastSuccessAt) > STALE_MS) {
        push(`health:${row.connectionId}:stale`, `Source data is older than 36 hours${where}. Open integrations to repair it.`);
      }
    }
  }

  if (!("error" in input.quarantine)) {
    for (const row of input.quarantine.rows) {
      push(`import:${row.endpoint}:${row.reason}`, `Import failed (${row.reason}) on ${row.endpoint}. Open integrations to repair it.`);
    }
  }

  if (!("error" in input.mismatches)) {
    for (const row of input.mismatches.rows) {
      const project = row.projectSlug ?? "company";
      push(`mismatch:${project}:${row.dataset}`, `Reconciliation mismatch on ${project} ${row.dataset}. Open integrations to repair it.`);
    }
  }

  return rows;
}
