# FantomWorks call log

This repository holds the call log and project-submission system for FantomWorks, a classic-car and hot-rod restoration shop. Customers submit a vehicle and a project description through a public form. The owner and office staff call and email each lead, take notes, and move it along a pipeline: Call Log, Pending, Active, Finished, plus Possibles and Archives.

The system is moving off a legacy PHP and MySQL site onto Supabase (Postgres, Auth and Storage) and a Next.js app on Vercel. The move runs in phases, so that nothing customer-facing changes before the new stack has proven itself.

## Where things stand

Phase 1, the staff call-log viewer, is done and in use. Phase 2, the write path, is built in code. The public form at `/submit` saves submissions through the service-role client, stores photos in the private `submission-photos` bucket, and sends a confirmation email through Resend. Staff can log call and email attempts, edit notes and lead fields, bump, change status, search, compose emails from templates, and save leads. The code routes the `submit.` host to the form and the `log.` host to the call log (`web/lib/host-routing.ts`).

Two pieces are unconfirmed. `legacy-redirect/.htaccess` is written to 301 the old `projects.fantomworks.com` form to the new one, and `docs/08-submit-page-seo.md` lists deploying it as outstanding. The repository does not show whether that happened, or whether the legacy form still writes to the old MySQL database. Phase 3 (the rest of fantomworks.com, repointing the apex domain, retiring the legacy host and rotating the old database password) is listed as not started in `docs/01-phase-plan.md`.

`docs/01-phase-plan.md` and `docs/04-phase2-scope.md` still describe the submission write path as unbuilt. The code in `web/app/actions/submit.ts` is ahead of them, so trust the code where they disagree.

## Layout

```
web/                Next.js app (the only app in this repo)
migrations/         Postgres migrations 0001 to 0015
scripts/            Data load, user and lead tools, the fantomworks dispatcher
docs/               Audit, phase plan, architecture, DNS, email and SEO notes
legacy-redirect/    .htaccess and robots.txt for the legacy projects.fantomworks.com host
call-log/           Legacy PHP viewer and insert processor (reference only, credentials redacted)
submission/         Legacy public submission form (reference only)
exports/            Legacy dumps, converted CSVs and backups (SQL and CSV files are gitignored)
```

Two migration files share the number 0006: `0006_perf_counts_and_indexes.sql` and `0006_private_submission_photos.sql`. Apply both. The second one makes the photo bucket private and limits reads to signed-in staff.

Inside `web/`, `app/` holds the routes and `app/actions/` holds the Server Actions. The routes are:

| Route | Purpose |
|---|---|
| `/` | Redirects to `/calls` |
| `/calls` | Call Log console for staff |
| `/calls/[id]/email` | Compose an email to a lead |
| `/new` | Office quick-entry form |
| `/templates` | Email template manager |
| `/submit` | Public self-service submission form (no sign-in) |
| `/confirm/[token]` | Email confirmation link (no sign-in) |
| `/login` | Staff sign-in |

`proxy.ts` and `lib/supabase/middleware.ts` refresh the Supabase session, send anonymous visitors to `/login` and rewrite the root path by host name (`submit.` to `/submit`, `log.` to `/calls`). Components live in `components/fw/` (app-specific) and `components/ui/` (shadcn). Data access is in `lib/data.ts`, and email code is in `lib/email/`. Read `docs/03-architecture.md` for the reasoning behind the stack and the write-path rule.

## Run it locally

Install and start the app from the repository root with the dispatcher, or from `web/` directly. The dispatcher uses bun.

```bash
cd web && bun install
scripts/fantomworks dev
```

The dev server listens on port 3000. `scripts/fantomworks` also has `build` and `lint` commands, and `scripts/fantomworks shell` prints a zsh function and completion to add to `~/.zshrc`. Inside `web/`, `npm run dev`, `npm run build`, `npm start` and `npm run lint` are the underlying scripts.

