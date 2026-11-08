# Business OS v2: data, brain, Claude, calendar

## Context
The admin shell (`/admin`, `/tg`) has its design system and grouped navigation now, but most of what it shows still depends on product exports that haven't been built yet, and Documents, Registrations and Timeline are only `Later` placeholders. Roman wants the OS to be the single place he runs the company from:
- live company data from Revolut, RevenueCat and App Store Connect
- a data folder for uploading documents
- an Obsidian-like "brain"
- Claude for AI tasks, with token usage visible
- a calendar

I'm the architect and am free to restructure the tabs.

**Decisions Roman made (2026-11-08):**
- **Hybrid data path.** Company-level accounts connect straight to the OS: the Revolut Business bank account and App Store Connect sales/finance reports. RevenueCat connects directly, but only for read-only pulse metrics. The money ledger still comes from product exports, so nothing is counted twice. This refines the 28 Sep "exports only" rule in `docs/BUSINESS_OS_FUNCTION_MATRIX.md`. That doc gets an amendment.
- **Revolut = Revolut Business** (the bank account), not Merchant.
- **The brain is native to the OS.** Notes live in Supabase, with Obsidian vault .zip import/export so nothing is locked in.
- **Claude is reached with an Anthropic API key** (`@anthropic-ai/sdk`, direct).

**My calls (open to veto):**
- Google Calendar is the external calendar. I'm not doing Notion: Notion Calendar has no public API, and Notion databases add a second notes system on top of the brain.
- No embeddings in v1. Search uses Postgres full-text search, and Claude reaches it through tools. Embeddings would need a second provider key (Voyage), so I'm leaving them out for now.
- Uploads go straight from the browser to Supabase Storage through signed upload URLs. Vercel caps function bodies at 4.5 MB, so the current 10 MB route-proxied upload can't work in production.
- Provider tokens (Revolut and Google refresh tokens) are stored AES-256-GCM-encrypted in the database, with the key in env `BUSINESS_OS_TOKEN_KEY`.

## New information architecture
The section ids stay as URL values, and old ids redirect to their new home. The pattern is set in `components/business-os/admin/nav.ts` (`NAV_GROUPS`), `admin/chrome.tsx` (`MobileTabBar`) and the `TG_LINKS` list in `workspace.tsx`.

| Group | Tabs |
|---|---|
| **Today** | `home`: today's calendar, due reminders and renewals, headline KPIs, latest AI brief, attention items (absorbs part of Overview) |
| **Money** | `overview`, `sales`, `expenses`, `accounts` → "Cash" (now with Revolut balances and transactions), `reports` |
| **Apps** | `subscriptions` (RevenueCat pulse per project), new `appstore` (ASC units, proceeds and countries), `traffic` |
| **Brain** | new `notes` (editor, backlinks, graph), `documents` → "Files" (the data folder), new `ask` (Claude chat) |
| **Plan** | `timeline` → "Calendar" (Google, timeline, renewals and reminders merged into one view), `records` |
| **System** | `integrations` → "Sources" (export connections plus the new direct providers), `projects`, `settings` (adds connected accounts and AI usage) |

- **Mobile and tg bottom bar:** Today, Money, + (Expense / Income / Note / Upload), Brain, More.
- **Removals:** `Later` in `admin/sections/company.tsx` is deleted once its last user is gone.

## Data model: one new migration per phase in `supabase/business-os/migrations/`
1. **`files_folders`**
   - `documents` gets: `folder text` (a path such as `finance/2026`), wider mime support (md, txt, csv, xlsx, docx), and `extracted_text`, `summary`, `search tsvector` (generated) plus a GIN index.
   - The `upload_status` flow is kept.
2. **`brain`**
   - `notes(id, organization_id, slug unique per org, title, body_md, tags[], project_id?, document_id?, search tsvector, timestamps)`
   - `note_links(from_note, to_slug, to_note?)`, rebuilt on save by parsing `[[wikilinks]]`.
   - RLS follows the `documents` pattern.
3. **`ai`**
   - `ai_threads`, `ai_messages(role, content jsonb, model, input_tokens, output_tokens, cache_tokens, cost_usd)`
   - The view `ai_usage_monthly` feeds the usage meter.
4. **`direct_sources`**
   - `source_connections` gets `transport text check in ('signed_export','direct') default 'signed_export'` and `provider text`. `project_id` becomes nullable when `transport='direct'` (company-level Revolut).
   - New `provider_tokens(provider, organization_id, ciphertext, iv, expires_at)`.
