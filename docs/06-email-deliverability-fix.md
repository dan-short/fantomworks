# Email deliverability remediation — fantomworks.com

Diagnosis run 2026-08-04 against public DNS and Microsoft's public realm endpoint.
Symptom reported: a large portion of mail is failing in **both** directions — not
delivered to recipients, and inbound mail apparently never arriving.

---

## 1. Root cause

**The domain has no real mail platform.**

```
$ curl "https://login.microsoftonline.com/getuserrealm.srf?login=drs@fantomworks.com&xml=1"
<NameSpaceType>Unknown</NameSpaceType>          # same for webmaster@ and fwmail@

$ curl "https://login.microsoftonline.com/fantomworks.com/.well-known/openid-configuration"
AADSTS90002: Tenant 'fantomworks.com' not found.
```

There is **no Microsoft 365 tenant**. The MX record is:

```
fantomworks.com.  MX  10  639049430.pamx1.hotmail.com.
```

The `<digits>.pamx1.hotmail.com` pattern is the **legacy Outlook.com custom-domain
service** (formerly Windows Live Custom Domains) — a discontinued consumer product.
A real Microsoft 365 tenant would use `fantomworks-com.mail.protection.outlook.com`.

This single fact explains both directions:

- **Outbound** — that platform cannot DKIM-sign for a custom domain. There is no admin
  center in which to enable it. Combined with the SPF fault below, every message he
  sends fails DMARC alignment and gets junked.
- **Inbound** — consumer-grade filtering with no admin console, no message trace, no
  quarantine digest, no allowlisting. Mail can be silently junked or dropped and there
  is **no tooling on this platform to find out**.

---

## 2. Findings

| # | Finding | Evidence | Impact |
|---|---------|----------|--------|
| 1 | No M365 tenant; legacy Outlook.com custom-domain service | realm `Unknown`, tenant not found, `pamx1.hotmail.com` MX | **Critical — both directions** |
| 2 | SPF exceeds the 10-DNS-lookup limit (11+) → PermError | see chain below | **Critical — outbound** |
| 3 | SPF terminates in `?all` (neutral) | current record | High — outbound |
| 4 | DKIM key is **768-bit**, below the RFC 8301 minimum of 1024 | `default._domainkey`, decoded | **Critical — outbound** |
| 5 | No `selector1`/`selector2` CNAMEs | not present | High — nothing signs |
| 6 | DMARC `p=none` — monitoring only | `_dmarc` TXT | Medium |
| 7 | Single MX, no backup | one record | Medium — inbound |
| 8 | No MTA-STS, TLS-RPT, or DNSSEC | not present | Low |
| 9 | Legacy form sends via PHP `mail()` on shared hosting | `call-log/calllogprocessor2.php:248` | Medium |
| 10 | Sending IPs are **not** blocklisted | Spamhaus/SpamCop/SORBS/Barracuda all clean | *Ruled out* |

### The SPF lookup chain (finding #2)

Current record:

```
v=spf1 +a +mx +ip4:74.220.215.120 include:hostmonster.com include:hotmail.com ip4:162.144.141.151 ?all
```

```
 1. a
 2. mx
 3. include:hostmonster.com
 4.   └ include:_spf.salesforce.com
 5.       └ exists:%{i}._spf.mta.salesforce.com
 6.   └ include:spf.protection.outlook.com
 7.   └ include:spf.websitewelcome.com
 8.       └ include:_spf.nfco-mailout.com
 9.   └ include:eig.spf.a.cloudfilter.net
10. include:hotmail.com
11.   └ include:spf2.outlook.com
```

**11 lookups. RFC 7208 caps it at 10.** Receivers return PermError and treat the
domain as having no SPF at all.

### DKIM (finding #4)

```
$ dig +short TXT default._domainkey.fantomworks.com | ... | openssl rsa -pubin -text -noout
Public-Key: (768 bit)
```

RFC 8301 sets the floor at 1024 bits. Gmail, Yahoo, and Microsoft ignore or fail keys
below that, so this is equivalent to publishing no DKIM.

**Net effect:** SPF fails, DKIM fails, therefore DMARC fails. Since Gmail and Yahoo's
February 2024 bulk-sender requirements, unauthenticated mail to consumer inboxes is
junked aggressively. `p=none` means it isn't hard-rejected — it just lands in spam.

---

## 3. Fix — in order

> **Correction (2026-08-05):** this section assumed the zone was editable from the
> Bluehost/HostMonster panel. It was not — that editor is read-only behind a paid
> upsell, and the WHM zone editor on the VPS was writing to a copy that stopped being
> authoritative in April 2025. See `07-dns-control-and-post-cutover.md`. Steps 0, 2, 3
> and 6 below are blocked until DNS delegation moves to the VPS nameservers.

