import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SIDEBAR_PREFS, parseSidebarPrefs, serializeSidebarPrefs } from "@/components/business-os/admin/sidebar-prefs";

test("round-trips through the cookie encoding", () => {
  const prefs = { collapsed: true, folded: ["money"], hidden: ["project:argus", "traffic"] };
  assert.deepEqual(parseSidebarPrefs(serializeSidebarPrefs(prefs)), prefs);
  assert.deepEqual(parseSidebarPrefs(decodeURIComponent(serializeSidebarPrefs(prefs))), prefs);
});

test("falls back to defaults on missing or malformed values", () => {
  assert.deepEqual(parseSidebarPrefs(undefined), DEFAULT_SIDEBAR_PREFS);
  assert.deepEqual(parseSidebarPrefs("not json"), DEFAULT_SIDEBAR_PREFS);
  assert.deepEqual(parseSidebarPrefs("%7Bbroken"), DEFAULT_SIDEBAR_PREFS);
  assert.deepEqual(parseSidebarPrefs("null"), DEFAULT_SIDEBAR_PREFS);
});

test("drops unexpected keys, types and duplicates", () => {
  const raw = JSON.stringify({ collapsed: "yes", folded: ["money", "money", 3, "<script>"], hidden: "traffic", extra: 1 });
  assert.deepEqual(parseSidebarPrefs(raw), { collapsed: false, folded: ["money"], hidden: [] });
});
