# Phase Plan — GoDaddy/PHP → Supabase + modern frontend

Goal: eventually replace all of fantomworks.com. Sequenced so each phase is independently
useful and low-risk, and nothing customer-facing changes until the new stack has proven itself.

Legend: ☐ todo · ◐ in progress · ☑ done

---

## Phase 0 — Project setup & audit  ◐
- ☑ New repo (`~/Projects/fantomworks`, git initialized)
- ☑ Reverse-engineer schema/workflow from legacy PHP (`docs/00-current-state-audit.md`)
- ☑ Get real DB credentials out of git; redact legacy files (`docs/02-security-and-open-questions.md`)
- ☐ **Get a real DB export from GoDaddy phpMyAdmin** (structure first, then data) — see checklist in doc 02
- ☐ Collect the missing `functions/*.php` files (defines the write-actions for Phase 3)

## Phase 1 — Call-log VIEWER on a new live URL (read-only, zero risk)
The new Supabase DB holds a **copy**; the old site keeps running untouched.
- ☑ Convert MySQL schema → Postgres (`migrations/0001`), refined against the real dump
- ☑ Load data into Supabase — custom converter (`scripts/convert.mjs`) + fast `COPY` load (`scripts/fast-load.sh`); 5,899 submissions + 28k detail stages
- ☑ Import `ZipCodes` reference table (43,590 rows)
- ☑ Next.js (App Router) app — Server Components for reads, Server Actions for writes (see `docs/03-architecture.md`)
  - call-log table with pipeline views (Call Log / Pending / Active / Finished / Possibles / Archives)
  - age-based color coding, search, sort by Name/Vehicle/Received/Distance, per-row detail (stages + photos)
- ☑ Supabase Auth via `@supabase/ssr`: public sign-ups disabled, `office` user provisioned (`scripts/create-user.mjs`)
- ☑ Sign-in page (username/email + password); RLS = authenticated staff full access (`migrations/0002`)
- ☑ Deploy to Vercel — **live at https://fantomworks.vercel.app**
- **Exit criteria:** ✅ Dad can view the call log on the new site.
- **Known limitation (until Phase 2):** old form still writes to the OLD db, so the copy goes stale → resync periodically until cutover.

## Phase 2 — Point form submissions at the new DB (the real cutover)  ◐ UI started, write path not begun
The only delicate step — a live write path. **Full breakdown in [`docs/04-phase2-scope.md`](04-phase2-scope.md).**
- ◐ Submission form UIs rebuilt in Next.js — self-service `web/app/submit` and office quick-entry `web/app/new` — but **UI-only stubs** (validate + preview, no persist). The write endpoint (`POST /api/submit` / server action) is not built.
- ☐ Port `calllogprocessor2.php` logic: phone format, distance calc (via `zipcodes`), atomic insert of submission + 4 detail stages
- ◐ Images → Supabase Storage: bucket now **private** with staff-only reads (`migrations/0006`); viewer mints signed URLs server-side (`web/lib/data.ts`); new photos stored as bucket keys; backfill old `/uploads` still pending
- ☐ Confirmation email (decision: Resend vs SMTP)
- ◐ Viewer write-actions: call attempts, notes, bump, status moves, edits, and search implemented (`web/app/actions/submissions.ts`); thanks-no-thanks / generic emails + `functions/*.php` parity audit remain
- ☐ **Cutover:** dual-write window (recommended) → reconcile → flip; retire `calllogprocessor2.php`
- **Exit criteria:** new submissions land in Supabase w/ images + email, appear on the call log; new DB is source of truth.

## Phase 3 — Migrate the rest of fantomworks.com
- ☐ Inventory remaining pages/content on the main site
- ☐ Port off PHP; repoint apex `fantomworks.com` to the new deployment
- ☐ Decommission Bluehost hosting (keep or transfer the domain registration)
- ☐ Rotate the old DB password; retire legacy `mysqli` code

---

## Target stack (proposed)
- **DB/back end:** Supabase (Postgres + Auth + Storage + auto REST/realtime + RLS)
- **Front end:** Next.js (App Router) + `supabase-js`, deployed on Vercel
- **Images:** Supabase Storage bucket (replaces the GoDaddy `/uploads` folder)
- **Migration tooling:** `pgloader` for the bulk MySQL→Postgres pass; versioned SQL in `migrations/`

## Immediate next action
Grab a **structure-only** export from phpMyAdmin (no customer data needed to start) and drop it
in `exports/`. That lets us finalize the Postgres schema in `migrations/` and scaffold the Phase-1 viewer.