### Step 0 — Today (free, ~15 min): repair SPF

This alone stops the PermError and will measurably improve outbound while the migration
is planned. Replace the SPF TXT record on `fantomworks.com` with:

```
v=spf1 include:hotmail.com ip4:162.144.141.151 ip4:74.220.215.120 ~all
```

2 lookups instead of 11. Changes: dropped `+a` (those are CDN addresses that never send
mail), dropped `+mx` (Microsoft's inbound servers don't send), dropped
`include:hostmonster.com` (its nesting is what blew the budget — the two Bluehost IPs
that actually matter are named explicitly), and `?all` → `~all` (softfail).

> Trade-off: if some Bluehost mail path sends from an IP other than the two listed, it
> will now softfail. DMARC is `p=none`, so nothing gets rejected, and it will show up in
> the reports. Acceptable, especially as the PHP sender is being retired in Step 5.

Also **delete** the dead key — it can only hurt:

```
DELETE  default._domainkey.fantomworks.com   TXT
```

### Step 1 — This week: migrate to a real mail platform

**This is the actual fix.** No DNS change repairs outbound DKIM on a platform that
cannot sign, and no amount of tuning gives inbound visibility on a platform with no
admin console.

Recommendation: **Google Workspace Business Starter** (~$7–8/user/month, confirm current
pricing) for `drs@` and `webmaster@`, with `fwmail@` as an alias. Rationale: DKIM is
three clicks, the spam filtering is materially better than consumer Outlook, and IMAP
import from Outlook.com is straightforward. Microsoft 365 Business Basic is the
equivalent alternative if he's attached to the Outlook client.

Order of operations matters:

1. Sign up at `workspace.google.com` using `fantomworks.com`.
2. Verify domain ownership (Google supplies a TXT record).
3. Create `drs@` and `webmaster@`; add `fwmail@` as an alias.
4. **Lower the MX TTL to 300 seconds and wait for the old TTL (3101s) to expire.**
5. **Import existing mail over IMAP from Outlook.com *before* cutting MX.** Do not skip
   this — once MX moves, the old mailbox is the only copy of the archive.
6. Cut MX over. Replace the single `pamx1` record with:

   ```
   fantomworks.com.  MX  1  SMTP.GOOGLE.COM.
   ```

7. Keep the Outlook.com account alive and accessible for at least 30 days as a fallback.

### Step 2 — DKIM (immediately after the MX cutover)

Google Admin console → **Apps → Google Workspace → Gmail → Authenticate email** →
Generate new record → **2048-bit**, prefix `google`. Publish what it gives you:

```
google._domainkey.fantomworks.com.  TXT  "v=DKIM1; k=rsa; p=<key from console>"
```

Then return to the console and click **Start authentication**. Verify the `default`
selector from Step 0 is gone.

Update SPF to match the new platform:

```
v=spf1 include:_spf.google.com ~all
```

`_spf.google.com` is currently flat — that's **1 lookup**, with the whole budget spare.

### Step 3 — DMARC ramp

Reports currently go to an MXToolbox account (`2e264e00@mxtoolbox.dmarc-report.com`) that
someone set up and evidently nobody reads. Add an address you control:

```
_dmarc.fantomworks.com.  TXT  "v=DMARC1; p=none; rua=mailto:2e264e00@mxtoolbox.dmarc-report.com,mailto:dmarc@fantomworks.com; fo=1; adkim=r; aspf=r"
```

Postmark's DMARC Digests is free and emails a readable weekly summary — worth pointing a
second `rua` at it.

Then ramp, **only after two to four weeks of clean reports**:

```
p=none  →  p=quarantine; pct=25  →  p=quarantine; pct=100  →  p=reject
```

Do not jump straight to `p=reject`. If anything legitimate is still sending unsigned,
that will start hard-bouncing real mail.

### Step 4 — App confirmation email via Resend

Resend puts the bounce path on a `send` subdomain and DKIM on the root, so the From
address stays clean at `fwmail@fantomworks.com` and DMARC passes on DKIM alignment. Add
the domain in Resend, then publish the three records it generates:

```
resend._domainkey.fantomworks.com.  TXT  "p=<2048-bit key from Resend>"
send.fantomworks.com.               TXT  "v=spf1 include:amazonses.com ~all"
send.fantomworks.com.               MX   10 feedback-smtp.us-east-1.amazonses.com
```

The root SPF from Step 2 needs **no** Resend include — the bounce path lives on the
subdomain and alignment comes from DKIM.

