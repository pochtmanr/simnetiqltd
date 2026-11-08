import { normalizeFolder } from "@/lib/business-os/files/kinds";
import { parseLinks, parseTags, titleProblem } from "@/lib/business-os/brain/wikilinks";

export const MAX_NOTE_CHARS = 200_000;
export const IMPORT_BATCH = 200;

export type PreparedNote = { title: string; folder: string; body_md: string; tags: string[]; links: string[] };

/**
 * Validates a note and derives what the database stores beside the body: tags
 * and outgoing links are always parsed from the text, never taken from the client.
 */
export function prepareNote(input: { title: unknown; folder?: unknown; body?: unknown }): PreparedNote | { error: string } {
  if (typeof input.title !== "string") return { error: "title_invalid" };
  if (titleProblem(input.title)) return { error: "title_invalid" };
  const folder = normalizeFolder(typeof input.folder === "string" ? input.folder : "");
  if (folder === null) return { error: "folder_invalid" };
  const body = typeof input.body === "string" ? input.body : "";
  if (body.length > MAX_NOTE_CHARS) return { error: "note_too_large" };
  return { title: input.title.trim().replace(/\s+/g, " "), folder, body_md: body, tags: parseTags(body), links: parseLinks(body) };
}

/** Obsidian forbids some characters in note names; file titles may contain them. */
export function safeNoteTitle(raw: string): string {
  const cleaned = raw.replace(/[\[\]|#^\\/:]/g, "-").replace(/\s+/g, " ").trim().slice(0, 200);
  return cleaned || "Untitled";
}
