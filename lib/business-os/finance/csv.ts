export type CsvRow = {
  account: string;
  side: string;
  originalAmount: string;
  originalCurrency: string;
  gbpAmount: string | null;
  effectiveAt: string;
};

const FORMULA = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string): string {
  let cell = value;
  if (FORMULA.test(cell)) cell = `'${cell}`;
  if (/[",\n\r]/.test(cell)) return `"${cell.replaceAll('"', '""')}"`;
  return cell;
}

export function instantInWindow(effectiveAt: string, from: string, to: string): boolean {
  const at = Date.parse(effectiveAt);
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (!Number.isFinite(at) || !Number.isFinite(start) || !Number.isFinite(end)) return false;
  return at >= start && at < end;
}

export function csvScopeFromReport(report: unknown): { basis: string; coverage: string } | null {
  if (!report || typeof report !== "object") return null;
  const row = report as Record<string, unknown>;
  if (row.coverage !== "complete" && row.coverage !== "partial" && row.coverage !== "missing") return null;
  if (typeof row.basis !== "string" || row.basis.length === 0) return null;
  return { basis: row.basis, coverage: row.coverage };
}

export function formatFinanceCsv(input: { basis: string; coverage: string; rows: readonly CsvRow[] }): string {
  const header = ["account", "side", "original_amount", "original_currency", "gbp_amount", "effective_at", "basis", "coverage"];
  const lines = [header.join(",")];
  for (const row of input.rows) {
    lines.push(
      [row.account, row.side, row.originalAmount, row.originalCurrency, row.gbpAmount ?? "", row.effectiveAt, input.basis, input.coverage]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
