# Subscription storage

The application uses two existing tables in the Supabase `public` schema.
A read-only REST check on 2026-09-27 returned HTTP 200 for both tables and
all columns used by the subscription APIs. No schema changes were applied,
and no new migration is required for this deployment.

## API schema contract

`marketing_contacts` is the opt-in subscriber list:

- `id`: row identifier used to update a contact.
- `email`: normalized lowercase email; must be unique for lookup/insert races.
- `name`, `country`, `company`, `source`: optional profile and source fields.
- `utm_source`, `utm_medium`, `utm_campaign`: optional attribution fields.
- `status`: `pending`, `confirmed`, `unsubscribed`, or `bounced`.
- `confirmation_token`, `unsubscribe_token`: unique UUID tokens generated for
  new records; the API also replaces confirmation tokens when resubscribing.
- `confirmed_at`, `unsubscribed_at`: timestamps set by the corresponding API.
- `unsubscribe_reason`: optional text.

New subscribers must default to `pending`. The insert path expects the database
to return generated tokens. Tokens must not be exposed through browser database
credentials; browser requests go through the server API.

`outreach_prospects` is a separate list used by the outreach opt-out endpoint:

- `id`, `status`, `unsubscribe_token`, `opted_out_at`, `unsubscribe_reason`.
- Existing OPS workflows also reference `email`, `first_name`, `company`,
  `company_type`, `next_send_at`, and `updated_at`.
- Preserve existing status values including `queued`, `sequencing`,
  `suppressed`, and `opted_out`. The external n8n workflow may use more values;
  its complete schema is not maintained in this repository.

The old `20260510_create_outreach_prospects.sql` reference in OPS.md is historical;
that migration file is not present here. Do not recreate or replace an existing
outreach table from an inferred schema. The subscription flow does not activate
outreach sequences or send outreach emails.

## Deployment configuration

Required server environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: service-role key; server-only, never use a
  `NEXT_PUBLIC_` prefix for this credential.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: transactional mailbox.
  The current SMTP transport uses TLS (`secure: true`); OPS documents port 465.

These variable names were present in Vercel production during the read-only
check. Their presence does not verify SMTP delivery. Confirmation messages are
rendered in English, Hebrew, or Russian with plain text and HTML alternatives,
without tracking pixels or remote images. Confirmation and cancellation URLs
are supplied by the API.

Before enabling a fresh environment, verify database-generated UUID tokens,
email uniqueness, and service-role access with public access restricted (RLS and
grants). Apply any schema change only after comparing the actual schema and
external workflow dependencies. Live email delivery requires a separately
authorized test to a controlled mailbox.
