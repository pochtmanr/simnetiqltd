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

## Cold outreach — current mode: STAGING (`rpochtman@simnetiq.store`)

> **Currently in STAGING mode.** The `simnetiq.xyz` domain hit a Hostinger
> verification snag, so cold sends are temporarily originating from the
> existing `rpochtman@simnetiq.store` mailbox. This is a deliberate
> compromise with hard volume caps — see "Staging rules" below. Migration
> to a proper shadow domain (`simnetiq.com`, planned ~2026-06) will follow
> the full setup further down this section.

### Staging rules — DO NOT VIOLATE

`simnetiq.store` is the production sender for transactional confirm emails
(the subscribe flow). Cold spam complaints on this domain will degrade those
legitimate sends too. Tight discipline during staging is the only protection.

| Rule | Reason |
|---|---|
| **Max 10 cold sends per day** total (5 automated + 5 manual) | Above this, Hostinger's outbound spam scoring trips. Damage compounds. |
| **Manual hand-picked prospects only** in `outreach_prospects` | No bulk scrape during staging. Pre-prod is for workflow validation, not throughput. |
| **Use ONLY `rpochtman@simnetiq.store`** for cold sends | Don't send cold from `support@simnetiq.store` — that's the transactional sender; even one cold complaint there fries the confirm-email path. |
| **No Cold_Warmup workflow** in staging | The mailbox is already warm via legitimate use; warmup traffic would just look noisy to Hostinger. |
| **Send to your own test addresses first** | Validate end-to-end (send → unsub link → status flips in Supabase) before any real prospect. |
| **Watch the bounce/complaint counter daily** | First sign of red = stop immediately. One spam complaint on `simnetiq.store` = halt and assess. |

### Staging setup checklist (assumes `rpochtman@simnetiq.store` already exists at Hostinger)

1. **n8n SMTP credential**: in `n8n.dopplervpn.org` → Credentials → New → SMTP:
   - Name: `Hostinger — rpochtman`
   - Host: `smtp.hostinger.com`, Port: `465`, Secure: SSL/TLS ✓
   - User: `rpochtman@simnetiq.store`, Password: (mailbox password)
2. **n8n env vars** (set on the n8n container `.env` then restart):
   ```
   SIMNETIQ_CAL_LINK_URL=https://cal.eu/simnetiq/30min
   SIMNETIQ_COLD_UNSUB_BASE_URL=https://simnetiq.store/api/cold-unsub
   # SIMNETIQ_SUPABASE_SERVICE_KEY already exists from prior session
   ```
3. **Apply Supabase migration** `20260510_create_outreach_prospects.sql` —
   see "Apply the Supabase migration" subsection further down.
4. **`.env.local` + Vercel env**: see the STAGING block in `.env.example`.
5. **Import Cold_Sequencer** from
   `~/Developer/doppler/servers/n8n/workflows/Simnetiq_Cold_Sequencer.json`
   (already in STAGING mode — read its sticky note before activating). Open
   the `Send via rpochtman@` node, select the new credential. **Do NOT
   import or activate `Simnetiq_Cold_Warmup.json` during staging.**
6. **Pre-flight test**: insert YOUR own non-Gmail address as a test
   prospect:
   ```sql
   insert into outreach_prospects (email, first_name, company, company_type, next_send_at)
   values ('your-test-address@example.com', 'Roman', 'Test Co', 'clinic', now());
   ```
   Trigger Cold_Sequencer manually in n8n. Verify: email arrives, unsub link
   in footer flips status to `opted_out`, no errors in Supabase.
7. **First real send**: hand-pick ONE high-priority prospect, insert
   manually with the same SQL, let the cron pick it up (or trigger
   manually). Watch the reply.

### Migration to `simnetiq.com` (~end of staging month, planned 2026-06)

When `simnetiq.com` is purchased and you're ready to migrate:

1. Follow the full DNS + mailbox setup below (Namecheap or Hostinger
   registration — either works) for `simnetiq.com`.
2. Create 3 mailboxes (`roman@`, `r.pochtman@`, `hello@`) per the original
   plan.
3. Activate `Simnetiq_Cold_Warmup.json` for the new mailboxes — runs 14-day
   ramp.
