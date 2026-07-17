# Architecture Decisions — Call Log (standalone v1)

Scope: a standalone internal call-log app for Dan + a handful of shop staff to view and work
submissions. Read-heavy, low write volume, ~5 trusted users. Not public-facing.

## Stack
- **Next.js (App Router)** on **Vercel** — Server Components for reads, Server Actions for writes
- **Supabase** — Postgres + Auth + Storage (images) + Row Level Security
- **`@supabase/ssr`** for auth/session wiring between Next and Supabase
- **Postgres functions (plpgsql)** — only for writes needing DB-native atomicity (see below)
- **Go** — optional, for throwaway migration / resync tooling only (not part of the app)

**Why not a separate Go backend:** one internal app = one deploy, one auth boundary, one language
context. A second service adds CORS, token plumbing, and a second deployable for no benefit at this size.
Go stays in the toolbox for the bulk MySQL→Postgres load/resync and any future heavy submission-side work.

## Write-path rule
Default to server-side TypeScript; escalate to a DB function only when atomicity demands it.

| Operation | Where | Why |
|---|---|---|
| Call/email attempt, note, status change (pending/active/archive/delete/possible) | **Server Action** | app logic, parameterized, RLS via user session |
| New submission (submissions + details + images + distance calc) | **Server Action**, or one **RPC** if transactional | multi-table; wrap in RPC if all-or-nothing matters |
| Bump-to-top / reorder relative to other rows | **Postgres function** (`rpc`) | must be atomic, set-based |
| Reads (call log list, detail view) | **Server Components** querying Supabase | RLS-protected, no client-side secrets |

Avoid: business rules (distance, phone formatting) in browser code; routine writes as plpgsql.

## Auth model — invite-only, no public registration
- **Public sign-ups DISABLED** in Supabase Auth settings. Only way in = accounts we create.
- **Users provisioned manually** — Supabase dashboard (Auth → Users → Add user) or a one-off
  script with the service-role key (`auth.admin.createUser`). ~5 users, so no register page / no
  email-confirmation flow to build.
- **Sign-in:** email + password handed to each user (least friction for Dan). Magic-link is an option.
- **RLS v1:** being authenticated = full access. No `staff`/roles table needed yet.
  Per-user restrictions (e.g. "only Dan can delete") become a one-line role check if/when wanted.
