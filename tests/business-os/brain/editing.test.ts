import assert from "node:assert/strict";
import test from "node:test";
import { completeLink, insertMarkdownLink, insertText, linkQuery, mentionsTitle, outline, readingMinutes, toggleLinePrefix, toggleTaskAtLine, wordCount, wrapSelection } from "@/lib/business-os/brain/editing";
import { dayStamp, NOTE_TEMPLATES, uniqueTitle } from "@/lib/business-os/brain/templates";
import { titleProblem } from "@/lib/business-os/brain/wikilinks";

test("wrap: wraps a selection, unwraps it again, inserts a placeholder when empty", () => {
  const wrapped = wrapSelection("say hi now", 4, 6, "**");
  assert.deepEqual(wrapped, { text: "say **hi** now", start: 6, end: 8 });
  assert.deepEqual(wrapSelection(wrapped.text, wrapped.start, wrapped.end, "**"), { text: "say hi now", start: 4, end: 6 });
  assert.deepEqual(wrapSelection("ab", 1, 1, "_"), { text: "a_text_b", start: 2, end: 6 });
});

test("line prefix: toggles lists on every selected line and swaps heading levels", () => {
  assert.equal(toggleLinePrefix("one\ntwo", 0, 7, "- ").text, "- one\n- two");
  assert.equal(toggleLinePrefix("- one\n- two", 0, 11, "- ").text, "one\ntwo");
  assert.equal(toggleLinePrefix("# Title", 3, 3, "## ").text, "## Title");
  assert.equal(toggleLinePrefix("## Title", 3, 3, "## ").text, "Title");
  assert.equal(toggleLinePrefix("a\nbody\nc", 3, 3, "> ").text, "a\n> body\nc");
});

test("insert: block snippets get their own line; links select the url", () => {
  assert.deepEqual(insertText("ab", 1, 1, "---", true), { text: "a\n---\nb", start: 6, end: 6 });
  const link = insertMarkdownLink("see docs", 4, 8);
  assert.equal(link.text, "see [docs](https://)");
  assert.equal(link.text.slice(link.start, link.end), "https://");
});

test("tasks: toggles only real task lines", () => {
  const body = "- [ ] call bank\n* [x] pay rent\ntext\n1. [ ] numbered";
  assert.equal(toggleTaskAtLine(body, 1), "- [x] call bank\n* [x] pay rent\ntext\n1. [ ] numbered");
  assert.equal(toggleTaskAtLine(body, 2), "- [ ] call bank\n* [ ] pay rent\ntext\n1. [ ] numbered");
  assert.equal(toggleTaskAtLine(body, 3), body);
  assert.equal(toggleTaskAtLine(body, 4), "- [ ] call bank\n* [x] pay rent\ntext\n1. [x] numbered");
  assert.equal(toggleTaskAtLine(body, 99), body);
});

test("outline: headings with lines, code ignored", () => {
  assert.deepEqual(outline("# A\ntext\n```\n# not\n```\n### B ##"), [
    { level: 1, text: "A", line: 1 },
    { level: 3, text: "B", line: 6 },
  ]);
});

test("word count skips frontmatter and punctuation", () => {
  assert.equal(wordCount("---\ntags: a\n---\n# Hello world - **bold** 42"), 4);
  assert.equal(readingMinutes(0), 0);
  assert.equal(readingMinutes(10), 1);
  assert.equal(readingMinutes(660), 3);
});

test("link completion: detects an open [[ and closes it", () => {
  const text = "see [[Road";
  assert.deepEqual(linkQuery(text, text.length), { from: 6, query: "Road" });
  assert.equal(linkQuery("see [[Road]] x", 14), null);
  assert.equal(linkQuery("[[a\nb", 5), null);
  assert.deepEqual(completeLink(text, 6, text.length, "Roadmap"), { text: "see [[Roadmap]]", start: 15, end: 15 });
  assert.equal(completeLink("[[Ro]] end", 2, 4, "Roadmap").text, "[[Roadmap]] end");
});

test("mentions: whole words outside links and code", () => {
  assert.ok(mentionsTitle("We talked to Acme Corp today", "acme corp"));
  assert.ok(!mentionsTitle("We talked to [[Acme Corp]]", "Acme Corp"));
  assert.ok(!mentionsTitle("`Acme Corp`", "Acme Corp"));
  assert.ok(!mentionsTitle("Acmeish", "Acme"));
  assert.ok(!mentionsTitle("an ox", "ox"));
});

test("templates: valid titles, local day stamp, unique titles", () => {
  assert.equal(dayStamp(new Date(2026, 10, 8)), "2026-11-08");
  for (const template of NOTE_TEMPLATES) assert.equal(titleProblem(template.title("2026-11-08")), null, template.id);
  assert.equal(uniqueTitle("Meeting", new Set()), "Meeting");
  assert.equal(uniqueTitle("Meeting", new Set(["meeting", "meeting 2"])), "Meeting 3");
});
