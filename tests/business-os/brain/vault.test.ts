import assert from "node:assert/strict";
import test from "node:test";
import { batchFiles, countInFolders, detectStripRoot, exportFileName, isNotePath, planImport, skipReason } from "@/lib/business-os/brain/vault";

test("vault: only Markdown outside settings, trash and zip metadata counts as a note", () => {
  assert.equal(isNotePath("Vault/Clients/Acme.md"), true);
  assert.equal(isNotePath("Vault/Clients/Acme.MD"), true);
  assert.equal(isNotePath("Vault/logo.png"), false);
  assert.equal(isNotePath("Vault/.obsidian/workspace.md"), false);
  assert.equal(isNotePath(".trash/Old.md"), false);
  assert.equal(isNotePath("__MACOSX/Vault/._Acme.md"), false);
});

test("vault: the top folder is dropped only when every file shares it", () => {
  assert.equal(detectStripRoot(["My Vault/A.md", "My Vault/Clients/B.md"]), true);
  assert.equal(detectStripRoot(["A/x.md", "B/y.md"]), false);
  assert.equal(detectStripRoot(["A/x.md", "y.md"]), false);
  assert.equal(detectStripRoot([]), false);
});

test("vault: plan counts left-out files and skips repeated titles", () => {
  const plan = planImport([{ path: "V/A.md" }, { path: "V/img.png" }, { path: "V/Sub/a.md" }, { path: "V/.obsidian/app.json" }, { path: "V/B.md" }]);
  assert.deepEqual(plan.notes.map((file) => file.path), ["V/A.md", "V/B.md"]);
  assert.equal(plan.leftOut, 2);
  assert.deepEqual(plan.duplicates, [{ path: "V/Sub/a.md", reason: "duplicate_title" }]);
});

test("vault: folder count follows stripRoot", () => {
  const paths = ["V/A.md", "V/Clients/B.md"];
  assert.equal(countInFolders(paths, false), 2);
  assert.equal(countInFolders(paths, true), 1);
});

test("vault: batches cap at 200 files and about 3 MB", () => {
  const small = Array.from({ length: 450 }, (_, index) => ({ path: `${index}.md`, body: "x" }));
  assert.deepEqual(batchFiles(small).map((batch) => batch.length), [200, 200, 50]);
  const big = Array.from({ length: 3 }, (_, index) => ({ path: `${index}.md`, body: "x".repeat(600_000) }));
  assert.deepEqual(batchFiles(big).map((batch) => batch.length), [1, 1, 1]);
  assert.deepEqual(batchFiles([]), []);
});

test("vault: skip codes read as plain English and the export name carries the date", () => {
  assert.match(skipReason("note_too_large"), /200,000/);
  assert.equal(skipReason("upload_failed"), "The upload failed — try again.");
  assert.equal(skipReason("something_new"), "It couldn’t be imported.");
  assert.equal(exportFileName(new Date(2026, 10, 8)), "business-os-notes-2026-11-08.zip");
});
