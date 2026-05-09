import { readFileSync } from "node:fs";
import { join } from "node:path";

const MESSAGES_DIR = join(process.cwd(), "messages");
const SOURCE_LOCALE = "en";
const TARGET_LOCALES = ["he", "ru"];

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function loadLocale(locale: string): Json {
  const path = join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(readFileSync(path, "utf8")) as Json;
}

function collectPaths(value: Json, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [prefix];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => collectPaths(item, `${prefix}[${i}]`));
  }
  return Object.entries(value).flatMap(([k, v]) =>
    collectPaths(v, prefix ? `${prefix}.${k}` : k)
  );
}

function diff(a: string[], b: string[]): { onlyInA: string[]; onlyInB: string[] } {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    onlyInA: a.filter((p) => !setB.has(p)),
    onlyInB: b.filter((p) => !setA.has(p)),
  };
}

const sourcePaths = collectPaths(loadLocale(SOURCE_LOCALE));
let hadError = false;

for (const locale of TARGET_LOCALES) {
  const targetPaths = collectPaths(loadLocale(locale));
  const { onlyInA: missing, onlyInB: extra } = diff(sourcePaths, targetPaths);

  if (missing.length === 0 && extra.length === 0) {
    console.log(`[check-i18n] ${locale}.json: OK (${targetPaths.length} keys)`);
    continue;
  }

  hadError = true;
  console.error(`\n[check-i18n] ${locale}.json: MISMATCH`);
  if (missing.length > 0) {
    console.error(`  Missing in ${locale}.json (${missing.length}):`);
    for (const p of missing) console.error(`    - ${p}`);
  }
  if (extra.length > 0) {
    console.error(`  Extra in ${locale}.json (${extra.length}, not in en.json):`);
    for (const p of extra) console.error(`    - ${p}`);
  }
}

if (hadError) {
  console.error(
    `\n[check-i18n] Translation parity FAILED. Fix ${TARGET_LOCALES.join(", ")}.json so every key from en.json is present and no extra keys exist.`
  );
  process.exit(1);
}

console.log(
  `\n[check-i18n] All locales in sync (${sourcePaths.length} keys, source: ${SOURCE_LOCALE}).`
);
