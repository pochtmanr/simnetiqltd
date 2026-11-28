#!/usr/bin/env node
/**
 * Stdio MCP server for Business OS Files.
 * Calls https://<host>/api/business-os/mcp with BUSINESS_OS_MCP_TOKEN.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = (process.env.BUSINESS_OS_MCP_BASE_URL ?? "https://simnetiq.com").replace(/\/$/, "");
const TOKEN = process.env.BUSINESS_OS_MCP_TOKEN?.trim() ?? "";

type RpcOk = { result: unknown };
type RpcErr = { error: string };

async function rpc(tool: string, args: Record<string, unknown> = {}): Promise<unknown> {
  if (!TOKEN) throw new Error("BUSINESS_OS_MCP_TOKEN is not set");
  const response = await fetch(`${BASE}/api/business-os/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ tool, arguments: args }),
  });
  const payload = (await response.json().catch(() => ({}))) as RpcOk & RpcErr;
  if (!response.ok) throw new Error(payload.error || `http_${response.status}`);
  return payload.result;
}

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] };
}

async function sha256File(filePath: string): Promise<{ bytes: Buffer; sha256: string; size: number; fileName: string }> {
  const bytes = await readFile(filePath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { bytes, sha256, size: bytes.byteLength, fileName: path.basename(filePath) };
}

const TOOLS = [
  {
    name: "company_profile_get",
    description: "Return Simnetiq company copy fields (legal name, number, address, email, sites) for form fill-ins.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "documents_list",
    description: "List documents in a folder (empty string = all / root listing of metadata).",
    inputSchema: {
      type: "object",
      properties: {
        folder: { type: "string", description: "Folder path such as Finance/2026. Empty for unfiltered newest." },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "documents_search",
    description: "Full-text search over document titles, folders, vendors and extracted text.",
    inputSchema: {
      type: "object",
      properties: { q: { type: "string" } },
      required: ["q"],
      additionalProperties: false,
    },
  },
  {
    name: "documents_get",
    description: "Get one document by id, including extracted text when present.",
    inputSchema: {
      type: "object",
      properties: { documentId: { type: "string" } },
      required: ["documentId"],
      additionalProperties: false,
    },
  },
  {
    name: "documents_usage",
    description: "Return used bytes, quota (10 GiB), remaining bytes and stored file count.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "documents_upload",
    description: "Upload a local file into Business OS Files. Reads path from disk, registers, PUTs to storage, completes.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or relative path on the machine running this MCP server." },
        folder: { type: "string" },
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        vendor: { type: "string" },
        category: { type: "string" },
        project: { type: "string" },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "documents_update",
    description: "Update document metadata (title, folder, tags, vendor, category, project, documentOn).",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        title: { type: "string" },
        folder: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        vendor: { type: "string" },
        category: { type: "string" },
        project: { type: "string" },
        documentOn: { type: "string" },
      },
      required: ["documentId"],
      additionalProperties: false,
    },
  },
  {
    name: "documents_delete",
    description: "Delete a document that is not linked to another record.",
    inputSchema: {
      type: "object",
      properties: { documentId: { type: "string" } },
      required: ["documentId"],
      additionalProperties: false,
    },
  },
  {
    name: "documents_file_url",
    description: "Mint a short-lived signed URL to download or preview a stored file.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        preview: { type: "boolean" },
      },
      required: ["documentId"],
      additionalProperties: false,
    },
  },
] as const;

async function uploadFromPath(args: Record<string, unknown>) {
  const filePath = typeof args.path === "string" ? args.path : "";
  if (!filePath) throw new Error("path_required");
  const { bytes, sha256, size, fileName } = await sha256File(filePath);
  const registered = (await rpc("documents_register_upload", {
    fileName,
    size,
    sha256,
    folder: typeof args.folder === "string" ? args.folder : "",
    title: args.title,
    tags: args.tags,
    vendor: args.vendor,
    category: args.category,
    project: args.project,
  })) as { documentId: string; uploadUrl: string; mime: string; apikey?: string };

  const put = await fetch(registered.uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": registered.mime,
      ...(registered.apikey ? { apikey: registered.apikey } : {}),
    },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) {
    await rpc("documents_delete", { documentId: registered.documentId }).catch(() => null);
    throw new Error(`upload_put_failed_${put.status}`);
  }

  const completed = await rpc("documents_complete_upload", {
    documentId: registered.documentId,
    fileName,
    sha256,
  });
  return { documentId: registered.documentId, completed };
}

const server = new Server({ name: "business-os-files", version: "0.1.0" }, { capabilities: { tools: {} } });

const TOOL_NAMES = new Set<string>(TOOLS.map((tool) => tool.name));

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...TOOLS] }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  try {
    if (name === "documents_upload") return textResult(await uploadFromPath(args));
    if (!TOOL_NAMES.has(name)) throw new Error(`unknown_tool:${name}`);
    return textResult(await rpc(name, args));
  } catch (error) {
    const message = error instanceof Error ? error.message : "tool_failed";
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
