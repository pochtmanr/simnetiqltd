import { explainFinanceError } from "@/components/business-os/business-post";

export type SaveResult = { title: string; updatedAt: string; tags: string[]; links: string[]; relinked: number };

export const NOTE_ERRORS: Record<string, string> = {
  note_title_taken: "Another note already has this title.",
  title_invalid: "Titles cannot be empty or contain [ ] | # ^ \\ / or :",
  folder_invalid: "Folder names use letters, numbers, spaces, dots, dashes and underscores.",
  note_too_large: "Notes can be up to 200,000 characters.",
  note_missing: "This note was deleted.",
};

export function explain(payload: Record<string, unknown>): string {
  return (typeof payload.error === "string" && NOTE_ERRORS[payload.error]) || explainFinanceError(payload);
}

/** Folder colours: bright mid-tones that read on both the light and dark themes. */
export const FOLDER_PALETTE = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f43f5e", // rose
] as const;

/** Colours the user picked, by top-level folder name. */
export type FolderColors = Record<string, string>;

/** The top-level segment of a folder path: "Projects/Doppler" → "Projects". "" for the top level. */
export function topFolder(folder: string): string {
  return folder.split("/")[0].trim();
}

/** Stable palette slot for a folder, shared by its subfolders; null for top-level notes. */
export function folderHue(folder: string): number | null {
  const top = topFolder(folder);
  if (!top) return null;
  let hash = 0;
  for (const char of top) hash = (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0;
  return hash % FOLDER_PALETTE.length;
}

/** A folder's colour: the user's pick, else its stable palette colour, else neutral grey for the top level. */
export function folderColor(folder: string, picked: FolderColors = {}): string {
  const top = topFolder(folder);
  const hue = folderHue(folder);
  if (hue === null) return "var(--bos-muted)";
  return picked[top] ?? FOLDER_PALETTE[hue];
}

/** Keeps only picks that name a palette colour, so stored junk can never reach a style. */
export function parseFolderColors(raw: string | null): FolderColors {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const allowed = new Set<string>(FOLDER_PALETTE);
    return Object.fromEntries(Object.entries(value).filter(([name, color]) => name.length > 0 && name.length <= 60 && typeof color === "string" && allowed.has(color)));
  } catch {
    return {};
  }
}

/** A folder in the note list: its notes, its subfolders and how many notes sit anywhere inside. */
export type FolderNode<T> = { name: string; path: string; count: number; notes: T[]; folders: FolderNode<T>[] };

/** Groups notes into their folder paths ("Doppler VPN/Apps"); notes keep the given order, folders sort by name. */
export function buildFolderTree<T extends { folder: string }>(notes: T[]): FolderNode<T> {
  const root: FolderNode<T> = { name: "", path: "", count: 0, notes: [], folders: [] };
  const byPath = new Map<string, FolderNode<T>>([["", root]]);
  for (const note of notes) {
    let node = root;
    root.count += 1;
    for (const path of folderAncestors(note.folder)) {
      let child = byPath.get(path);
      if (!child) {
        child = { name: path.slice(path.lastIndexOf("/") + 1), path, count: 0, notes: [], folders: [] };
        byPath.set(path, child);
        node.folders.push(child);
      }
      child.count += 1;
      node = child;
    }
    node.notes.push(note);
  }
  for (const node of byPath.values()) node.folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
  return root;
}

/** Each folder path from the top down: "A/B" → ["A", "A/B"]. Empty for top-level notes. */
export function folderAncestors(folder: string): string[] {
  if (!folder) return [];
  const parts = folder.split("/");
  return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}