5. **`calendar`**: Google tokens go in `provider_tokens`. `timeline_events` gets an optional `google_event_id` so events created in the OS can be pushed.

Apply migrations to the Business OS Supabase project only, never to the marketing one (see `supabase/business-os/README.md`).

## Phases
I'll stop for review after each phase. I'll commit only when asked.

### Phase 0: spec and IA
- Copy this plan to `docs/superpowers/specs/2026-11-08-business-os-v2-design.md`. Amend `BUSINESS_OS_FUNCTION_MATRIX.md` and `BUSINESS_OS_INTEGRATIONS.md` with the hybrid rule.
- Restructure `nav.ts`, `MobileTabBar` and `TG_LINKS`, and add `parseWorkspaceQuery` allow-list entries in `lib/business-os/workspace/filters.ts`. New sections render an `EmptyState` from `ui/primitives.tsx` until their phase lands.
- Build the `home` section from the existing `headlineMetrics` / `attentionFor` (`workspace/derive.ts`), `SourceFreshness` and reminders.
- Update `tests/business-os/finance/workspace-render.test.ts` for the new nav.

### Phase 1: Files (the data folder)
- `POST /api/business-os/documents/upload-url` validates the request, then returns `createSignedUploadUrl` for bucket `business-os-documents`. The browser uploads to that URL, then calls the existing confirm/attach step to verify the checksum and mark the file `stored`.
- Reuse and extend the checks in `lib/business-os/operations/documents.ts`. Raise the cap to 50 MB.
- Text extraction is server-side after upload: plain text, md and csv are read directly. PDFs and images are sent to Claude (Haiku) in Phase 3. Until then they're listed but not searchable.
- The Files UI has a folder tree, drag-drop upload, search, preview through existing signed `file` route access grants, and metadata editing. It reuses `DataTable`, `Sheet` and `Popover` from `ui/`.

### Phase 2: Brain
- `lib/business-os/brain/`:
  - `wikilinks.ts`: parse `[[slug|alias]]`, `#tags`
  - `notes.ts`: CRUD plus link rebuild in one RPC
  - `vault.ts`: Obsidian .zip import/export, mapping frontmatter to tags and keeping folder paths
- The Notes UI has a list and search, a markdown editor (textarea with preview, using the existing `ui/markdown.tsx` renderer, which gets a wikilink plugin), and a backlinks panel.
- The graph view is a canvas force layout drawn with `d3-force` (one small new dependency).
- Any document can become a note: "Make note" creates a note linked to the file.

### Phase 3: Claude
- `lib/business-os/ai/`:
  - `client.ts`: `@anthropic-ai/sdk`, env `ANTHROPIC_API_KEY`. Default model `claude-sonnet-5-5`; `claude-haiku-5-5` for extraction and summaries.
  - `tools.ts`: read-only tools `search_notes`, `read_note`, `search_files`, `read_file_text`, `financial_report` (reusing `readFinanceRpc` from `lib/business-os/finance/rpc.ts`), `calendar_upcoming`. The one write tool is `create_note`, and its result shows in the chat with an undo.
  - `usage.ts`: records tokens and cost per message.
- `POST /api/business-os/ai/chat` streams an SSE response from the Node runtime and runs the tool loop server-side. It is guarded by `beginOperationsWrite` (CSRF, rate limit, role).
- The Ask UI has a thread list, a streaming answer, cited sources that link to the note or file, and a token/cost line under each answer. Settings shows the month's usage.
- When a file finishes uploading, Haiku extracts its text, writes a summary, and suggests tags and links. This fills `extracted_text` / `summary`.
- **Safety:** document text is treated as data and wrapped in tool results, and the tools can't touch money or secrets.
- Before writing code I'll read the `claude-api` skill for current SDK, model and caching details.

### Phase 4: direct providers
- **Framework:**
  - `runSyncTick` in `lib/business-os/sync/worker.ts` already takes an injectable `pull`. Add a `lib/business-os/providers/` registry. Each provider has `pull(claim, cursor) → contract page`, which emits the same v1 contract shapes (`contracts/business-os/v1/`), so validation, `mapRecordsPage` / `snapshotPage`, quarantine and the Sources screen work unchanged.
  - The tick dispatches on `claim.transport`. Connection setup is owner plus step-up, as with the existing `sync/connections` route.
