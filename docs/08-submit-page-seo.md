# Submit page SEO — displacing the legacy form in search

Written 2026-08-19. Problem: searches like "submit my project fantomworks" return the
**legacy** form, so submissions land in the old MySQL call log instead of Supabase.

---

## 1. What Google actually has indexed

Verified live on 2026-08-19:

| URL | Title | Status |
|---|---|---|
| `projects.fantomworks.com/` | FantomWorks Project Submission Form | 200, indexed, ranks |
| `www.projects.fantomworks.com/completeform.php` | FantomWorks Project Submission Form 3 | 200, indexed, ranks |
| `projects.fantomworks.com/projdesc.php` | (step page) | 200, crawlable |
| `submit.fantomworks.com/` | — | **absent from results** |

`completeform.php` is the worst of these: it is a mid-flow step of the legacy form that
posts to `calllogprocessor.php`, so a searcher can land there and submit straight into
the old call log without ever seeing the first page.

Two things kept the legacy pages ranking and the new page invisible:

1. The legacy title is a near-exact match for the query, on a URL with years of history.
2. `submit.fantomworks.com` was effectively uncrawlable — see below.

The main WordPress site no longer links to `projects.fantomworks.com` anywhere
(checked `/`, `/about/contact-us/`, `/services/`, `/projects/`, `/behind-the-scenes-and-faq/`),
so this is pure index inertia. Nothing on the marketing site needs changing.

---

## 2. The blocking bug

`proxy.ts` matched `/robots.txt` and `/sitemap.xml`, and `updateSession` did not list
them as public, so both **307-redirected to `/login`**:

```
$ curl -sS https://submit.fantomworks.com/robots.txt
Redirecting...   [307]
```

There was no `robots.ts` or `sitemap.ts` to serve anyway. Fixed by excluding both from
the proxy matcher and adding real route handlers.

---

## 3. Changes made in `web/`

| File | Change |
|---|---|
| `proxy.ts` | Exclude `robots.txt` / `sitemap.xml` from the matcher |
| `lib/supabase/middleware.ts` | Extract `isPublicPath`; skip the Supabase `getUser()` round-trip for anonymous visitors on public paths (TTFB on the one page that needs it) |
| `app/robots.ts` | New. Allows `/`, disallows only the token URLs `/auth/` and `/confirm/`, points at the sitemap |
| `app/sitemap.ts` | New. One entry: `https://submit.fantomworks.com/` |
| `lib/seo.ts` | New. Canonical origin + verified NAP data |
| `app/layout.tsx` | `metadataBase`, and `robots: noindex, nofollow` as the app-wide default |
| `app/submit/page.tsx` | Query-matched title/description, canonical, OG/Twitter, JSON-LD, and `index, follow` overriding the layout default |
| `app/submit/opengraph-image.tsx` | New. Generated 1200x630 card |
| `components/fw/SelfSubmissionForm.tsx` | `<h1>` was "Before you start" — now "Submit Your Project", with the old text demoted to the subheading |

Two notes on the choices:

- **Disallow is not de-indexing.** The private routes are `noindex` via metadata, *not*
  blocked in robots.txt. A blocked URL cannot be crawled, so Google never reads the
  `noindex` and the URL can linger in the index as a bare result. Allow the crawl, let
  the tag do the work.
- **Canonical is the root**, `https://submit.fantomworks.com/`, not `/submit`. The proxy
  rewrites the root to `/submit` for that host, so both URLs serve identical HTML — and
  so do `fantomworks.vercel.app` and the two `*-ezhomesteading-app.vercel.app` domains.
  Four hosts x two paths of duplicate content, all now consolidated onto one URL.

---

## 4. What is still outstanding — the actual fix

**Everything above makes the new page rankable. None of it removes the old one.**
Only the legacy host can do that, and it is not in this repo — it is Apache on the VPS
(`162.144.141.151`, `server.fantomworks.com`), which we have WHM root on per doc 07.

`legacy-redirect/.htaccess` is written and ready. Deploy it to the docroot for
`projects.fantomworks.com` (confirm the path in cPanel -> Domains; likely
`~/public_html/projects`), with `legacy-redirect/robots.txt` beside it:

- 301s the form, `completeform.php`, `projdesc.php` and everything else to
  `https://submit.fantomworks.com/`
- **keeps `/uploads/**` serving** — `web/next.config.ts` still image-loads legacy photos
  from that host, so a blanket redirect would break historical call-log images
- keeps `robots.txt` readable, so crawlers can actually see the 301s

The 301 is what transfers the legacy page's ranking history to the new URL. A `noindex`
on the old page would remove it but throw that history away; the redirect is strictly better.

`www.projects.fantomworks.com` resolves to the same IP and serves the same content — confirm
it shares the docroot, or drop the same file in its own.

### After deploying

1. Verify: `curl -I https://projects.fantomworks.com/` -> `301` to `https://submit.fantomworks.com/`,
   and `curl -I https://projects.fantomworks.com/uploads/` -> still `200`.
2. Google Search Console: add `submit.fantomworks.com` as a property, submit
   `https://submit.fantomworks.com/sitemap.xml`, and Inspect -> Request Indexing on the root.
3. On the `projects.fantomworks.com` property, use **Change of Address** if it is a registered
   property; otherwise the 301s are picked up on recrawl (days to weeks).
4. Confirm the old MySQL call log stops receiving rows.

---

## 5. Unrelated finding, worth a look

`https://projects.fantomworks.com/uploads/` returns `200` with a browsable directory
listing of customer-submitted photos. That is a privacy exposure independent of SEO —
it also means the photos are crawlable. Add `Options -Indexes` for that path.
