# Files Drive + Company Card + MCP — Design

**Date:** 2026-11-27  
**Status:** Approved for implementation (approach A)

## Intent

Make `/admin?section=documents` (and `/tg?section=documents`) the place to store and reopen submission documents across devices, with a Doppler-style company copy card for form fill-ins, a 10 GiB hard quota on existing Azure Supabase Storage, and an MCP surface for agents.

## Decisions

- Own vault on `business-os-documents` is the Drive (no MinIO/Nextcloud/Google day one).
- Quota: 10 GiB (`10 * 1024^3`).
- Connectors stub reserves Google Drive for later.
- Company card fields = public Doppler set; no IBAN in v1.
- MCP under `mcp/business-os-files`, stdio, `BUSINESS_OS_MCP_TOKEN`.

## Approaches considered

- **A (chosen):** Harden existing Files + Storage + Blob backups.
- **B:** Separate OSS drive on VPS — overkill at 10 GiB.
- **C:** Google Drive day one — deferred.

## Non-goals

Google/OneDrive OAuth, separate object store, full Registrations, OCR/AI PDF extraction, public share links.

## Follow-ups

Editable DB business profile, bank refs behind reveal, expense attach UI, bulk ops, trash, duplicates, Ask tools, Google connector, usage alerts, orphan cleanup, version history.
