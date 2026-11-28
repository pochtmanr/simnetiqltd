# Business OS Files MCP

Stdio MCP server with full access to Simnetiq Business OS Files and the company copy profile.

It talks to production (or any host) over `POST /api/business-os/mcp` using a Bearer token. Uploads read a local file path, register via the API, PUT bytes to Supabase Storage, then complete verification.

## Setup

```bash
cd mcp/business-os-files
npm install
```

On the app host, set:

```bash
# Strong random secret; never commit it.
BUSINESS_OS_MCP_TOKEN=$(openssl rand -hex 32)
# Optional: pin the membership user used for document RPCs (defaults to first owner).
# BUSINESS_OS_MCP_ACTOR_ID=<uuid>
```

Local MCP process env:

```bash
export BUSINESS_OS_MCP_BASE_URL=https://simnetiq.com
export BUSINESS_OS_MCP_TOKEN=...same as production...
```

## Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "business-os-files": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/simnetiqcom/mcp/business-os-files/src/index.ts"],
      "env": {
        "BUSINESS_OS_MCP_BASE_URL": "https://simnetiq.com",
        "BUSINESS_OS_MCP_TOKEN": "replace-me"
      }
    }
  }
}
```

Or: `"command": "npm", "args": ["run", "start"], "cwd": ".../mcp/business-os-files"`.

## Tools

| Tool | Purpose |
|------|---------|
| `company_profile_get` | Legal name, company number, VAT, address, email, sites |
| `documents_list` | List by folder |
| `documents_search` | Full-text search |
| `documents_get` | One document (+ extracted text when present) |
| `documents_usage` | Used / 10 GiB quota |
| `documents_upload` | Upload local `path` into Files |
| `documents_update` | Metadata / folder / tags |
| `documents_delete` | Delete unlinked document |
| `documents_file_url` | Short-lived signed download/preview URL |

## Security

- Token is equivalent to write access on the document vault. Treat it like `BUSINESS_OS_JOB_SECRET`.
- Do not put the token in the public GitHub repo or client bundles.
- Prefer a dedicated token (not reusing the job secret).
