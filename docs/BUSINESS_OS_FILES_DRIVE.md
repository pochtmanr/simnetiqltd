# Business OS Files drive

Own-document vault on Azure (self-hosted Supabase Storage bucket `business-os-documents`), with a 10 GiB org quota, company copy card in the Files UI, Telegram access, and an MCP server.

## Ops: disk and backups

- Live objects: `/opt/supabase-simnetiq/stack/volumes/storage` on `core-db`.
- Nightly backup includes `storage.tar.gz` to Azure Blob container `simnetiq` on `dopplercorebackups` (see doppler-infra `azure/simnetiq`).
- Before relying on a full 10 GiB pile, confirm free disk on `core-db` is comfortably above 10 GiB plus DB growth, and that Blob lifecycle (90 days) and on-VM retention (14 days) still fit the larger tarballs.
- Quota enforcement is application-level (sum of stored `byte_size`); it does not shrink the VM disk by itself.

## MCP

See [`mcp/business-os-files/README.md`](../mcp/business-os-files/README.md). Production needs `BUSINESS_OS_MCP_TOKEN` (and optional `BUSINESS_OS_MCP_ACTOR_ID`) in `.env.production`.

## Backlog (near)

1. Editable business profile in DB (VAT number, FY dates, accountant)
2. Optional bank/payment refs behind reveal+copy
3. Wire expense `attach` in Money UI
4. Bulk select / multi-delete / multi-move
5. Folder rename + move tree
6. Trash / soft-delete
7. Duplicate detection by sha256
8. MIME expansion for submission formats
9. PDF/image text extraction for Ask/search
10. Registrations ↔ document links
11. Calendar filing deadlines
12. Source-origin bytes
13. Optional WebDAV/rclone tip
14. PWA for phone Files
15. Google Drive connector tab
16. Usage alerts at ~80% via alert bot
17. Orphan Storage cleanup job
18. Document version history
