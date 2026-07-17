# Security Notes & Open Questions

## 🔴 Security items (from the legacy code)
1. **Hardcoded DB credentials** were in `call-log/index.php` and `call-log/calllogprocessor2.php`
   in plaintext. Now redacted in-repo; real values live in `exports/legacy-db-credentials.local.txt` (gitignored).
   → **Rotate this password** once the migration is done and the old code is retired.
2. **SQL injection** throughout the legacy app — user input is string-interpolated into queries
   (e.g. `search`, `sort`, `$point2_zip`). Not our problem to fix in the old app, but a reason not to
   leave it running longer than necessary. The new stack uses parameterized queries + RLS by construction.
3. **Open image upload** — `getimagesize` is the only check; filenames are user-influenced. In the new
   stack this becomes Supabase Storage with type/size limits and signed URLs.
4. **No auth on the call-log viewer** (as far as we can tell) — `calls.fantomworks.com` may be
   protected only by obscurity/htaccess. Phase 1 adds real auth (Supabase Auth + RLS). **Confirm** how
   it's currently gated so we don't regress access for Dad/staff.

## Open questions to resolve (need Dad or GoDaddy access)
- [ ] Can you get into phpMyAdmin yourself, or is it gated behind Dad's GoDaddy login?
- [ ] Actual row counts — how many submissions total? (affects import approach, not feasibility)
- [ ] Confirm the real schema vs. our reconstruction — especially exact column **types** and any
      tables the two PHP files don't touch.
- [ ] Where do the `functions/*.php` files live — can we pull the full `calls.fantomworks.com` directory?
- [ ] How big is the `/uploads` image folder (count + total size)? Migrating to Supabase Storage.
- [ ] Is `admin.html` / `projects.fantomworks.com/admin.html` a separate manual-entry path we must preserve?
- [ ] Does Dad want to keep the exact pipeline (Call Log → Pending → Active → Finished + Possibles/Archives),
      or is this a chance to simplify the workflow?

## Resolved
- ✅ **Auth model:** multiple users, invite-only (no register page), ~5 people, provisioned manually.
  Full access for any authenticated user in v1. → see `docs/03-architecture.md`.
- ✅ **Stack / write-path:** Next.js + Supabase monolith, Server Actions for writes, Postgres functions
  only for atomic ops (bump). No separate Go backend for the app. → see `docs/03-architecture.md`.

## phpMyAdmin export checklist (do this first)
1. Log into GoDaddy → hosting → phpMyAdmin → select database `fantomwo_call_log`.
2. **Structure-only first** (safe, no customer data): Export → Custom → uncheck "Data", format SQL → save to `exports/`.
3. Then a **full export** when ready: Export → Custom → include Data → format SQL (or per-table CSV if phpMyAdmin times out).
   - If it times out on GoDaddy: export table-by-table, or ask GoDaddy support for a `mysqldump`.
4. Separately, download the `/uploads` folder (FTP/File Manager) for the images.
5. Drop everything in `exports/` — the `.sql`/`.csv`/uploads are gitignored so customer data never hits git.
