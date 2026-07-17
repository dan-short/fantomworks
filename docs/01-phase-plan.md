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
- ☐ Convert MySQL schema → Postgres (draft in `migrations/`), refine against real dump
- ☐ Load a data snapshot into Supabase (pgloader or cleaned dump)
- ☐ Import `ZipCodes` reference table once
- ☐ Next.js (App Router) app — Server Components for reads, Server Actions for writes (see `docs/03-architecture.md`)
  - call-log table with the same pipeline views (Call Log / Pending / Active / Finished / Possibles / Archives)
  - age-based color coding, search, sort by Name/Vehicle/Received/Distance, per-row detail (incl. `Project_Desc` + images)
- ☐ Supabase Auth via `@supabase/ssr`: **disable public sign-ups**, provision the ~5 users manually (dashboard or `auth.admin.createUser`)
- ☐ Sign-in page (email + password); RLS policy = authenticated staff have full access (no roles table for v1)
- ☐ Deploy to Vercel at a test URL (e.g. `calls-next.fantomworks.com` or `*.vercel.app`)
- **Exit criteria:** Dad can view the call log on the new site and agrees it's at least as usable as today's.
- **Known limitation:** old form still writes to the OLD db, so the copy goes stale → resync periodically until Phase 2. Keep the stale window short.

## Phase 2 — Point form submissions at the new DB (the real cutover)
The only delicate step — a live write path.
- ☐ Rebuild the submission form (`submission/index.html`) against Supabase, OR keep the HTML and swap its backend to a Supabase insert / edge function
- ☐ Port the insert logic from `calllogprocessor2.php`: distance calc, phone formatting, image upload → **Supabase Storage** (replaces `/uploads` dir), confirmation email
- ☐ Add the Phase-1 write actions (call attempts, notes, bump, archive, status changes, delete) — needs `functions/*.php`
- ☐ **Cutover:** dual-write for a short window (old form → both DBs) OR hard-switch during a quiet period with old DB as fallback
- **Exit criteria:** new submissions land in Supabase; new DB is now source of truth; staleness problem gone.

## Phase 3 — Migrate the rest of fantomworks.com
- ☐ Inventory remaining pages/content on the main site
- ☐ Port off PHP; repoint apex `fantomworks.com` to the new deployment
- ☐ Decommission GoDaddy hosting (keep or transfer the domain registration)
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
