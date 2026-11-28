# Files Drive + Company Card + MCP — Implementation Plan

> **For agentic workers:** Implement against `docs/superpowers/specs/2026-11-27-files-drive-design.md`.

**Goal:** Own 10 GiB Files drive with company copy card, TG access, and MCP.

**Architecture:** Harden existing Supabase Storage vault; MCP calls `POST /api/business-os/mcp`.

**Tech stack:** Next.js Business OS, Supabase Storage, `@modelcontextprotocol/sdk` (stdio).

**Spec:** `docs/superpowers/specs/2026-11-27-files-drive-design.md`

## Tasks (shipped in this change)

- [x] Company profile module + copy card
- [x] 10 GiB usage API + upload enforce + meter
- [x] DOCUMENT_LIMIT 5000 + TG Files UI
- [x] MCP HTTP dispatch + stdio server + README
- [x] Connectors stub + ops/backlog docs
