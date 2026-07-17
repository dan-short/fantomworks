# FantomWorks — Call Log Modernization

Migrating the FantomWorks call-log / project-submission system off legacy GoDaddy PHP + MySQL
onto a modern stack (Supabase Postgres + Next.js on Vercel), in low-risk phases.

## Layout
```
docs/
  00-current-state-audit.md        Reverse-engineered legacy schema & workflow
  01-phase-plan.md                 The phased roadmap + task checklist
  02-security-and-open-questions.md Security items, open questions, export checklist
migrations/
  0001_initial_schema.sql          Draft Postgres schema (refine vs. real dump)
exports/                           DB dumps & images land here (gitignored, never committed)
call-log/                          Legacy PHP reference (viewer + insert processor) — creds redacted
submission/                        Legacy public submission form (reference)
```

## Where we are
Phase 0 (setup & audit). Next action: pull a **structure-only** export from GoDaddy
phpMyAdmin into `exports/` — see the checklist in `docs/02`.

## Ground rules
- Customer data and secrets never hit git (see `.gitignore`). Real legacy creds live only in
  `exports/legacy-db-credentials.local.txt` and should be **rotated** after cutover.
- Target stack: Supabase (Postgres + Auth + Storage + RLS) · Next.js (App Router) · Vercel.
