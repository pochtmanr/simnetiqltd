import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const api = join(root, "app/api/business-os");

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routes(path);
    return name === "route.ts" ? [relative(api, dirname(path))] : [];
  });
}

/** Everyday writes: a writer role is enough and the Telegram confirmation never opens. */
const EVERYDAY = [
  "calendar/events",
  "calendar/events/delete",
  "calendar/events/update",
  "documents/attach",
  "documents/complete",
  "documents/delete", // asks only for stored files; see the assertion below
  "documents/source",
  "documents/update",
  "documents/upload",
  "documents/upload-url",
  "notes/delete",
  "notes/import",
  "notes/save",
  "operations/events",
  "registry",
];

/** Sensitive writes: these must keep asking for a confirmed browser. */
const SENSITIVE = ["bank/category", "bank/rules", "operations/schedules"];
const OWNER = ["operations/reminders", "providers/revolut/connect", "providers/revolut/disconnect"];

const source = (route: string) => readFileSync(join(api, route, "route.ts"), "utf8");

test("every route that uses an operations guard is in exactly one tier", () => {
  const guarded = routes(api).filter((route) => /beginOperations(Write|Sensitive|Owner)\(/.test(source(route)));
  assert.deepEqual(guarded.sort(), [...EVERYDAY, ...SENSITIVE, ...OWNER].sort());
});

test("each tier uses its guard", () => {
  for (const route of EVERYDAY) assert.match(source(route), /beginOperationsWrite\(/, route);
  for (const route of SENSITIVE) assert.match(source(route), /beginOperationsSensitive\(/, route);
  for (const route of OWNER) assert.match(source(route), /beginOperationsOwner\(/, route);
});

test("deleting a stored file still needs a confirmed browser", () => {
  assert.match(source("documents/delete"), /uploadStatus !== "pending" && profile\.assurance !== "aal2"/);
});

test("finance writes keep the confirming guard", () => {
  const guard = readFileSync(join(root, "lib/business-os/finance/route-guard.ts"), "utf8");
  assert.match(guard, /assertStepUp\(identity\.profile\.assurance\)/);
  const operations = readFileSync(join(root, "lib/business-os/operations/route-guard.ts"), "utf8");
  const everyday = operations.slice(operations.indexOf("export async function beginOperationsWrite"), operations.indexOf("export async function beginOperationsSensitive"));
  assert.doesNotMatch(everyday, /assertStepUp/);
});
