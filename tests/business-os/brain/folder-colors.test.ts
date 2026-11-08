import assert from "node:assert/strict";
import test from "node:test";
import { FOLDER_PALETTE, folderColor, folderHue, parseFolderColors, topFolder } from "@/components/business-os/admin/brain/note-shared";

test("folder colours: subfolders share the top-level folder's colour", () => {
  assert.equal(topFolder("Projects/Doppler/2026"), "Projects");
  assert.equal(folderHue("Projects/Doppler"), folderHue("Projects"));
  assert.equal(folderColor("Projects/Doppler/2026"), folderColor("Projects"));
});

test("folder colours: top-level notes are neutral", () => {
  assert.equal(folderHue(""), null);
  assert.equal(folderColor(""), "var(--bos-muted)");
  assert.equal(folderColor("", { "": FOLDER_PALETTE[0] }), "var(--bos-muted)");
});

test("folder colours: the automatic colour is stable and from the palette", () => {
  for (const name of ["Admin panel", "Projects", "Clients", "Meetings", "Daily", "Ünïcode 📁"]) {
    const hue = folderHue(name);
    assert.ok(hue !== null && Number.isInteger(hue) && hue >= 0 && hue < FOLDER_PALETTE.length);
    assert.equal(folderColor(name), FOLDER_PALETTE[hue]);
  }
  assert.notEqual(folderColor("Admin panel"), folderColor("Projects"));
});

test("folder colours: a pick overrides the folder and its subfolders", () => {
  const picked = { Projects: FOLDER_PALETTE[1] };
  assert.equal(folderColor("Projects", picked), FOLDER_PALETTE[1]);
  assert.equal(folderColor("Projects/Doppler", picked), FOLDER_PALETTE[1]);
  assert.equal(folderColor("Admin panel", picked), folderColor("Admin panel"));
});

test("folder colours: stored picks keep only palette colours", () => {
  assert.deepEqual(parseFolderColors(null), {});
  assert.deepEqual(parseFolderColors("not json"), {});
  assert.deepEqual(parseFolderColors("[1]"), {});
  const raw = JSON.stringify({ Projects: FOLDER_PALETTE[2], Evil: "red;background:url(x)", "": FOLDER_PALETTE[0] });
  assert.deepEqual(parseFolderColors(raw), { Projects: FOLDER_PALETTE[2] });
});
