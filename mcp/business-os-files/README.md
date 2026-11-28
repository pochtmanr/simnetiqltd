# Business OS MCP

Stdio MCP server for Simnetiq Business OS: files, the company profile and document checklist, tasks, and the calendar.

It talks to production (or any host) over `POST /api/business-os/mcp` using a Bearer token. Uploads read a local file path, register via the API, PUT bytes to Supabase Storage, then complete verification. Every call is recorded and shown in the admin under System → Agent activity.

## Setup

```bash
cd mcp/business-os-files
npm install
```

On the app host, set:

```bash
# Two strong random secrets; never commit them.
BUSINESS_OS_MCP_TOKEN_READ=$(openssl rand -hex 32)    # can only read
BUSINESS_OS_MCP_TOKEN_WRITE=$(openssl rand -hex 32)   # can read and change
# The member every call runs as (their user id). Required.
BUSINESS_OS_MCP_ACTOR_ID=<uuid>
```

Local MCP process env (give the agent the read token unless it should make changes):

```bash
export BUSINESS_OS_MCP_BASE_URL=https://simnetiq.com
export BUSINESS_OS_MCP_TOKEN=...the read or the write token...
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

| Tool | Access | Purpose |
|------|--------|---------|
| `company_profile_get` | read | Saved profile and copy fields for forms |
| `company_profile_update` | write | Change saved company details |
| `checklist_get` | read | Ltd document checklist, what is missing, next deadlines |
| `documents_list` | read | List by folder and tags |
| `documents_search` | read | Full-text search |
| `documents_get` | read | One document with extracted text |
| `documents_usage` | read | Used / 10 GiB quota |
| `documents_file_url` | read | Short-lived signed download/preview URL |
| `documents_upload` | write | Upload local `path` into Files |
| `documents_update` | write | Metadata / folder / tags |
| `documents_delete` | write | Delete unlinked document |
| `tasks_list` | read | Open tasks, optionally closed ones |
| `tasks_save` / `tasks_delete` | write | Create, change, complete or delete a task |
| `calendar_list` | read | Events in a date range |
| `calendar_save` / `calendar_delete` | write | Create, replace or delete an event |

## Security

- The write token can change and delete files, tasks, calendar events and the company profile, without the Telegram confirmation a person gets. Treat it like `BUSINESS_OS_JOB_SECRET`.
- The read token still exposes every document's text. Do not put either token in the public GitHub repo or client bundles.
- `documents_upload` reads any local path the MCP process can read; run it only for an agent you trust with that machine.
