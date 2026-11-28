import "server-only";
import { userDb } from "@/lib/business-os/brain/read";
import { CHECKLIST_TAGS, type ChecklistFile } from "@/lib/business-os/company/checklist";

export type PickableFile = { id: string; title: string; folder: string; tags: string[] };

/** Stored files carrying a checklist tag, grouped by tag; plus recent files to pick from on the checklist screen. */
export type CompanyChecklist = { filesByTag: Record<string, ChecklistFile[]>; recent: PickableFile[] } | { error: string };

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
  if (!options.recent) return { filesByTag, recent: [] };

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
  return { filesByTag, recent };
}
