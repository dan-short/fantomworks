# FantomWorks web app

This folder holds the Next.js app for FantomWorks, a classic car restoration shop. One codebase has two audiences. Shop staff use the call log at `/calls` to work incoming project submissions through a pipeline of statuses. Customers use the public form at `/submit` to describe a vehicle and the work they want done. Both read and write one Supabase Postgres database.

The app is one part of a migration off the legacy GoDaddy PHP and MySQL call log. The parent folder holds the SQL migrations (`../migrations`), the import and admin scripts (`../scripts`), the legacy PHP reference code and the planning documents (`../docs`). Read `../docs/03-architecture.md` for the design decisions behind this app.

## Stack

- Next.js 16.2.10 with the App Router, React 19.2.4 and TypeScript. Node 20.9 or later is required.
- Tailwind CSS 4 and shadcn/ui components (the `radix-nova` style, configured in `components.json`).
- Supabase for Postgres, Auth and Storage, through `@supabase/ssr` and `@supabase/supabase-js`.
- Resend for email.

`AGENTS.md` warns that this version of Next.js differs from older releases. For example, the request interceptor is `proxy.ts` and not `middleware.ts`, and `searchParams` is a promise. Read the matching guide in `node_modules/next/dist/docs/` before changing framework-level code.

## Run it locally

Run every command in this folder.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The repository holds both `package-lock.json` and `bun.lock`, so `bun install` and `bun run dev` also work. The dispatcher `../scripts/fantomworks` uses bun.

Without Supabase variables the app starts in dev mode. Auth is bypassed and the app reads seed data from `lib/seed.ts`: two hand-written leads and a generated set that fills every pipeline tab and more than one page of the call log. If `lib/real-data.json` exists, the app reads that file instead. That file is ignored by git because it contains customer data, and `node scripts/convert.mjs` (run from the parent folder) builds it from a legacy MySQL dump. Edits in dev mode live in server memory and disappear when the server restarts.

To run against a real Supabase project, copy `.env.local.example` to `.env.local` and fill in the values. Next.js also loads `.env`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback. |
| `SUPABASE_SECRET_KEY` | Server-only key. The admin client uses it for public submissions, the ZIP code cache and confirmation links. Never prefix it with `NEXT_PUBLIC`. |
| `RESEND_API_KEY` | Enables email. Without it a submission still saves and no mail is sent. |
| `MAIL_FROM`, `MAIL_REPLY_TO` | Sender and reply-to for the customer confirmation email. |
| `MAIL_FROM_STAFF`, `MAIL_REPLY_TO_STAFF` | Sender and reply-to for email composed by staff in the call log. |
| `NEXT_PUBLIC_SITE_URL` | Origin used to build the confirmation link. It must match the deployed site. |
| `NEXT_PUBLIC_UPLOADS_BASE_URL` | Base URL for legacy photo files. The default is `https://projects.fantomworks.com/uploads/`. |
| `FANTOM_DB_URL` | Postgres connection string. Only the shell scripts in `../scripts` read it, from `.env`. The app does not use it. |

The Node scripts in `../scripts` read `web/.env` and not `.env.local`. Keep the Supabase variables in `.env` if you use those scripts. Never commit either file.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Build for production. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint with the Next.js core-web-vitals and TypeScript rules. |

The project has no automated test suite and no continuous integration configuration. `../scripts/test-writes.mjs` checks the staff write actions against a live Supabase project. It signs in as a staff user, exercises each action on a spam row and restores the original values.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Staff | Redirects to `/calls`. |
| `/calls` | Staff | The call log. The `view` parameter selects a pipeline tab (new, pending, active, possible, finished, archived) or the per-account saved tab. The parameters `q`, `cats`, `fields`, `sort`, `dir` and `p` control search, sorting and paging. |
| `/calls/[id]/email` | Staff | Compose and send an email to a lead from a template. |
| `/new` | Staff | Quick entry for a phoned-in or walk-in customer. |
| `/templates` | Staff | Manage email templates. |
| `/login` | Public | Staff sign in. Accounts are created by an administrator, and public sign-up is disabled. |
| `/submit` | Public | The customer project form. It is indexable and carries structured data and an Open Graph image. |
| `/confirm/[token]` | Public | Page a customer reaches from the confirmation email. The token expires after 30 days. |

`proxy.ts` calls `updateSession` in `lib/supabase/middleware.ts` on every request except static assets. That function redirects signed-out visitors to `/login` and keeps `/login`, `/auth`, `/submit`, `/confirm`, `/manifest.webmanifest` and `/sw.js` public. It also rewrites `/` on the `submit` and `log` subdomains to `/submit` and `/calls` (`lib/host-routing.ts`). The app is an installable PWA. `public/sw.js` does no caching and exists only to meet the installability requirement.

## Code layout

```
app/
  actions/        Server Actions: lead updates, submissions, email, templates, favorites
  calls/          Call log and the per-lead email composer
  confirm/        Customer confirmation page and its action
  login/          Sign-in page and action
  new/ submit/    Office quick entry and the public form
  templates/      Email template manager
  manifest.ts, robots.ts, sitemap.ts
components/
  fw/             App components (CallConsole, LeadCard, forms, EmailComposer, ...)
  ui/             shadcn/ui primitives
lib/
  supabase/       Server, browser, admin and proxy clients
  email/          Resend client, templates, composition, confirmation, send history
  data.ts         Reads for the call log, with the dev-mode store
  seed.ts         Fixture leads for dev mode
  ...             Search, sorting, distance, photo handling, SEO constants, theme
proxy.ts          Session refresh, auth gate and host rewrites
```

## Data and storage

The schema lives in `../migrations`, numbered from `0001_initial_schema.sql` to `0015_submission_favorites.sql`. Apply the files to the Supabase project in order. Row level security gives any signed-in user full access to submissions and their detail stages, and there is no role table. Saved leads are the exception: each account reads and changes only its own rows.

Photos go in the private `submission-photos` storage bucket. The app creates signed URLs on the server with a one-hour lifetime. Older leads may still point to files under the legacy uploads URL, which `next.config.ts` allows as a remote image host together with the Supabase storage host.

## Deploy

The app deploys on Vercel as the project named `fantomworks`. The repository has no `vercel.json`, so build and root directory settings live in the Vercel project. Set the environment variables listed above there, and make sure `NEXT_PUBLIC_SITE_URL` matches the production origin. The canonical origin for the public form is set in `lib/seo.ts`.

## Where to read next

`../docs/01-phase-plan.md` has the roadmap. `../docs/04-phase2-scope.md` covers the write path and the cutover. `../docs/08-submit-page-seo.md` explains the search indexing work on `/submit`.