Without Supabase variables the app runs in dev mode with auth bypassed. It reads `web/lib/real-data.json` if that file exists (gitignored, it holds customer data and `scripts/convert.mjs` produces it) and otherwise uses the sample data in `web/lib/seed.ts`. To run against a real project, copy `web/.env.local.example` to `web/.env.local` and fill in these names:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the app.
- `SUPABASE_SECRET_KEY`, server-only, for the public submit action and the admin scripts.
- `RESEND_API_KEY`, `MAIL_FROM` and `MAIL_REPLY_TO` for confirmation email. Without the API key a submission still saves and no mail is sent.
- `MAIL_FROM_STAFF` and `MAIL_REPLY_TO_STAFF` for email composed by staff from the Call Log.
- `NEXT_PUBLIC_SITE_URL`, the absolute origin used to build the confirmation link. It is inlined at build time, so a change needs a redeploy.
- `NEXT_PUBLIC_UPLOADS_BASE_URL`, optional. It overrides the legacy photo host, which defaults to `https://projects.fantomworks.com/uploads/`.

The shell and Node scripts in `scripts/` read `web/.env`, not `web/.env.local`. The shell scripts also need `FANTOM_DB_URL` there, a Postgres connection string for the FantomWorks project.

## Tests

There is no automated test suite and no CI. `bun run lint` in `web/` is the only scripted check. `scripts/test-writes.mjs` runs the staff write actions against a real Supabase project, signed in as a staff user with row-level security in force. It mutates a deleted lead and restores the original values.

## Database and data tools

Migrations are plain SQL files, applied in numeric order with `psql`. `provision.sh` applies only `0001` and `0002`, so apply the later files yourself. The tools in `scripts/` are:

- `provision.sh` applies `0001`, loads the converted legacy data, then applies `0002`. `load-fast.sh` does a faster `COPY` load into an already-migrated database.
- `wipe-and-load.sh` truncates the live tables and reloads them from a legacy dump. It asks you to type `WIPE` first. Read it before running it.
- `convert.mjs` and `parse-dump.mjs` turn a MySQL dump into `web/lib/real-data.json` and the load files in `exports/converted/`.
- `create-user.mjs` creates or updates a staff login. Sign-ups are disabled, so this is the only way in besides the Supabase dashboard.
- `find-lead.mjs` finds a lead by name, phone or email across every status, including deleted rows that the app hides. It is read-only.
- `purge-old-call-log.mjs` soft-deletes Call Log leads that are seven or more years old. It previews by default and writes only with `--apply`.

## Deploy

The app deploys to Vercel. `web/.vercel` links to a Vercel project named `fantomworks`, and `docs/01-phase-plan.md` gives `https://fantomworks.vercel.app` as the live address. Set the environment variables from the previous section in Vercel and redeploy after changing `NEXT_PUBLIC_SITE_URL`. `docs/07-dns-control-and-post-cutover.md` covers DNS delegation and the Resend domain setup, and `docs/06-email-deliverability-fix.md` covers the mail problems that led to it.

## Ground rules

Keep customer data and secrets out of git. `.gitignore` excludes `.env` files, `*.local.txt`, database dumps and CSVs in `exports/`, and `web/lib/real-data.json`. The legacy database credentials live only in `exports/legacy-db-credentials.local.txt`. Rotate that password once the legacy code is retired.

`scripts/create-user.mjs` and `scripts/test-writes.mjs` contain a default staff password in the source. Change the password on the live project, and do not reuse the default.

The app uses Next.js 16, which differs from older releases. Read the guide in `web/node_modules/next/dist/docs/` before changing framework code, as `web/AGENTS.md` instructs.

## Read next

`docs/00-current-state-audit.md` describes the legacy schema and workflow. `docs/02-security-and-open-questions.md` lists security items and open questions. `docs/05-call-log-design-brief.md` is the design brief for the Call Log screen, and `docs/08-submit-page-seo.md` explains the submit page and the legacy redirect.
