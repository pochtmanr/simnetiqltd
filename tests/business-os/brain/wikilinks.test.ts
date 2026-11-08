import assert from "node:assert/strict";
import test from "node:test";
import { folderFromPath, noteKey, parseLinks, parseTags, renameLinks, splitFrontmatter, titleFromPath, titleProblem, wikilinksToMarkdown } from "@/lib/business-os/brain/wikilinks";

test("links: aliases, headings, blocks, embeds and .md suffixes resolve to the note name", () => {
  const body = "See [[Roadmap]], [[roadmap|the plan]], [[Hiring#Q1]], [[Ops^abc]], ![[Logo.png]] and [[Pricing.md]].";
  assert.deepEqual(parseLinks(body), ["Roadmap", "Hiring", "Ops", "Logo.png", "Pricing"]);
});

test("links: same-note anchors and code are ignored", () => {
  const body = "Jump to [[#Top]].\n\n```md\n[[Not a link]]\n```\n\nInline `[[Nope]]` but [[Yes]].";
  assert.deepEqual(parseLinks(body), ["Yes"]);
});

test("links: an unclosed fence hides the rest of the note", () => {
  assert.deepEqual(parseLinks("[[A]]\n```\n[[B]]"), ["A"]);
});

test("tags: inline and frontmatter, lowercased, headings and numbers excluded", () => {
  const body = "---\ntags: [Finance, q3]\naliases: x\n---\n# Heading\nPaid #Hosting and #ops/infra. Issue #12. `#code`";
  assert.deepEqual(parseTags(body), ["finance", "q3", "hosting", "ops/infra"]);
  assert.deepEqual(parseTags("---\ntags:\n  - a\n  - \"b\"\n---\nbody"), ["a", "b"]);
});

test("frontmatter is split without altering the body", () => {
  assert.deepEqual(splitFrontmatter("---\na: 1\n---\nhello"), { frontmatter: "a: 1", body: "hello" });
  assert.deepEqual(splitFrontmatter("no frontmatter"), { frontmatter: null, body: "no frontmatter" });
});

test("preview turns wikilinks into hash links and leaves code alone", () => {
  assert.equal(wikilinksToMarkdown("Go [[Road map|plan]] / [[Hiring#Q1]]"), "Go [plan](#note=Road%20map) / [Hiring › Q1](#note=Hiring)");
  assert.equal(wikilinksToMarkdown("`[[x]]`"), "`[[x]]`");
});

test("renaming rewrites matching links only, keeping anchors and aliases", () => {
  const body = "[[Old]] [[old#H|a]] ![[Old]] [[Older]] `[[Old]]`";
  assert.equal(renameLinks(body, "Old", "New"), "[[New]] [[New#H|a]] ![[New]] [[Older]] `[[Old]]`");
});

test("titles, keys and vault paths", () => {
  assert.equal(noteKey("  Road   Map "), "road map");
  assert.equal(titleProblem("a/b"), "Titles cannot contain [ ] | # ^ \\ / or :");
  assert.equal(titleProblem("Fine title"), null);
  assert.equal(titleFromPath("Vault/Projects/Roadmap.md"), "Roadmap");
  assert.equal(folderFromPath("Vault/Projects/Roadmap.md", true), "Projects");
  assert.equal(folderFromPath("Projects/Roadmap.md", false), "Projects");
});

test("notes are prepared from their text: tags and links are parsed, never trusted from the client", async () => {
  const { prepareNote, safeNoteTitle } = await import("@/lib/business-os/brain/prepare");
  assert.deepEqual(prepareNote({ title: "  Road   map ", folder: " Plans/ 2027 ", body: "See [[Pricing]] #plan" }), {
    title: "Road map",
    folder: "Plans/2027",
    body_md: "See [[Pricing]] #plan",
    tags: ["plan"],
    links: ["Pricing"],
  });
  assert.deepEqual(prepareNote({ title: "a:b", body: "" }), { error: "title_invalid" });
  assert.deepEqual(prepareNote({ title: "ok", folder: "../x", body: "" }), { error: "folder_invalid" });
  assert.deepEqual(prepareNote({ title: "ok", body: "x".repeat(200_001) }), { error: "note_too_large" });
  assert.equal(safeNoteTitle("Invoice 2026/03: Hetzner [paid]"), "Invoice 2026-03- Hetzner -paid-");
});
