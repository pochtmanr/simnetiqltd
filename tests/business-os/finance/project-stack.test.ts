import assert from "node:assert/strict";
import test from "node:test";
import { PROJECT_STACKS } from "@/lib/business-os/projects/stack";

test("project stacks use unique slugs that match the seeded projects", () => {
  const slugs = PROJECT_STACKS.map((stack) => stack.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual([...slugs].sort(), ["doppler", "smscode"]);
});

test("project stack links are https and never expose a raw IP address", () => {
  const ipv4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/;
  for (const stack of PROJECT_STACKS) {
    for (const group of stack.groups) {
      for (const link of group.links) {
        if (link.href) assert.match(link.href, /^https:\/\//, `${stack.slug}: ${link.label}`);
        for (const text of [link.label, link.href ?? "", link.note ?? ""]) {
          assert.doesNotMatch(text, ipv4, `${stack.slug}: ${link.label}`);
        }
      }
    }
    for (const host of stack.servers ?? []) {
      if (host.href) assert.match(host.href, /^https:\/\//);
      for (const server of host.servers) {
        for (const text of [server.place, server.role ?? "", host.note ?? ""]) assert.doesNotMatch(text, ipv4, `${stack.slug}: ${server.place}`);
      }
    }
  }
});

test("every provider logo is a file in public", async () => {
  const { existsSync } = await import("node:fs");
  for (const stack of PROJECT_STACKS) {
    for (const host of stack.servers ?? []) {
      if (host.logo) assert.ok(existsSync(`public${host.logo}`), host.logo);
    }
  }
});
