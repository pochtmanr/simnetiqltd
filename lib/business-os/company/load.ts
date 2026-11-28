import "server-only";
import { userDb } from "@/lib/business-os/brain/read";
import { CHECKLIST_TAGS, type ChecklistFile } from "@/lib/business-os/company/checklist";
import type { CompanyProfileRow } from "@/lib/business-os/company/profile";

export type PickableFile = { id: string; title: string; folder: string; tags: string[] };

/** Stored files carrying a checklist tag, grouped by tag; plus recent files to pick from on the checklist screen. */
export type CompanyChecklist = { filesByTag: Record<string, ChecklistFile[]>; recent: PickableFile[]; profile: CompanyProfileRow | null } | { error: string };

export async function loadCompanyChecklist(options: { recent?: boolean } = {}): Promise<CompanyChecklist> {
  const db = await userDb();
  if (!db) return { error: "unauthenticated" };
  const result = await db
    .from("documents")
    .select("id, title, tags")
    .eq("upload_status", "stored")
    .overlaps("tags", CHECKLIST_TAGS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (result.error) return { error: "unavailable" };
  const filesByTag: Record<string, ChecklistFile[]> = {};
  for (const row of result.data ?? []) {
    if (typeof row.id !== "string" || typeof row.title !== "string" || !Array.isArray(row.tags)) continue;
    for (const tag of row.tags) {
      if (typeof tag === "string" && CHECKLIST_TAGS.includes(tag)) (filesByTag[tag] ??= []).push({ id: row.id, title: row.title });
    }
  }
  // The saved profile is optional: without it the screens fall back to the published company facts.
  const entity = await db
    .from("legal_entities")
    .select("legal_name, jurisdiction, registration_reference, tax_reference, address, incorporated_on, year_end_month, year_end_day, vat_number, vat_stagger, director_name")
    .order("created_at")
    .order("id")
    .limit(1);
  const row = entity.error ? null : (entity.data?.[0] ?? null);
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  const number = (value: unknown) => (typeof value === "number" ? value : null);
  const profile: CompanyProfileRow | null = row
    ? {
        legalName: text(row.legal_name) ?? "",
        jurisdiction: text(row.jurisdiction),
        companyNumber: text(row.registration_reference),
        utr: text(row.tax_reference),
        address: text(row.address),
        incorporatedOn: text(row.incorporated_on),
        yearEndMonth: number(row.year_end_month),
        yearEndDay: number(row.year_end_day),
        vatNumber: text(row.vat_number),
        vatStagger: number(row.vat_stagger),
        directorName: text(row.director_name),
      }
    : null;
  if (!options.recent) return { filesByTag, recent: [], profile };

  const latest = await db
    .from("documents")
    .select("id, title, folder, tags")
    .eq("upload_status", "stored")
    .eq("origin", "central")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (latest.error) return { error: "unavailable" };
  const recent = (latest.data ?? []).flatMap((row): PickableFile[] =>
    typeof row.id === "string" && typeof row.title === "string"
      ? [{ id: row.id, title: row.title, folder: typeof row.folder === "string" ? row.folder : "", tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [] }]
      : [],
  );
  return { filesByTag, recent, profile };
}
