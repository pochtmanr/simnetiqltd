import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { bytesMatchMime, extractText, formatBytes, kindOf, mimeFromName, normalizeFolder, parseTags, titleFromName } from "@/lib/business-os/files/kinds";
import { verifyStoredUpload } from "@/lib/business-os/files/verify";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);
const sha = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");

test("the stored type comes from the extension, case-insensitively", () => {
  assert.equal(mimeFromName("Invoice.PDF"), "application/pdf");
  assert.equal(mimeFromName("notes.md"), "text/markdown");
  assert.equal(mimeFromName("ledger.xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(mimeFromName("script.exe"), null);
  assert.equal(mimeFromName("no-extension"), null);
  assert.equal(kindOf("text/csv"), "text");
  assert.equal(titleFromName("Q3 report.final.pdf"), "Q3 report.final");
});

test("folders normalize to slash-joined segments and reject traversal", () => {
  assert.equal(normalizeFolder(" Finance / 2026/ "), "Finance/2026");
  assert.equal(normalizeFolder(""), "");
  assert.equal(normalizeFolder("a/../b"), null);
  assert.equal(normalizeFolder("../etc"), null);
  assert.equal(normalizeFolder("a/b/c/d/e/f/g"), null);
  assert.equal(normalizeFolder("bad*name"), null);
});

test("tags are lowercased, deduplicated, and capped at twelve", () => {
  assert.deepEqual(parseTags("Tax, tax, Q3 2026"), ["tax", "q3-2026"]);
  assert.equal(parseTags("ok, no_underscores"), null);
  assert.equal(parseTags(Array.from({ length: 13 }, (_, index) => `t${index}`)), null);
});

test("bytes must match the claimed type", () => {
  assert.equal(bytesMatchMime("application/pdf", text("%PDF-1.7 ...")), true);
  assert.equal(bytesMatchMime("application/pdf", text("<html>")), false);
  assert.equal(bytesMatchMime("image/png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)), true);
  assert.equal(bytesMatchMime("image/jpeg", bytes(0xff, 0xd8, 0xff, 0xe0)), true);
  assert.equal(bytesMatchMime("image/webp", text("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ")), true);
  assert.equal(bytesMatchMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes(0x50, 0x4b, 0x03, 0x04)), true);
  assert.equal(bytesMatchMime("text/markdown", text("# Title\n\nBody ✓")), true);
  assert.equal(bytesMatchMime("text/plain", bytes(0x41, 0x00, 0x42)), false);
  assert.equal(bytesMatchMime("text/csv", bytes(0xc3, 0x28)), false);
});

test("text files are indexed as text; other types wait for AI reading", () => {
  assert.equal(extractText("text/csv", text("﻿a,b\n1,2")), "a,b\n1,2");
  assert.equal(extractText("application/pdf", text("%PDF-")), null);
});

test("stored bytes are verified against the declared checksum and type", () => {
  const good = text("%PDF-1.4 body");
  assert.deepEqual(verifyStoredUpload({ mime: "application/pdf", declaredSha256: sha(good), bytes: good }), { checksum: sha(good) });
  assert.deepEqual(verifyStoredUpload({ mime: "application/pdf", declaredSha256: sha(text("other")), bytes: good }), { fault: "checksum_invalid" });
  const html = text("<script>");
  assert.deepEqual(verifyStoredUpload({ mime: "application/pdf", declaredSha256: sha(html), bytes: html }), { fault: "mime_invalid" });
  assert.deepEqual(verifyStoredUpload({ mime: "text/plain", declaredSha256: sha(new Uint8Array()), bytes: new Uint8Array() }), { fault: "document_too_large" });
});

test("sizes read naturally", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB");
  assert.equal(formatBytes(null), "—");
});
