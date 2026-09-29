import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { NextRequest } from "next/server";
import { buildRobotsTxt } from "@/app/robots.txt/route";
import { buildLlmsTxt } from "@/lib/llms-txt";
import { proxy } from "@/proxy";
import sitemap from "@/app/sitemap";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path;
  });
}

test("private paths skip locale redirects and public paths still redirect", () => {
  for (const path of ["/admin", "/tg", "/login", "/admin/settings"]) {
    const response = proxy(new NextRequest(`https://simnetiq.com${path}`));
    assert.ok(response);
    assert.equal(response.headers.get("location"), null);
  }
  const home = proxy(new NextRequest("https://simnetiq.com/"));
  assert.ok(home);
  assert.equal(new URL(home.headers.get("location") ?? "").pathname, "/en");
  assert.equal(proxy(new NextRequest("https://simnetiq.com/en")), undefined);
});

test("private routes stay out of robots, sitemap, and llms text", () => {
  const robots = buildRobotsTxt();
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/tg/);
  assert.match(robots, /Disallow: \/login/);
  const urls = sitemap().map((entry) => entry.url);
  assert.equal(urls.some((url) => /\/(admin|tg|login)(\/|$)/.test(url)), false);
  const llms = buildLlmsTxt("en");
  assert.equal(llms.includes("/admin") || llms.includes("/tg") || llms.includes("/login"), false);
});

test("business os client code has no public secrets, signup, or marketing analytics", () => {
  const files = [
    ...walk(join(root, "lib/business-os")),
    ...walk(join(root, "app/(business)")),
    ...walk(join(root, "app/api/business-os")),
    ...walk(join(root, "components/business-os")),
  ];
  const source = files.map((path) => readFileSync(path, "utf8")).join("\n");
  assert.equal(source.includes("NEXT_PUBLIC_"), false);
  assert.equal(source.includes(".signUp("), false);
  assert.equal(source.includes("@vercel/analytics"), false);
  assert.equal(source.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  const layout = readFileSync(join(root, "app/(business)/layout.tsx"), "utf8");
  assert.equal(layout.includes("Navigation"), false);
  assert.equal(layout.includes("<Analytics"), false);
});
