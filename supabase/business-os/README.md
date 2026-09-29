# Business OS database

M1 owns this directory. C0 owns `contracts/business-os/v1` and is unchanged by identity work.

Apply these files only in the closed eSIM project [pwvtjuklkfelpxzxjmsi](https://supabase.com/dashboard/project/pwvtjuklkfelpxzxjmsi), in the SQL editor, in this order. eSIM accounts are already gone. You run the files; this repo does not apply them remotely.

1. `migrations/20260929000000_reset_reused_project.sql`
2. `migrations/20260929120000_identity_foundation.sql`
3. `migrations/20260929150000_finance_core.sql`
4. `migrations/20260929180000_project_pulls.sql`
5. `migrations/20260929210000_reconciliation.sql`
6. `migrations/20260929240000_documents_registry.sql`

The reset aborts if it sees VisaPassage or Doppler tables. Do not open those projects for this list. The failed run rolled back, so run file 1 again from the top. After it succeeds, delete any leftover eSIM buckets in that project's Storage screen, then run files 2–6. The SQL does not delete storage rows.

Point the databases in this order, and do not swap them:

1. VisaPassage stays on `eujmomonscnlmwcbkbfy`. That project is named simnetiq.store in the dashboard and holds `visa_applications`. Leave its API URL and `visapassage.com` alone.
2. The public site mailing list stays on Doppler `fzlrhmjdjjzcgstaeblu`, where `marketing_contacts` and `outreach_prospects` already live. `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` stay on that project.
3. After the six files succeed, set `BUSINESS_OS_SUPABASE_URL` to `https://pwvtjuklkfelpxzxjmsi.supabase.co`, with that project's publishable and secret keys. In that project's Auth settings, set the site URL to `https://simnetiq.store` and allow `https://simnetiq.store/login`, `https://simnetiq.store/tg`, `https://www.simnetiq.store/login`, and `https://www.simnetiq.store/tg`.
4. `/delete-account` sends email and the n8n webhook. It does not read the old eSIM user tables, so it does not need a database move.

The identity migration aborts if `public.marketing_contacts` is present. Do not point this config at the marketing project.

Later phases append new files under `migrations/`. Do not edit a migration that has already been applied.

Local config uses database port `54332` and leaves public signup disabled. M1 does not start this stack and does not seed an owner. `scripts/business-os/bootstrap-owner.mjs` is a manual, server-side step once `BUSINESS_OS_SUPABASE_URL`, `BUSINESS_OS_SUPABASE_SECRET_KEY`, `BUSINESS_OS_OWNER_EMAIL`, and `BUSINESS_OS_OWNER_PASSWORD` are set in the server environment.

Recovery before any later migration has been applied: drop schema `business_os` and remove the `business-os-private` bucket plus its storage policy. Do not cascade those drops onto a marketing database.
