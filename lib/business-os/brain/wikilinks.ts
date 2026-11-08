/**
 * Obsidian-compatible note parsing. Pure: used by the save and import routes,
 * the editor preview, and the tests.
 *
 * - `[[Title]]`, `[[Title|alias]]`, `[[Title#Heading]]`, `[[Title^block]]` and
 *   `![[Embed]]` all link to the note named "Title".
 * - `#tag` and frontmatter `tags:` become tags. Headings (`# Title`) are not tags.
 * - Anything inside fenced code or inline code is ignored.
 */

const LINK = /(!?)\[\[([^\[\]\n]+?)\]\]/g;
const MAX_TITLE = 200;

/** Lower-cased, whitespace-collapsed title: the key `[[links]]` resolve by. Matches `business_os.note_link_key`. */
export function noteKey(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Characters Obsidian forbids in note names, which would also break link syntax. */
export function titleProblem(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "A note needs a title.";
  if (trimmed.length > MAX_TITLE) return "Titles can be up to 200 characters.";
  if (/[\[\]|#^\\/:]/.test(trimmed)) return "Titles cannot contain [ ] | # ^ \\ / or :";
  return null;
}

/** Blanks out fenced and inline code so links and tags inside it are not parsed. Keeps offsets. */
export function maskCode(markdown: string): string {
  const blank = (match: string) => match.replace(/[^\n]/g, " ");
  return markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?(^\1[^\n]*$|(?![\s\S]))/gm, blank).replace(/`[^`\n]+`/g, blank);
}

/** Splits `Title#Heading|alias` into its parts. */
export function splitLink(inner: string): { target: string; anchor: string | null; alias: string | null } {
  const pipe = inner.indexOf("|");
  const left = pipe >= 0 ? inner.slice(0, pipe) : inner;
  const alias = pipe >= 0 ? inner.slice(pipe + 1).trim() || null : null;
  const hash = left.search(/[#^]/);
  const target = (hash >= 0 ? left.slice(0, hash) : left).trim();
  const anchor = hash >= 0 ? left.slice(hash + 1).trim() || null : null;
  return { target, anchor, alias };
}

/** Distinct link targets (as written, first occurrence wins), skipping same-note anchors like `[[#Heading]]`. */
export function parseLinks(markdown: string): string[] {
  const masked = maskCode(markdown);
  const seen = new Map<string, string>();
  for (const match of masked.matchAll(LINK)) {
    const { target } = splitLink(match[2]);
    const name = target.replace(/\.md$/i, "");
    if (!name || name.length > MAX_TITLE) continue;
    const key = noteKey(name);
    if (!seen.has(key)) seen.set(key, name);
  }
  return [...seen.values()];
}

/** Frontmatter block at the very top, if any. */
export function splitFrontmatter(markdown: string): { frontmatter: string | null; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/.exec(markdown);
  if (!match) return { frontmatter: null, body: markdown };
  return { frontmatter: match[1], body: markdown.slice(match[0].length) };
}

function normalizeTag(raw: string): string | null {
  const tag = raw.replace(/^#/, "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9/_-]{0,63}$/.test(tag) ? tag : null;
}

/** Tags from frontmatter (`tags: [a, b]`, `tags: a, b`, or a YAML list) — the only frontmatter key we read. */
function frontmatterTags(frontmatter: string): string[] {
  const lines = frontmatter.split(/\r?\n/);
  const out: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(tags?)\s*:\s*(.*)$/i.exec(lines[index]);
    if (!match) continue;
    const inline = match[2].trim();
    if (inline) {
      out.push(...inline.replace(/^\[|\]$/g, "").split(/[,\s]+/).map((part) => part.replace(/^["']|["']$/g, "")));
      continue;
    }
    for (let next = index + 1; next < lines.length; next += 1) {
      const item = /^\s*-\s*(.+)$/.exec(lines[next]);
      if (!item) break;
      out.push(item[1].trim().replace(/^["']|["']$/g, ""));
    }
  }
  return out;
}

/** Distinct tags from frontmatter and inline `#tags`, capped at 32. */
export function parseTags(markdown: string): string[] {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const found = frontmatter ? frontmatterTags(frontmatter) : [];
  const masked = maskCode(body).replace(LINK, " ");
  for (const match of masked.matchAll(/(^|[\s(])#([\p{L}\p{N}_/-]+)/gu)) {
    if (/^\d+$/.test(match[2])) continue; // "#1" is a number, not a tag
    found.push(match[2]);
  }
  const tags = new Set<string>();
  for (const raw of found) {
    const tag = normalizeTag(raw);
    if (tag) tags.add(tag);
    if (tags.size === 32) break;
  }
  return [...tags];
}

/**
 * Turns wikilinks into ordinary markdown links the preview can render:
 * `[[Title|alias]]` → `[alias](#note=Title)`. Code is left untouched.
 */
export function wikilinksToMarkdown(markdown: string): string {
  const masked = maskCode(markdown);
  let out = "";
  let last = 0;
  for (const match of masked.matchAll(LINK)) {
    const start = match.index ?? 0;
    const original = markdown.slice(start, start + match[0].length);
    const inner = original.slice(match[1].length + 2, -2);
    const { target, anchor, alias } = splitLink(inner);
    const label = (alias ?? (target ? (anchor ? `${target} › ${anchor}` : target) : (anchor ?? inner))).replace(/[\[\]]/g, "");
    out += markdown.slice(last, start);
    out += target ? `[${label}](#note=${encodeURIComponent(target.replace(/\.md$/i, ""))})` : label;
    last = start + match[0].length;
  }
  return out + markdown.slice(last);
}

/** Rewrites links to a renamed note, keeping anchors and aliases. Code is left untouched. */
export function renameLinks(markdown: string, fromTitle: string, toTitle: string): string {
  const fromKey = noteKey(fromTitle);
  const masked = maskCode(markdown);
  let out = "";
  let last = 0;
  for (const match of masked.matchAll(LINK)) {
    const start = match.index ?? 0;
    const original = markdown.slice(start, start + match[0].length);
    const inner = original.slice(match[1].length + 2, -2);
    const { target } = splitLink(inner);
    if (noteKey(target.replace(/\.md$/i, "")) !== fromKey) continue;
    const rest = inner.slice(inner.indexOf(target) + target.length);
    out += markdown.slice(last, start) + `${match[1]}[[${toTitle}${rest}]]`;
    last = start + match[0].length;
  }
  return out + markdown.slice(last);
}

/** Note title from a vault path: `Projects/Doppler/Roadmap.md` → `Roadmap`. */
export function titleFromPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/i, "");
}

/** Folder from a vault path, without the vault's own top-level directory when `stripRoot` is set. */
export function folderFromPath(path: string, stripRoot: boolean): string {
  const parts = path.split("/").slice(0, -1);
  return (stripRoot ? parts.slice(1) : parts).join("/");
}
