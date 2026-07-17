# Design brief — FantomWorks Call Log (internal lead-tracking app)

Paste into Claude (or any design tool) to generate a redesign of the Call Log
screen. Self-contained — no codebase context required.

---

## Goal
Redesign the main "Call Log" screen. The current version works but looks
bland: flat gray table, no brand character, every button the same muted ghost.
I want it to feel like a purpose-built shop tool with real personality —
confident, tactile, and fast to scan — WITHOUT sacrificing information density.
Produce a high-fidelity, responsive single-screen mockup (HTML + inline CSS, or
React + Tailwind) using realistic sample data (~8 rows).

## Product context
FantomWorks is a classic-car / hot-rod restoration shop. This is the INTERNAL
tool the owner and office staff use every day to work incoming project leads.
Each lead is a person who submitted their car + project through the website (or
was entered by staff). Staff call/email them, take notes, and move them along a
pipeline. It's a desktop-first, data-dense, work-all-day screen — think airline
ops console or a service-writer's work order, not a marketing page.

## Aesthetic direction — "Shop Work Order"
Evoke a modern garage build sheet: warm paper, industrial signage type, a bold
hot-rod accent, and machined details. Anti-bland devices I want you to use:
- A colored **status spine** (3–4px bar) on the left edge of every row/card,
  driven by lead age (heat scale) — instant visual triage down the list.
- Strong typographic hierarchy: condensed uppercase section labels (garage
  signage feel), tabular mono for all numbers (phone, distance, dates, IDs).
- One signature accent color used with restraint for primary actions, the
  active nav tab, and key highlights — not gray-on-gray.
- Tactile rows/cards with real hover states and subtle depth; consider a faint
  blueprint-grid or paper texture on the app background.
- A summary strip up top: one stat chip per pipeline stage with live counts.
Keep it professional and legible — bold accents, restrained everywhere else.

## Color palette (light — primary)
- App background:   #F4F1EB  (warm porcelain / paper)
- Surface / card:   #FFFFFF
- Border / hairline: #E5DFD5
- Ink (text):       #211E1B
- Muted text:       #6B655D
- Brand accent:     #C1352B  (hot-rod red — primary buttons, active tab, brand)
  - accent hover:   #9E2A22
  - (alternate accent if red feels too loud: #E4572E ignition orange, or
     #2F5D50 british racing green)
- Structural steel: #3F4A55  (graphite blue — header bar, table head, dividers)

## Status & age color system (two separate scales — keep them distinct)
Lead-age heat (the left spine + a small dot):
- Fresh  <30d:  #0E9F6E  green
- Aging  30–60: #D9A404  amber
- Stale  60–90: #EA580C  orange
- Cold   >90d:  #DC2626  red
Pipeline status (chips / tabs), a different hue family so it doesn't collide:
- New (Call Log): neutral graphite   #3F4A55
- Pending:        amber   #B45309
- Active:         green   #15803D
- Possible:       violet  #7C3AED
- Finished:       slate   #64748B
- Archived:       stone   #8B8378

## Dark variant (optional "night shift" toggle)
- Background #17191C, surface #212428, border #313640, ink #ECEAE6,
  muted #9A948B; same brand red pops harder. Provide if easy.

## Typography
- Display / labels / brand: an industrial grotesque or condensed face
  (e.g. Archivo, Inter Tight, or Oswald for section labels).
- Body / data: Inter or Geist.
- Numbers: a monospace (Geist Mono / JetBrains Mono), tabular, for phones,
  distances, dates, IDs, and cost/hours.

## Layout (top → bottom)
1. **Header bar** (sticky): FantomWorks wordmark + "Call Log", signed-in user
   email, Sign out.
2. **Pipeline nav tabs** with per-stage counts: Call Log · Pending · Active ·
   Finished · Possibles · Archives. Active tab uses the brand accent.
3. **Toolbar**: search box (name / vehicle / city / email) with a clear (X)
   button; sort control — Received · Name · Vehicle · Distance.
4. **Summary stat chips**: count per pipeline stage.
5. **The list**: one row/card per lead (design the row — it can be a rich
   table row OR a work-order card; pick what reads best at density).

## Each lead row/card must display
- Left status spine colored by lead age; an age dot with tooltip.
- **Customer:** full name; a source badge — "Online" (website form) vs
  "Office · {staff name}" (entered by staff); phone; alt phone; email;
  preferred call time ("call schedule").
- **Vehicle:** year make model.
- **Location:** city, state/country, and distance in miles from the shop.
- **Legacy record ID** (#, small/mono).
- **Project:** budget, project start, freeform description, and an
  estimate/tasks breakdown (labeled line items each with optional parts $ and
  hours). Photo thumbnails (open a lightbox).
- **Contact attempts:** Call 1 / 2 / 3 and Email — each either a timestamp
  (done) or an action button (not yet done).
- **Notes:** an appended freeform thread.
- **Received date** + relative age ("3d ago", "5mo ago").

## Buttons / actions (show all of these, styled by intent)
Per row:
- Log Call attempt 1 / 2 / 3  (secondary; becomes a done timestamp once logged)
- Log Email attempt           (secondary)
- Add note                    (opens a dialog with a textarea; shows existing
                               notes above; Save is the primary/accent button)
- Bump to top                 (subtle)
- Actions menu (kebab ⋮): Move to Pending / Active / Possible / Finished /
  Back to Call Log; then Archive (confirm) and Delete (confirm, destructive red)
Global:
- Search + clear, Sort tabs, Pipeline nav tabs, Sign out
- Photo lightbox with prev/next

## Deliverable
A polished, self-contained mockup of the Call Log screen (light theme; dark
toggle if easy) with ~8 realistic sample leads across a few ages/statuses, so I
can judge the look and feel. Prioritize the row/card design and the overall
visual character — that's what feels bland today.