4. Replace `Simnetiq_Cold_Sequencer.json` with the production 3-mailbox
   version (regenerate from this repo's git history of the original commit,
   or ask Claude to regenerate it).
5. Update `outreach_prospects` to mark all currently-`sequencing` rows as
   `suppressed` and re-import the cleaned list under the new domain (so
   threading starts fresh, no association with the simnetiq.store sender):
   ```sql
   update outreach_prospects set status='suppressed', updated_at=now()
   where status in ('queued','sequencing');
   ```
6. Update `SIMNETIQ_CAMPAIGN_START` env on n8n to migration date.
7. Stop using `rpochtman@simnetiq.store` for any cold outreach. Resume only
   transactional traffic on `simnetiq.store`.

### Why we're not just persisting at `simnetiq.xyz` verification

Worth a look anyway — if Hostinger's verification step is fixable in 30
min, it dominates this staging compromise. The verification snag is usually
one of:
- TXT verification record added at Namecheap with extra spaces or quotes
- Verification record added on the wrong host (e.g. `simnetiq.xyz.simnetiq.xyz`)
- Hostinger panel hadn't propagated yet — retry verification after 30 min
- Wrong record TYPE (Hostinger sometimes asks for CNAME, not TXT)

If the staging risk feels uncomfortable, it's worth one debugging pass at
the Hostinger panel before continuing here.

---

## Cold outreach — full setup for shadow domain (when `simnetiq.com` lands)

The setup below is the **production target** — to be executed when
`simnetiq.com` (or the next shadow domain) is provisioned and ready for the
proper 3-mailbox cold pipeline. During staging, ignore this and use only
the staging section above.

**Setup topology:** domain registered at **Namecheap** (DNS lives there);
mailboxes and SMTP/IMAP servers hosted on **Hostinger Business Email**. The
two providers talk to each other via the DNS records you'll paste from
Hostinger into Namecheap below.

You have two architectural options. Pick one before continuing:

| | **A. Keep DNS at Namecheap (recommended)** | **B. Switch nameservers to Hostinger** |
|---|---|---|
| What you do | Paste DNS records (MX, SPF, DKIM, DMARC) from Hostinger into Namecheap's Advanced DNS panel | Change Namecheap's nameservers to Hostinger's, then manage DNS only inside Hostinger |
| Pros | Faster (no nameserver propagation wait, ~30 min vs 24–48h). DNS stays where you control the registrar. Standard professional setup. | Single-pane management. Hostinger auto-adds MX/SPF/DKIM when you create email. |
| Cons | Manually copy 5–7 records. | 24–48h nameserver propagation kills today's progress. Lose Namecheap's free privacy/DNSSEC defaults. |
| Verdict | **Use this** | Skip unless you specifically want everything in Hostinger |

The rest of this guide assumes **Option A** (DNS at Namecheap).

### 1. Add `simnetiq.xyz` to Hostinger Email (one-time)

This step gives Hostinger the domain to attach mailboxes to. You don't need
Hostinger hosting for this — Business Email is a standalone product.

1. Hostinger panel → **Emails → Buy / Manage Email** → either pick the
   existing Business Email plan or buy one (~£0.99–1.59/mailbox/mo).
2. Click **Set up email** → **Use existing domain** → enter `simnetiq.xyz`.
3. Hostinger asks for **domain ownership verification** — you said you've
   already done this step at Namecheap. ✓
4. Once verified, Hostinger shows the **DNS Records to add at your DNS
   provider** screen. **Keep this tab open** — you'll paste these values
   into Namecheap in step 2. The records you'll see are roughly:

| Type | Name (host) | Value | Priority / TTL |
|---|---|---|---|
| `MX` | `@` | `mx1.hostinger.com` | priority `5` |
| `MX` | `@` | `mx2.hostinger.com` | priority `10` |
| `TXT` | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | — |
| `TXT` | `hostingermail-a._domainkey` | `v=DKIM1; k=rsa; p=<long-public-key-A>` | — |
| `TXT` | `hostingermail-b._domainkey` | `v=DKIM1; k=rsa; p=<long-public-key-B>` | — |

**Exact DKIM values are unique to your account — copy what Hostinger shows.**

