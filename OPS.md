# Ops Notes

Single-purpose ops notes. Keep this short.

## Cal.com booking notifications via n8n

Cal.com EU can fire a webhook on every new booking. Wire this into the
existing n8n instance to mirror the contact-form notification flow.

### Setup

1. In n8n at `https://n8n.dopplervpn.org`, create a new webhook trigger node
   with the path `simnetiq-booking`. Save and copy the production webhook URL.
2. Add the URL to `.env.local` (and Vercel env) as:

   ```
   N8N_BOOKING_WEBHOOK="https://n8n.dopplervpn.org/webhook/simnetiq-booking"
   ```

3. In Cal.com EU dashboard → Settings → Webhooks → **New Webhook**:
   - Subscriber URL: the n8n webhook URL above
   - Trigger: `BOOKING_CREATED` (and optionally `BOOKING_RESCHEDULED`,
     `BOOKING_CANCELLED`)
   - Active: yes
   - Payload template: leave default (Cal.com posts JSON with `payload`,
     `triggerEvent`, `createdAt`)
4. In the n8n workflow, route the payload to whichever destination you use
   for contact alerts (Telegram, email, Slack). Reuse the same downstream
   nodes from the `simnetiq-contact` workflow if possible.

### Notes

- The webhook URL is referenced by env var only — do not hardcode it.
- `N8N_BOOKING_WEBHOOK` is not currently consumed by app code; it lives here
  so that, if we later add server-side reconciliation or audit logging, the
  source of truth is documented.