Sending config, per `docs/04-phase2-scope.md:114`:

- From `fwmail@fantomworks.com`, Reply-To `webmaster@fantomworks.com`
- **Disable open and click tracking** in the Resend dashboard (Domains → Settings — it is a
  domain-level toggle, not a per-send parameter). Link rewriting through a third-party
  tracking domain is a spam signal and makes the mail read as bulk, which suppresses the
  replies he wants.
- The button points at `https://fantomworks.com/confirm/<token>` — your own domain. The
  token hit gives you click data anyway, without the deliverability cost.
- Plain prose, one button, no header images.

#### Implementation (done)

| Path | Role |
|------|------|
| `migrations/0009_submission_confirmations.sql` | `submission_confirmations` table + `submissions.confirmed_at` |
| `web/lib/confirm-token.ts` | 256-bit token mint; only the SHA-256 hash is stored |
| `web/lib/email/config.ts` | From / Reply-To / site origin, `isEmailConfigured` |
| `web/lib/email/client.ts` | Lazy Resend client |
| `web/lib/email/confirmation.ts` | Ported copy as HTML + text, send, delivery bookkeeping |
| `web/lib/confirmations.ts` | Token lookup → `invalid` / `expired` / `pending` / `confirmed` |
| `web/app/confirm/[token]/page.tsx` | Public confirm page, one button per state |
| `web/app/confirm/[token]/actions.ts` | Marks the confirmation and the submission |
| `web/app/actions/submit.ts` | Sends via `after()` so the send never blocks the form |

Environment (see `web/.env.local.example`): `RESEND_API_KEY`, `MAIL_FROM`,
`MAIL_REPLY_TO`, `NEXT_PUBLIC_SITE_URL`. With no API key the submission still saves and
no mail is sent.

Two deliberate choices worth knowing:

- **The link does not confirm on GET.** It renders a page with a button that POSTs.
  Outlook Safe Links and Gmail prefetch both fetch URLs in mail automatically, so a
  confirm-on-GET link would mark everything confirmed before the customer ever saw it.
- **The token is stored hashed.** A leak of the table doesn't let anyone confirm on
  someone's behalf. Tokens expire after 30 days (`CONFIRM_TOKEN_TTL_DAYS`).

Apply the migration with the same `psql` invocation `scripts/provision.sh` uses:

```bash
psql "$FANTOM_DB_URL" -v ON_ERROR_STOP=1 -f migrations/0009_submission_confirmations.sql
```

### Step 5 — Retire PHP `mail()`

`call-log/calllogprocessor2.php:248` sends via `mail()` on a shared Bluehost IP. Once
Step 4 is live, cut this over and drop the two `ip4:` terms from the root SPF.

### Step 6 — Monitoring and hardening

- Enrol the domain in **Google Postmaster Tools** — shows real spam rate and reputation.
- Add MTA-STS and TLS-RPT once Google MX is stable:

  ```
  _mta-sts.fantomworks.com.    TXT  "v=STSv1; id=20260804T000000Z"
  _smtp._tls.fantomworks.com.  TXT  "v=TLSRPTv1; rua=mailto:tlsrpt@fantomworks.com"
  ```

  plus an `mta-sts.txt` policy file served over HTTPS at
  `https://mta-sts.fantomworks.com/.well-known/mta-sts.txt`.
- DNSSEC is not enabled. Optional, low priority.

---

## 4. Verification

After each step:

```bash
dig +short TXT fantomworks.com | grep spf          # ≤10 lookups, ends ~all or -all
dig +short TXT google._domainkey.fantomworks.com   # 2048-bit key present
dig +short TXT default._domainkey.fantomworks.com  # must be EMPTY
dig +short TXT _dmarc.fantomworks.com
dig +short MX fantomworks.com
```

End-to-end: send to a Gmail address and open **Show original**. All three of
`SPF: PASS`, `DKIM: PASS`, `DMARC: PASS` must appear. Anything less and the work isn't
finished.

`https://www.mail-tester.com` gives a score out of 10 for a single sent message and names
whatever is still wrong.

---

## 5. What this does not explain

Blocklist checks on both sending IPs came back clean across Spamhaus ZEN, SpamCop, SORBS,
and Barracuda, so IP reputation is not a factor.

If mail is still going missing **inbound** after Step 1, the cause is downstream of DNS
and needs a message trace — which is precisely the tool the current platform doesn't
have, and Google Workspace does (Admin console → Reporting → Email Log Search). In the
meantime, check the Outlook.com Junk folder and the blocked-senders list directly, since
that is the only visibility available today.