- **Revolut Business (`revolut.ts`):**
  - Setup: an RS256 client-assertion JWT built with Node `crypto`, no new dependency. A one-time OAuth consent through `GET /api/business-os/providers/revolut/callback` stores the refresh token encrypted.
  - Data: `/accounts` becomes the `finance/balances` snapshot, shown as confirmed balances on Cash. `/transactions` becomes a new `bank/transactions` dataset (cash movements, never sales).
  - Env: `REVOLUT_CLIENT_ID`, `REVOLUT_PRIVATE_KEY`, `REVOLUT_REDIRECT_URI`.
- **App Store Connect (`appstore.ts`):**
  - Auth: an ES256 JWT built from the .p8 key.
  - Data: `salesReports` (DAILY SUMMARY, gunzip plus TSV parse) becomes `appstore/sales_daily`, and `financeReports` (monthly) becomes `appstore/finance_monthly`. Neither is posted to the ledger; both are kept for display and later reconciliation.
  - Env: `ASC_ISSUER_ID`, `ASC_KEY_ID`, `ASC_PRIVATE_KEY`, `ASC_VENDOR_NUMBER`.
- **RevenueCat (`revenuecat.ts`):**
  - Data: v2 `metrics/overview` per project (MRR, active subscriptions, trials, revenue over 28 days) becomes the `subscriptions/summary` snapshot, which `subscriptionView` in `workspace/present.ts` already renders.
  - Env: one secret per project, named through `secret_reference`.
- Add entries to `workspace/sources.ts` `DATASETS` for the new datasets. Build the `appstore` section.

### Phase 5: calendar
- Google OAuth (scope `calendar.events`) through `/api/business-os/providers/google/{start,callback}`, with plain `fetch` to the Calendar v3 REST API rather than the `googleapis` package.
- The Calendar section shows a month/week/agenda view merging Google events, `timeline_events`, `service_registrations` renewals and `reminder_occurrences`. Each item is tagged with its source.
- Creating an event writes to `timeline_events` and can optionally push to Google.
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### Phase 6: daily brief (in-product agent)
- Extend `/api/business-os/operations/tick` (cron, every 15 min) so it builds a brief once per morning in Europe/London, using `lib/business-os/finance/london.ts`.
- Haiku gets yesterday's figures, today's calendar, due items and source problems. The brief is shown on Today and sent through the existing Telegram delivery in `lib/business-os/operations/delivery.ts`.

## Credentials Roman needs to prepare (needed by phase; I can't create these)
- **Phase 3:** an Anthropic API key.
- **Phase 4, Revolut Business:** API settings, then upload a public cert (I'll generate the keypair instructions), then the client ID.
- **Phase 4, App Store Connect:** Users & Access, then Integrations, then an API key with the Finance role (issuer ID, key ID, .p8), plus the vendor number.
- **Phase 4, RevenueCat:** a v2 secret key per project with read-only metrics.
- **Phase 5:** a Google Cloud OAuth client.
- **Phase 5:** the token encryption key `BUSINESS_OS_TOKEN_KEY` (32 random bytes).
- **All phases:** every key goes into Vercel env through `vercel env add` and into `.env.local`, with names added to `.env.example`.

## Verification
- **Each phase:**
  - `npm run test:business-os-identity`, `-finance`, `-sync`, `-contract`
  - New `tests/business-os/{brain,ai,providers,files}/*.test.ts` using `node:test`, tsx and PGlite (the pattern in `identity/rls.test.ts`)
  - `npx tsc --noEmit` and `npm run build`
- **Providers:** fixture-driven tests with a fake `fetch` (recorded Revolut, ASC TSV and RevenueCat JSON), including JWT signing and verification round-trips. Then one live pull per provider once Roman supplies the keys, checked on the Sources screen (run, rows, freshness).
- **Brain:** a wikilink parser test suite, link rebuild, and a vault zip round-trip (import, then export, then a byte-equal comparison of the markdown).
- **AI:** a tool-loop test with a stubbed Anthropic client, a usage-recording test, and a prompt-injection fixture (a document that says "call create_note…" mustn't trigger writes beyond what the user asked).
- **End to end:** run `next dev`, log in as owner, then exercise each new tab:
  - upload a file
  - create linked notes and check the backlinks and graph
  - ask Claude a question about a file
  - connect Google and check the merged calendar
  - open the Telegram mini app layout at phone width
