/**
 * Pure text operations behind the note editor: toolbar formatting, task
 * toggling from the preview, the outline, word counts and `[[` completion.
 * Every edit takes the text plus a selection and returns both, so the
 * textarea can restore the caret.
 */

import { maskCode } from "@/lib/business-os/brain/wikilinks";

export type Edit = { text: string; start: number; end: number };

/** Wraps the selection in `before`/`after`, or unwraps it when it is already wrapped. With no selection, inserts `placeholder` selected. */
export function wrapSelection(text: string, start: number, end: number, before: string, after = before, placeholder = "text"): Edit {
  const selected = text.slice(start, end);
  if (text.slice(start - before.length, start) === before && text.slice(end, end + after.length) === after) {
    return { text: text.slice(0, start - before.length) + selected + text.slice(end + after.length), start: start - before.length, end: end - before.length };
  }
  const inner = selected || placeholder;
  const next = text.slice(0, start) + before + inner + after + text.slice(end);
  return { text: next, start: start + before.length, end: start + before.length + inner.length };
}

function lineBounds(text: string, start: number, end: number): { from: number; to: number } {
  const from = text.lastIndexOf("\n", start - 1) + 1;
  const stop = text.indexOf("\n", end > start && text[end - 1] === "\n" ? end - 1 : end);
  return { from, to: stop === -1 ? text.length : stop };
}

/**
 * Adds `prefix` to every selected line, or removes it when all of them already
 * have it. Heading prefixes replace another heading level instead of stacking.
 */
export function toggleLinePrefix(text: string, start: number, end: number, prefix: string): Edit {
  const { from, to } = lineBounds(text, start, end);
  const lines = text.slice(from, to).split("\n");
  const heading = /^#{1,6} $/.test(prefix);
  const strip = (line: string) => (heading ? line.replace(/^#{1,6} /, "") : line.slice(prefix.length));
  const all = lines.every((line) => line.startsWith(prefix));
  const changed = lines.map((line) => (all ? strip(line) : prefix + (heading ? line.replace(/^#{1,6} /, "") : line)));
  const block = changed.join("\n");
  const next = text.slice(0, from) + block + text.slice(to);
  if (lines.length === 1) {
    const delta = block.length - (to - from);
    const caret = Math.max(from, end + delta);
    return { text: next, start: start === end ? caret : from, end: caret };
  }
  return { text: next, start: from, end: from + block.length };
}

/** Inserts `snippet` at the caret, replacing the selection, on its own line when `block` is set. */
export function insertText(text: string, start: number, end: number, snippet: string, block = false): Edit {
  let insert = snippet;
  if (block) {
    if (start > 0 && text[start - 1] !== "\n") insert = `\n${insert}`;
    if (end < text.length && text[end] !== "\n") insert = `${insert}\n`;
  }
  const caret = start + insert.length;
  return { text: text.slice(0, start) + insert + text.slice(end), start: caret, end: caret };
}

/** Makes the selection a Markdown link: `[label](url)` with the url selected for typing. */
export function insertMarkdownLink(text: string, start: number, end: number): Edit {
  const label = text.slice(start, end) || "link";
  const snippet = `[${label}](https://)`;
  const urlStart = start + label.length + 3;
  return { text: text.slice(0, start) + snippet + text.slice(end), start: urlStart, end: urlStart + "https://".length };
}

const TASK = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/;

/** Flips the GFM task checkbox on a 1-based source line. Returns the text unchanged when that line is not a task. */
export function toggleTaskAtLine(text: string, line: number): string {
  const lines = text.split("\n");
  const index = line - 1;
  if (index < 0 || index >= lines.length) return text;
  const match = TASK.exec(lines[index]);
  if (!match) return text;
  lines[index] = lines[index].replace(TASK, (_, open: string, mark: string, close: string) => `${open}${mark === " " ? "x" : " "}${close}`);
  return lines.join("\n");
}

export type Heading = { level: number; text: string; line: number };

/** ATX headings outside code, with their 1-based line, for the outline. */
export function outline(text: string): Heading[] {
  const masked = maskCode(text).split("\n");
  const original = text.split("\n");
  const headings: Heading[] = [];
  masked.forEach((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) headings.push({ level: match[1].length, text: original[index].replace(/^#{1,6}\s+/, "").replace(/\s*#*\s*$/, ""), line: index + 1 });
  });
  return headings;
}

/** Words in the note, ignoring frontmatter and Markdown punctuation. */
export function wordCount(text: string): number {
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, "");
  return body.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Minutes to read at 220 words a minute, at least one for a non-empty note. */
export function readingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.round(words / 220));
}

/**
 * When the caret sits inside an unclosed `[[` on the current line, returns what
 * has been typed after it and where it starts, for title completion.
 */
export function linkQuery(text: string, caret: number): { from: number; query: string } | null {
  const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
  const before = text.slice(lineStart, caret);
  const open = before.lastIndexOf("[[");
  if (open === -1) return null;
  const typed = before.slice(open + 2);
  if (/[\]\[|#^]/.test(typed) || typed.length > 200) return null;
  return { from: lineStart + open + 2, query: typed };
}

/** Completes the `[[` at `from` with `title`, closing the brackets and putting the caret after them. */
export function completeLink(text: string, from: number, caret: number, title: string): Edit {
  const closing = text.slice(caret, caret + 2) === "]]" ? 2 : 0;
  const next = `${text.slice(0, from)}${title}]]${text.slice(caret + closing)}`;
  const at = from + title.length + 2;
  return { text: next, start: at, end: at };
}

/** True when `text` names `title` as whole words outside code and outside `[[links]]`: an unlinked mention. */
export function mentionsTitle(text: string, title: string): boolean {
  const name = title.trim();
  if (name.length < 3) return false;
  const plain = maskCode(text).replace(/!?\[\[[^\[\]\n]*\]\]/g, " ");
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu").test(plain);
}
