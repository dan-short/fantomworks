# DNS control and post-cutover checklist — fantomworks.com

Written 2026-08-05, while migrating DNS authority off Bluehost's shared cluster.
Companion to `06-email-deliverability-fix.md`, which assumed DNS was editable from
the Bluehost/HostMonster panel. It was not. This document corrects that and lists
everything that must be re-added once delegation moves.

---

## 1. Where DNS actually lives

Three systems claimed to hold this zone. Only one answered queries.

| System | Serial | Editable | Authoritative |
|---|---|---|---|
| `ns1`/`ns2.hostmonster.com` (Bluehost shared cluster) | `2025040500` | No — read-only behind the Premium DNS upsell | **Yes**, until cutover |
| WHM → DNS Zone Manager on `server.fantomworks.com` | `2026080604` | Yes (root) | No — edits never reached the cluster |
| Bluehost Domain Center → DNS tab | shows cluster data | No — ADD RECORD greyed out | n/a |

The zones had genuinely diverged, not merely lagged. Proof: `_dmarc.fantomworks.com`
returned different values from each, on a record nobody had edited.

Bluehost support's explanation, confirmed by testing: because this account has a VPS,
the domain is expected to delegate to the VPS's own nameservers. The shared cluster was
serving a frozen April-2025 copy and was never going to pick up WHM edits.

**Resolution:** delegate to `ns1.fantomworks.com` / `ns2.fantomworks.com`, both
`162.144.141.151` (the VPS, `server.fantomworks.com`). The VPS answers authoritatively
(`aa` flag set) and already holds the correct zone.

### Diagnostic commands

The serial is the single best signal — it does not move until a change is real:

```bash
dig +short @ns1.fantomworks.com SOA fantomworks.com | awk '{print $3}'

for n in submit log send resend._domainkey; do
  printf "%-20s %s\n" "$n" \
    "$(dig @ns1.fantomworks.com $n.fantomworks.com | grep -o 'status: [A-Z]*' | head -1)"
done
```

Always query the authoritative server by name. Querying a public resolver conflates
"not published" with "not yet propagated" — they need different fixes.

---

## 2. What the cutover changes

Full diff of the shared-cluster zone against the VPS zone, taken before delegation moved.
Everything not listed is byte-identical — apex A/MX, `www`/SiteLock, all 21 host records,
the Shopify DKIM CNAMEs, the autodiscover SRV.

| Record | Effect |
|---|---|
| `submit`, `log`, `send` TXT+MX, `resend._domainkey` | **Gained** — the five records the app needs |
| `_dmarc` | **Loses** `rua`/`ruf` reporting addresses (stays `p=none`) |
| `server` TXT | **Loses** its SPF record (server hostname's own; negligible) |
| `_cpanel-dcv-test-record` | Different token — harmless, AutoSSL regenerates |

---

## 3. Post-cutover checklist

### 3.1 Verify delegation

```bash
dig +short NS fantomworks.com                        # ns1/ns2.fantomworks.com
dig +short @a.gtld-servers.net NS fantomworks.com    # glue at the registry
dig +short @ns1.fantomworks.com CNAME submit.fantomworks.com
dig +short @ns1.fantomworks.com CNAME log.fantomworks.com
dig +short @ns1.fantomworks.com TXT  resend._domainkey.fantomworks.com
dig +short @ns1.fantomworks.com TXT  send.fantomworks.com
dig +short @ns1.fantomworks.com MX   send.fantomworks.com
```

Also confirm the zone's own NS records were updated — they still read
`ns1/ns2.hostmonster.com` as of the cutover, which leaves a lame delegation:

```bash
dig +short @ns1.fantomworks.com NS fantomworks.com
```

### 3.2 Re-add what the cutover drops

DMARC reporting:

```
_dmarc  TXT  v=DMARC1; p=none; rua=mailto:2e264e00@mxtoolbox.dmarc-report.com; fo=1
```

Optional, and only if mail is ever sent from the server hostname itself:

```
server  TXT  v=spf1 a mx ip4:162.144.141.151 ~all
```

### 3.3 Finish the Resend setup

1. Click **Verify** in the Resend dashboard once the five records resolve.
2. Domains → Settings → **disable open and click tracking**. Link rewriting through a
   third-party tracking domain is a spam signal and suppresses replies.
3. Set the Vercel env vars (Production):
   ```
   RESEND_API_KEY
   MAIL_FROM=FantomWorks <fwmail@fantomworks.com>
   MAIL_REPLY_TO=webmaster@fantomworks.com
   NEXT_PUBLIC_SITE_URL=https://submit.fantomworks.com
   ```
4. **Redeploy.** `NEXT_PUBLIC_SITE_URL` is inlined at build time — an env change alone
   does not take effect.
5. Confirm `submit.fantomworks.com` and `log.fantomworks.com` flip from
   "Invalid Configuration" to valid in Vercel → Settings → Domains.

Do not set `RESEND_API_KEY` before the domain verifies. Sends will 403 per-submission
and land in `submission_confirmations.send_error`. Submissions still save either way.

### 3.4 Now-unblocked items from doc 06

These were impossible while DNS was read-only:

- **Repair root SPF** (doc 06, Step 0) — currently 11 lookups and `?all`, so it
  PermErrors and is treated as absent:
  ```
  v=spf1 include:hotmail.com ip4:162.144.141.151 ip4:74.220.215.120 ~all
  ```
  Safe for Shopify mail, which aligns via DKIM (`skj*._domainkey` CNAMEs), not SPF.
  Do not delete those four records.
- **Delete `default._domainkey`** — 768-bit and missing the `v=DKIM1` tag. Below the
  RFC 8301 floor, so it validates nowhere.
- **Delete `_domainkey` (`o=~`)** — obsolete ADSP, deprecated by RFC 6377.

---

## 4. Known fragility

`ns1.fantomworks.com` and `ns2.fantomworks.com` both resolve to `162.144.141.151`.
That is one nameserver with two names. If the VPS goes down the whole domain goes dark,
including MX lookups. Ask Bluehost whether a second IP or a secondary/slave DNS service
is available on this plan.

---

## 5. Still open

`06-email-deliverability-fix.md` Steps 1–3 are untouched: there is still no real mail
platform behind `fantomworks.com`, the MX still points at the discontinued
`pamx1.hotmail.com` consumer service, and outbound from Dan's own mailbox remains
unsigned. The Resend path fixes app mail only.

After a Google Workspace migration the root SPF becomes:

```
v=spf1 include:_spf.google.com ~all
```

and the two `ip4:` terms can be dropped once the PHP `mail()` sender in
`call-log/calllogprocessor2.php:248` is retired.
