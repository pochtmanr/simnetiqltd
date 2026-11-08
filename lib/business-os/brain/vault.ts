/**
 * Client-side planning for an Obsidian vault import: which picked files are
 * notes, how they batch for the import route, and what skip codes mean. Pure.
 */
import { folderFromPath, titleFromPath } from "@/lib/business-os/brain/wikilinks";

export type VaultFile = { path: string; body: string };
export type Skip = { path: string; reason: string };

export const BATCH_FILES = 200;
export const BATCH_BYTES = 3_000_000;

/** A Markdown note outside Obsidian's settings, trash and macOS zip metadata. */
export function isNotePath(path: string): boolean {
  return /\.md$/i.test(path) && !/(^|\/)(\.obsidian|\.trash|__MACOSX)\//.test(path);
}

/** True when every path sits under one shared top folder, i.e. the vault's own folder. */
export function detectStripRoot(paths: string[]): boolean {
  if (paths.length === 0 || !paths.every((path) => path.includes("/"))) return false;
  return new Set(paths.map((path) => path.split("/")[0])).size === 1;
}

const titleKey = (path: string) => titleFromPath(path).trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Splits picked paths into notes to send and files left out. A second file with
 * the same title would overwrite the first, so it is skipped up front.
 */
export function planImport<T extends { path: string }>(files: T[]): { notes: T[]; leftOut: number; duplicates: Skip[] } {
  const notes: T[] = [];
  const duplicates: Skip[] = [];
  const seen = new Set<string>();
  let leftOut = 0;
  for (const file of files) {
    if (!isNotePath(file.path)) {
      leftOut += 1;
      continue;
    }
    const key = titleKey(file.path);
    if (seen.has(key)) duplicates.push({ path: file.path, reason: "duplicate_title" });
    else {
      seen.add(key);
      notes.push(file);
    }
  }
  return { notes, leftOut, duplicates };
}

/** How many notes land in a folder once `stripRoot` is applied. */
export function countInFolders(paths: string[], stripRoot: boolean): number {
  return paths.filter((path) => folderFromPath(path, stripRoot) !== "").length;
}

/** Groups files into requests of at most 200 files and roughly 3 MB of JSON. */
export function batchFiles(files: VaultFile[]): VaultFile[][] {
  const batches: VaultFile[][] = [];
  let batch: VaultFile[] = [];
  let bytes = 0;
  for (const file of files) {
    const size = file.body.length * 3 + file.path.length;
    if (batch.length >= BATCH_FILES || (batch.length > 0 && bytes + size > BATCH_BYTES)) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(file);
    bytes += size;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

/** Plain-English reason for a skip code from the import route (or `upload_failed` from the client). */
export function skipReason(code: string): string {
  switch (code) {
    case "title_invalid":
      return "The file name can’t be a note title. Titles can’t be empty, longer than 200 characters, or use [ ] | # ^ \\ / or :";
    case "folder_invalid":
      return "The folder can’t be used. Folder names need to start with a letter or number, use only letters, numbers, spaces, - _ or ., and be at most 6 levels deep.";
    case "note_too_large":
      return "The note is longer than 200,000 characters.";
    case "duplicate_title":
      return "Another file in this import has the same title.";
    case "upload_failed":
      return "The upload failed — try again.";
    default:
      return "It couldn’t be imported.";
  }
}

/** `business-os-notes-YYYY-MM-DD.zip` in local time. */
export function exportFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `business-os-notes-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.zip`;
}
