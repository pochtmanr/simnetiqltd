import assert from "node:assert/strict";
import test from "node:test";
import { buildFolderTree, folderAncestors } from "@/components/business-os/admin/brain/note-shared";

const note = (title: string, folder: string) => ({ title, folder });

test("folder tree: groups notes by folder path, folders first and sorted", () => {
  const tree = buildFolderTree([
    note("Projects", ""),
    note("Doppler VPN", "Doppler VPN"),
    note("Doppler Android", "Doppler VPN/Apps"),
    note("Doppler Windows", "Doppler VPN/Apps"),
    note("SMS Code", "SMS Code"),
  ]);
  assert.deepEqual(tree.notes.map((item) => item.title), ["Projects"]);
  assert.deepEqual(tree.folders.map((item) => item.path), ["Doppler VPN", "SMS Code"]);
  const doppler = tree.folders[0];
  assert.equal(doppler.name, "Doppler VPN");
  assert.equal(doppler.count, 3);
  assert.deepEqual(doppler.notes.map((item) => item.title), ["Doppler VPN"]);
  assert.deepEqual(doppler.folders.map((item) => [item.name, item.path, item.count]), [["Apps", "Doppler VPN/Apps", 2]]);
});

test("folder tree: keeps the given note order inside a folder", () => {
  const tree = buildFolderTree([note("b", "X"), note("a", "X")]);
  assert.deepEqual(tree.folders[0].notes.map((item) => item.title), ["b", "a"]);
});

test("folder ancestors: every path from the top down", () => {
  assert.deepEqual(folderAncestors(""), []);
  assert.deepEqual(folderAncestors("Doppler VPN"), ["Doppler VPN"]);
  assert.deepEqual(folderAncestors("Doppler VPN/Apps/iOS"), ["Doppler VPN", "Doppler VPN/Apps", "Doppler VPN/Apps/iOS"]);
});
