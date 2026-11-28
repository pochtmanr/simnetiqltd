import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { mcpActorId, mcpTokenKind } from "@/lib/business-os/mcp/auth";
import { activitySummary, dispatchMcpTool, MCP_TOOL_ACCESS, MCP_TOOLS } from "@/lib/business-os/mcp/dispatch";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const ACTOR = "00000000-0000-4000-8000-000000000001";

test("the two tokens map to read and write; anything else is refused", () => {
  process.env.BUSINESS_OS_MCP_TOKEN_READ = "read-secret";
  process.env.BUSINESS_OS_MCP_TOKEN_WRITE = "write-secret";
  assert.equal(mcpTokenKind("Bearer read-secret"), "read");
  assert.equal(mcpTokenKind("Bearer write-secret"), "write");
  assert.equal(mcpTokenKind("Bearer nope"), null);
  assert.equal(mcpTokenKind("read-secret"), null);
  assert.equal(mcpTokenKind(null), null);
  delete process.env.BUSINESS_OS_MCP_TOKEN_READ;
  delete process.env.BUSINESS_OS_MCP_TOKEN_WRITE;
  // An unset token must not match an empty bearer.
  assert.equal(mcpTokenKind("Bearer "), null);
});

test("the actor must be configured as a user id", () => {
  delete process.env.BUSINESS_OS_MCP_ACTOR_ID;
  assert.equal(mcpActorId(), null);
  process.env.BUSINESS_OS_MCP_ACTOR_ID = "owner";
  assert.equal(mcpActorId(), null);
  process.env.BUSINESS_OS_MCP_ACTOR_ID = ACTOR;
  assert.equal(mcpActorId(), ACTOR);
  delete process.env.BUSINESS_OS_MCP_ACTOR_ID;
});

test("a read token cannot call any tool that changes something", async () => {
  const writes = MCP_TOOLS.filter((tool) => MCP_TOOL_ACCESS[tool] === "write");
  assert.ok(writes.includes("tasks_save") && writes.includes("documents_delete") && writes.includes("company_profile_update") && writes.includes("calendar_save"));
  for (const tool of writes) {
    assert.deepEqual(await dispatchMcpTool(tool, {}, { actorId: ACTOR, kind: "read" }), { ok: false, error: "read_only_token", status: 403 }, tool);
  }
  // Names that change data must be marked as writes.
  for (const tool of MCP_TOOLS) {
    if (/_(save|update|delete|upload|register_upload|complete_upload)$/.test(tool)) assert.equal(MCP_TOOL_ACCESS[tool], "write", tool);
  }
  assert.deepEqual(await dispatchMcpTool("toString", {}, { actorId: ACTOR, kind: "write" }), { ok: false, error: "unknown_tool", status: 400 });
});

test("bad arguments are refused before the database is asked", async () => {
  const write = { actorId: ACTOR, kind: "write" as const };
  assert.equal((await dispatchMcpTool("tasks_delete", { taskId: "x" }, write)).ok, false);
  assert.deepEqual(await dispatchMcpTool("tasks_save", { id: "x", title: "t" }, write), { ok: false, error: "invalid_body", status: 400 });
  assert.deepEqual(await dispatchMcpTool("company_profile_update", {}, write), { ok: false, error: "invalid_body", status: 400 });
  assert.deepEqual(await dispatchMcpTool("calendar_list", { from: "tomorrow" }, write), { ok: false, error: "calendar_dates_invalid", status: 400 });
  assert.deepEqual(await dispatchMcpTool("documents_get", { documentId: "1" }, write), { ok: false, error: "invalid_body", status: 400 });
});

test("the activity summary keeps short scalars and never long text or nested values", () => {
  const summary = activitySummary({ title: "File the statement", notes: "x".repeat(200), tags: ["a"], preview: true });
  assert.match(summary, /^title: File the statement, notes: x{57}…, tags, preview: true$/);
  assert.ok(activitySummary({ a: "y".repeat(60), b: "y".repeat(60), c: "y".repeat(60), d: "y".repeat(60), e: "y".repeat(60), f: "y".repeat(60), g: "y".repeat(60), h: "y".repeat(60), i: "y".repeat(60) }).length <= 500);
});

test("the stdio server offers exactly the server's tools (upload wraps register and complete)", () => {
  const source = readFileSync(join(root, "mcp/business-os-files/src/index.ts"), "utf8");
  const offered = [...source.matchAll(/^    name: "([a-z_]+)",$/gm)].map((match) => match[1]).sort();
  const expected = MCP_TOOLS.filter((tool) => tool !== "documents_register_upload" && tool !== "documents_complete_upload").concat("documents_upload").sort();
  assert.deepEqual(offered, expected);
});