### 2. Add DNS records at Namecheap

1. Namecheap dashboard → **Domain List** → row `simnetiq.xyz` → **Manage**
   button → top tab **Advanced DNS**.
2. Scroll to **Mail Settings**: change to **Custom MX** (NOT "Email
   forwarding" or any preset). This stops Namecheap from injecting its own
   MX entries that would conflict with Hostinger's.
3. In the **Host Records** table, click **Add New Record** and add each row
   from Hostinger's table above. Important Namecheap conventions:
   - `Host = @` means the root (`simnetiq.xyz` itself).
   - `Host = hostingermail-a._domainkey` (just the subdomain, no `.simnetiq.xyz` —
     Namecheap auto-appends).
   - `Host = _dmarc` for the DMARC record below.
   - **TTL = Automatic** for everything.
   - For TXT records, paste the value WITHOUT surrounding quotes.
4. Add the **DMARC** record (Hostinger doesn't auto-supply this — paste exactly):

   | Type | Host | Value |
   |---|---|---|
   | `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@simnetiq.xyz; pct=100; adkim=r; aspf=r;` |

   This is monitor-mode for the first 14 days. After warm-up, tighten to:
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@simnetiq.xyz; pct=100; adkim=r; aspf=r;
   ```

5. Save. Namecheap propagates within ~5–30 min (root MX/TXT typically much
   faster than nameserver changes).

### 3. Verify DNS propagation

Wait ~10 minutes after saving in Namecheap, then check at
`https://mxtoolbox.com/SuperTool.aspx`:

| Lookup type | Domain to check | Expected |
|---|---|---|
| MX Lookup | `simnetiq.xyz` | 2 records: `mx1.hostinger.com` (5), `mx2.hostinger.com` (10) |
| SPF Record | `simnetiq.xyz` | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| DKIM Lookup | `hostingermail-a._domainkey.simnetiq.xyz` | `v=DKIM1; k=rsa; p=...` |
| DKIM Lookup | `hostingermail-b._domainkey.simnetiq.xyz` | `v=DKIM1; k=rsa; p=...` |
| DMARC Lookup | `simnetiq.xyz` | `v=DMARC1; p=none; ...` |

All five must return green. If any miss, fix in Namecheap and re-check after
another 10 min before continuing — propagation hiccups now save hours of
spam-folder debugging later.

Also go back to Hostinger's Email → Domain → Status page and confirm it now
shows **DNS Verified ✓** for the records it expected.

### 4. Create the 4 mailboxes (Hostinger)

Hostinger panel → **Emails → simnetiq.xyz → Email Accounts → Create**.
Repeat for all four. All three sending mailboxes use display name **"Roman
Pochtman"** so recipients see one consistent persona:

| Address | Role | Display name | Password strength |
|---|---|---|---|
| `roman@simnetiq.xyz` | Cold sender #1 (primary) | Roman Pochtman | strong, store in 1Password |
| `r.pochtman@simnetiq.xyz` | Cold sender #2 | Roman Pochtman | strong, store in 1Password |
| `hello@simnetiq.xyz` | Cold sender #3 | Roman Pochtman | strong, store in 1Password |
| `dmarc@simnetiq.xyz` | DMARC report sink | Simnetiq DMARC | strong, store in 1Password |

For each mailbox, in the mailbox settings page, also set:
- **From / Display name**: as above
- **Auto-reply**: off
- (Optional) **Forwarding**: off — keep replies in the mailbox so
  `Cold_Reply_Handler` can poll them via IMAP.

Hostinger SMTP/IMAP server settings (same for all four):

| Protocol | Server | Port | Encryption |
|---|---|---|---|
| SMTP (sending) | `smtp.hostinger.com` | `465` | SSL/TLS |
| IMAP (receiving) | `imap.hostinger.com` | `993` | SSL/TLS |

### 5. Wire credentials into the Next.js app

In `simnetiq.store/.env.local` (and the same keys in **Vercel → Project
Settings → Environment Variables → Production**):

```
COLD_OUTREACH_DOMAIN=simnetiq.xyz
COLD_UNSUB_BASE_URL=https://simnetiq.store/api/cold-unsub
CAL_LINK_URL=https://cal.eu/simnetiq/30min

COLD_MAILBOX_1_USER=roman@simnetiq.xyz
COLD_MAILBOX_1_PASS=<password from Hostinger>
COLD_MAILBOX_2_USER=r.pochtman@simnetiq.xyz
COLD_MAILBOX_2_PASS=<password from Hostinger>
COLD_MAILBOX_3_USER=hello@simnetiq.xyz
COLD_MAILBOX_3_PASS=<password from Hostinger>

HUNTER_API_KEY=<later, when you start scraping>
COMPANIES_HOUSE_API_KEY=<later, when you start scraping>
```

The Next.js app itself doesn't send mail (n8n does) — these env keys are
here so they're discoverable in one place and deployed atomically with code
changes. The `COLD_UNSUB_BASE_URL` and `CAL_LINK_URL` ARE consumed by n8n
via the env vars below; they're mirrored in the app env for
documentation/auditing only.

### 6. Wire credentials into n8n

On the n8n VPS (`n8n.dopplervpn.org`):

**6a. Three SMTP credentials** (UI: Credentials → New → SMTP):

| Credential name | Host | Port | Secure | User | Password |
|---|---|---|---|---|---|
| `Simnetiq XYZ — Roman` | `smtp.hostinger.com` | `465` | SSL/TLS ✓ | `roman@simnetiq.xyz` | (mailbox password) |
| `Simnetiq XYZ — R.Pochtman` | `smtp.hostinger.com` | `465` | SSL/TLS ✓ | `r.pochtman@simnetiq.xyz` | (mailbox password) |
| `Simnetiq XYZ — Hello` | `smtp.hostinger.com` | `465` | SSL/TLS ✓ | `hello@simnetiq.xyz` | (mailbox password) |

**6b. Container env vars** (SSH to VPS, edit n8n's `.env` or
`docker-compose.yml`, restart container):
```
SIMNETIQ_CAMPAIGN_START=2026-05-10
SIMNETIQ_CAL_LINK_URL=https://cal.eu/simnetiq/30min
SIMNETIQ_COLD_UNSUB_BASE_URL=https://simnetiq.store/api/cold-unsub
# SIMNETIQ_SUPABASE_SERVICE_KEY already exists from prior session
```

**6c. Import workflows** from
`~/Developer/doppler/servers/n8n/workflows/`:
- `Simnetiq_Cold_Warmup.json`
- `Simnetiq_Cold_Sequencer.json`

For each, open every `Send via …` node and select the matching SMTP
credential from the dropdown (replaces the `REPLACE_WITH_…_CRED_ID`
placeholder).

### 7. DMARC reporting (free, optional but recommended)

Sign up at https://dmarcian.com (free tier: 1 domain, 100k messages/mo).
Forward `dmarc@simnetiq.xyz` inbox to DMARCian's ingest address (shown in
their dashboard after adding the domain) — or just check the inbox manually
weekly. Goal: catch SPF/DKIM alignment failures before they hurt
deliverability.

### 8. Apply the Supabase migration

Supabase Studio for project `fzlrhmjdjjzcgstaeblu` (Doppler) → **SQL
Editor** → paste contents of
`supabase/migrations/20260510_create_outreach_prospects.sql` → **Run**.

Confirm at SQL Editor:
```sql
select count(*) from public.outreach_prospects;  -- should be 0
```

### 9. Pre-send verification (before any real cold sends, ~Day 8)

1. From `roman@simnetiq.xyz` (use Hostinger webmail) send a test message to
   https://www.mail-tester.com — must score **≥ 9/10**. Below 9 means
   SPF/DKIM/DMARC need fixing.
2. Send a test from `roman@simnetiq.xyz` to one of your personal Gmails.
   Open the email in Gmail → ⋮ menu → **Show original**. Verify the headers
   show:
   - `SPF: PASS with IP <Hostinger IP>`
   - `DKIM: PASS with domain simnetiq.xyz`
   - `DMARC: PASS`
3. Insert one test prospect (your own non-Gmail address) into
   `outreach_prospects` and trigger n8n `Cold_Sequencer` manually — verify
   the email arrives at the test address, the unsub link in the footer
   works (status flips to `opted_out` in Supabase).
