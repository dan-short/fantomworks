# Phase 2 Scope — Route submissions into Supabase (the cutover)

Goal: new customer submissions write into Supabase so the new DB becomes the **source of
truth**, ending the staleness gap. This is the first customer-facing *write* path, so it
ships with a fallback.

Status: not started. Prereq: Phase 1 (done — viewer live at fantomworks.vercel.app).

---

## Current write path (legacy, still live)
```
projects.fantomworks.com/  (submission/index.html)
   │  POST (multipart)
   ▼
calllogprocessor2.php
   ├─ format phone -> (xxx) xxx-xxxx
   ├─ compute Distance from shop ZIP 23517 via ZipCodes lat/long
   ├─ INSERT Project_Submissions  (Added_By='Online Form', Received_Date=today)
   ├─ move fileToUpload_1..4 -> /uploads/{id}_{n}.{ext}, UPDATE ImageName_1..4
   ├─ INSERT Project_Desc  (4 of 13 stages)
   └─ mail() confirmation to customer
```

## Target write path (new)
```
submission form (rehosted or repointed)
   │  POST
   ▼
Next.js Route Handler / Server Action  (or Supabase Edge Function)
   ├─ validate + format phone
   ├─ compute distance_miles from zipcodes table (shop ZIP 23517)
   ├─ upload images -> Supabase Storage bucket 'submissions'
   ├─ insert submissions (status='new', source='live', added_by='Online Form')
   ├─ insert submission_detail_stages (the 4 provided stages)
   └─ send confirmation email (Resend or SMTP)
```

## Field mapping (form → submissions)
| Form field (`name=`) | submissions column | Notes |
|---|---|---|
| `firstName` | `first_name` | |
| `lastName` | `last_name` | |
| `phoneNumber` | `phone` | format `(xxx) xxx-xxxx` |
| `altPhone` | `alt_phone` | format |
| `callSchedule` | `call_schedule` | |
| `email` | `email` | validate |
| `city` | `city` | |
| `stateCountry` | `state_country` | |
| `zipcode` | `zipcode` | store zero-padded text |
| `zipcode` | `distance_miles` | computed via `zipcodes` (haversine from 23517) |
| `timeZone` | `time_zone` | |
| `year` / `make` / `model` | `year` / `make` / `model` | |
| `projectStart` | `project_start` | |
| `projectDescription` | `project_description` | |
| `fileToUpload_1..4` | `image_name_1..4` | Supabase Storage path/key |
| — | `added_by` | constant `'Online Form'` |
| — | `received_date` | `current_date` |
| — | `status` / `source` | `'new'` / `'live'` |

Detail stages (form provides only these four — mirror `calllogprocessor2.php`):
| Form field | stage_key | stage_label (legacy) |
|---|---|---|
| `projectOutline1` | `dis` | Disassembly / Tasks |
| `projectOutline11` | `int` | Additional Notes |
| `projectHours` | `ext` | Owner Labor Estimate |
| `projectParts` | `wring` | Owner Part Estimate |

> Note: the rich 13-stage breakdown is NOT collected by the public form; it comes from
> internal entry. Phase 2 only needs the four above. Confirm whether `admin.html` is a
> fuller entry path we must also port.

---

## Workstreams / task breakdown

### A. Submission endpoint
- ☐ Decide form hosting: (a) keep `submission/index.html`, repoint its `action` to the new
  endpoint, or (b) rebuild as a Next.js page in `web/app/submit`. (Recommend (b) long-term;
  (a) is a faster interim.)
- ☐ Route Handler `POST /api/submit` (or Server Action) — accepts multipart, validates.
- ☐ Insert uses the **service role** server-side (submissions come from the public, not an
  authenticated staff user) — endpoint must be carefully scoped (rate-limit, validate, no
  arbitrary columns) since it writes with elevated privileges.

### B. Port processor logic
- ☐ Phone formatter (strip non-digits → `(xxx) xxx-xxxx`).
- ☐ Distance: haversine from shop ZIP `23517` (36.8695, -76.2945) using `zipcodes`; null when ZIP unknown.
- ☐ Insert submissions + the 4 detail stages atomically (one RPC or a transaction).
- ☐ Spam handling: legacy left obvious bot rows as `Deleted=1`. Add basic validation / honeypot / rate-limit.

### C. Images → Supabase Storage
- ☐ Create private `submissions` bucket; policy so only authenticated staff can read.
- ☐ Upload as `{submission_id}_{n}.{ext}`; store the key in `image_name_1..4`.
- ☐ Viewer: swap `UPLOADS_BASE` for Storage signed URLs (component already centralizes this).
- ☐ (Separate task) backfill-migrate the existing `/uploads` folder from Bluehost into Storage.

### D. Confirmation email
- ☐ **Decision needed:** Resend (recommended — simple API, generous free tier) vs SMTP vs Supabase Auth email.
- ☐ Port the FantomWorks confirmation copy from `calllogprocessor2.php` (the 2–4 week / call-log message).
- ☐ From `fwmail@fantomworks.com`, reply-to `webmaster@fantomworks.com` (verify domain in the email provider).

### E. Complete the viewer write-actions
- ☐ Audit the `functions/*.php` (still need to pull these from Bluehost) so the new viewer matches
  every legacy action: call attempts, notes, bump, archive, pending/confirmed/office, thanks-no-thanks,
  generic/pass emails, master search.
- ☐ Confirm each write persists to Supabase and RLS allows it for authenticated staff.

### F. Cutover
- ☐ **Strategy decision:** dual-write window (old form → both DBs) vs hard switch with old DB fallback.
  Recommend dual-write for ~1–2 weeks, reconcile counts daily, then flip.
- ☐ Reconciliation check: compare new rows in old DB vs Supabase during the window.
- ☐ Flip `projects.fantomworks.com` form to the new endpoint; retire `calllogprocessor2.php`.

### G. Validation
- ☐ Test submissions end-to-end (with/without images, edge ZIPs, long descriptions, unicode).
- ☐ Verify a real submission appears on the new call log with correct distance, status `new`, photos.
- ☐ Load/spam test the public endpoint.

---

## Open decisions
1. **Email provider** — Resend (recommended) / SMTP / other.
2. **Form hosting** — repoint existing HTML (fast) vs rebuild in Next.js (cleaner). Can do both: interim then rebuild.
3. **Cutover** — dual-write window (recommended) vs hard switch.
4. **Endpoint auth model** — public write via a locked-down service-role endpoint; confirm rate-limit/anti-spam approach.
5. Is `admin.html` a second entry path that must also be ported?

## Still needed from Bluehost
- The `functions/*.php` directory (defines the exact viewer write-actions — workstream E).
- The `/uploads` image folder (workstream C backfill).
- Confirm whether `admin.html` / any fuller form exists.

## Exit criteria
New customer submissions land in Supabase (with images + confirmation email), appear on the new
call log automatically, and the old form no longer writes to the old DB. Staleness gap closed;
new DB is authoritative → unblocks Phase 3.
