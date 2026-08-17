import type { ReactNode } from 'react'
import {
  ArrowUpDown,
  Camera,
  CheckCircle2,
  Database,
  FileText,
  Filter,
  Gauge,
  Globe,
  History,
  Images,
  KeyRound,
  LayoutGrid,
  ListChecks,
  Lock,
  Mail,
  MailPlus,
  MapPin,
  MousePointerClick,
  NotebookPen,
  Palette,
  PanelsTopLeft,
  Pencil,
  Printer,
  Rocket,
  Search,
  SearchX,
  Server,
  Smartphone,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'

export type ReleaseItem = {
  icon: ReactNode
  title: string
  body: string
}

export type Release = {
  id: string
  date: string
  title: string
  items: ReleaseItem[]
}

const SZ = 15

export const RELEASES: Release[] = [
  {
    id: '2026-08-16-theme-memory',
    date: '2026-08-16',
    title: 'Night shift is remembered, plus patch notes',
    items: [
      {
        icon: <Palette size={SZ} />,
        title: 'Day/night sticks between visits',
        body: 'The night-shift toggle now saves to your browser and is applied before the page paints, so the Call Log opens in whichever mode you left it — no flash of the wrong theme on the way in. Your choice carries across the New Lead form, the templates screen and the email composer too.',
      },
      {
        icon: <History size={SZ} />,
        title: 'Patch notes',
        body: 'Every change that has shipped, with the date it went out, from the clock icon in the header on desktop. What’s New still pops once per release with just the latest items.',
      },
    ],
  },
  {
    id: '2026-08-sort-pwa',
    date: '2026-08-14',
    title: 'Installable app and two-way sorting',
    items: [
      {
        icon: <SearchX size={SZ} />,
        title: 'Search clears when you switch tabs',
        body: 'Jumping from Call Log to Pending (or any other tab) while a search is active now clears the search box, instead of carrying that search — and its result ordering — into the new tab.',
      },
      {
        icon: <ArrowUpDown size={SZ} />,
        title: 'Call Log now starts oldest-first',
        body: 'The Call Log tab defaults to the oldest received leads first, so nothing new sits unworked at the bottom. Every other tab still opens newest-first, as before.',
      },
      {
        icon: <ArrowUpDown size={SZ} />,
        title: 'Every sort now has a direction',
        body: 'Open Filters and each sort — Received, Customer name, Vehicle year, Distance — now offers both directions: oldest/newest, A→Z/Z→A, nearest/farthest. Pick whichever fits what you’re working on.',
      },
      {
        icon: <Smartphone size={SZ} />,
        title: 'Installable as an app',
        body: 'The Call Log can now be installed to your phone or desktop like a native app — it opens in its own window, no address bar. Look for the Install button next to New Lead. On iPhone/iPad it walks you through adding it from Safari’s share menu instead, since iOS doesn’t support one-tap install.',
      },
    ],
  },
  {
    id: '2026-08-11-notes-and-emails',
    date: '2026-08-11',
    title: 'Dated notes, sent-email history, seven-year cleanup',
    items: [
      {
        icon: <Mail size={SZ} />,
        title: 'Sent emails have their own section',
        body: 'Emails now come from the send record itself rather than being appended into notes, and read as collapsible entries under an Emails Sent heading on both the desktop card and the mobile sheet — expanded by default. This filled itself in retroactively: everything sent since the email tool shipped shows up, including sends that never made it into the notes.',
      },
      {
        icon: <NotebookPen size={SZ} />,
        title: 'Notes are dated, editable and removable',
        body: 'New notes carry a date that renders as Today, Yesterday, “May 8”, or “May 8, 2025” as it ages — the date is stored, so “Today” doesn’t freeze into the text overnight. In Edit mode every note gets its own box and a remove control, and a logged call attempt can be cleared by clicking it.',
      },
      {
        icon: <Trash2 size={SZ} />,
        title: 'Leads older than seven years retired',
        body: '444 untouched Call Log leads dated more than seven years back were archived out of the tab, taking Call Log from 469 down to 25. Pending, Active, Finished and Possible were left alone, and nothing was hard-deleted — sent emails, detail stages and photos are all still on file.',
      },
      {
        icon: <Sparkles size={SZ} />,
        title: 'What’s New',
        body: 'New features now announce themselves once in a dialog on first visit after a release, per browser, instead of going unnoticed.',
      },
    ],
  },
  {
    id: '2026-08-10-email-history',
    date: '2026-08-10',
    title: 'Sends land in the lead’s history',
    items: [
      {
        icon: <Mail size={SZ} />,
        title: 'Every send is written down',
        body: 'Sending an email from a lead records it against that lead with the recipient, subject and date, so the next person to open the card can see what the customer was already told.',
      },
    ],
  },
  {
    id: '2026-08-07-search',
    date: '2026-08-07',
    title: 'Search across the whole pipeline',
    items: [
      {
        icon: <Search size={SZ} />,
        title: 'Cross-category fuzzy search',
        body: 'Search now spans every status at once instead of only the tab you’re on, ranks by relevance, and groups results by category with the current tab floated to the top. Typos and nicknames work — “corvete” finds Corvettes, “chevy” finds Chevrolets — and matched words are highlighted on the card. Filters gained per-category toggles with live counts.',
      },
      {
        icon: <Filter size={SZ} />,
        title: 'Description and task search is opt-in',
        body: 'The two long free-text fields were what made search slow, so they’re off by default: a typical query went from 500–600ms to about 150ms. Switch them back on per search under Filters → Also search. The empty state tells you when they were skipped.',
      },
      {
        icon: <Camera size={SZ} />,
        title: 'Photos shrink before they upload',
        body: 'Submission photos are capped at a 2000px long edge and re-encoded in the browser before upload — a 9MB camera original lands around 400KB. That also fixes uploads that used to fail silently against the 10MB limit, and makes thumbnails load quickly.',
      },
    ],
  },
  {
    id: '2026-08-06-email-templates',
    date: '2026-08-06',
    title: 'Email templates, a real mobile layout, own subdomains',
    items: [
      {
        icon: <MailPlus size={SZ} />,
        title: 'Email template builder',
        body: 'Write and edit reusable templates on the Templates screen, then compose from any lead with the customer’s details already filled in. Estimate figures pull straight from the lead’s task breakdown.',
      },
      {
        icon: <Smartphone size={SZ} />,
        title: 'Built for the phone',
        body: 'The Call Log and both submission forms got a proper mobile layout: leads open in a full-screen sheet, the pipeline tabs scroll sideways, and the controls are sized for thumbs.',
      },
      {
        icon: <ArrowUpDown size={SZ} />,
        title: 'Sort archived leads by when they were archived',
        body: 'Archived and finished leads track the date they changed status, so they can be ordered by when they left the pipeline rather than when they first came in.',
      },
      {
        icon: <KeyRound size={SZ} />,
        title: 'Stays signed in',
        body: 'Sign-in can be saved to the browser and reused automatically, and signing out only signs out this browser instead of every device on the shared account.',
      },
      {
        icon: <Globe size={SZ} />,
        title: 'Own subdomains',
        body: 'submit.fantomworks.com serves the customer form and log.fantomworks.com serves the Call Log, each at its own clean root URL.',
      },
      {
        icon: <PanelsTopLeft size={SZ} />,
        title: 'Logo and icons',
        body: 'The FantomWorks logo sits in the header and doubles as the browser and app icon; New Lead moved to its own address.',
      },
    ],
  },
  {
    id: '2026-08-05-confirmations',
    date: '2026-08-05',
    title: 'Submission confirmation emails',
    items: [
      {
        icon: <CheckCircle2 size={SZ} />,
        title: 'Customers confirm their submission',
        body: 'A new submission sends a confirmation email with a one-click link, and the confirmation is recorded against the lead — so you can tell a real inquiry from a mistyped address before spending a call on it.',
      },
      {
        icon: <Server size={SZ} />,
        title: 'Mail that actually arrives',
        body: 'Outbound mail moved to a real sending service with matching DNS records, instead of going out through the legacy shared host and landing in spam.',
      },
    ],
  },
  {
    id: '2026-07-23-office-form',
    date: '2026-07-23',
    title: 'Office form rebuild, real saves, printable work orders',
    items: [
      {
        icon: <ListChecks size={SZ} />,
        title: 'Submissions actually save',
        body: 'Both intake forms — staff office entry and the public wizard — now write straight into the Call Log, continuing the same lead-number sequence the old site used.',
      },
      {
        icon: <Printer size={SZ} />,
        title: 'Printable work order',
        body: 'A lead can be printed as a clean work order for the shop floor.',
      },
      {
        icon: <MapPin size={SZ} />,
        title: 'ZIP fills in the rest',
        body: 'Typing a ZIP code resolves the city and state and works out the distance from the shop, so it doesn’t have to be keyed by hand.',
      },
    ],
  },
  {
    id: '2026-07-18-performance',
    date: '2026-07-18',
    title: 'Faster Call Log, numbered pages, private photos',
    items: [
      {
        icon: <Gauge size={SZ} />,
        title: 'Faster loads',
        body: 'Tab counts come from one grouped query instead of pulling every row on every navigation, list queries fetch only the columns the screen actually uses, and new indexes match the sorts the app really runs.',
      },
      {
        icon: <LayoutGrid size={SZ} />,
        title: 'Numbered pagination',
        body: 'Prev/Next became a real pager: first and last jumps, windowed page numbers, left/right arrow keys, and prefetching so any page you can see opens instantly.',
      },
      {
        icon: <Images size={SZ} />,
        title: 'Thumbnails instead of full-size originals',
        body: 'Lead photos are resized on the way to the browser. A 50-row page used to pull up to 200 full-resolution originals just to draw 108px tiles.',
      },
      {
        icon: <Lock size={SZ} />,
        title: 'Customer photos are private',
        body: 'The photo bucket is no longer readable by anyone with the URL; photos are served to signed-in staff through short-lived signed links.',
      },
      {
        icon: <FileText size={SZ} />,
        title: 'Simpler self-submit tasks',
        body: 'Each task is one plain line, with optional whole-list estimates for materials and labor hours at the bottom. Entering an estimate shows the per-task average and asks the customer to acknowledge it before continuing. Photo and intro copy rewritten.',
      },
    ],
  },
  {
    id: '2026-07-17-work-order',
    date: '2026-07-17',
    title: 'Rebuilt as a Shop Work Order console',
    items: [
      {
        icon: <Palette size={SZ} />,
        title: 'A console instead of a table',
        body: 'Warm paper, hot-rod red and graphite steel: each lead is a work-order card with an age spine, an online-vs-office source rail, inline photos, tasks and notes, an estimate rollup at $95/hr, and a cue for how long since the last contact. Pipeline nav, search, density and filters sit in a sticky header — including the night-shift theme.',
      },
      {
        icon: <Pencil size={SZ} />,
        title: 'Editable leads',
        body: 'Edit mode turns each card section — Customer, Vehicle, Tasks, History, Photos — into a click-to-edit dialog, including adding photos to an office lead that arrived without any. Adds a vehicle-storage field to both forms and the card.',
      },
      {
        icon: <ListChecks size={SZ} />,
        title: 'Office and self-submission forms',
        body: 'Staff quick-entry on a single page, and a six-step public wizard with live validation, a draft you can leave and resume, and photo upload.',
      },
      {
        icon: <MousePointerClick size={SZ} />,
        title: 'Real dialogs and actions',
        body: 'Browser prompts and confirms replaced with proper dialogs, the five status buttons collapsed into one menu (adding the Finished and back-to-Call-Log moves that were unreachable), photos open in an in-app lightbox, and the age dots and source badge explain themselves on hover.',
      },
      {
        icon: <Zap size={SZ} />,
        title: 'Hardened data layer',
        body: 'Detail stages load in one batched query instead of one per row, search terms are escaped, sorting and paging happen in the database, and Bump stamps its own column instead of overwriting the received date — which used to destroy the real date and flip the age color.',
      },
    ],
  },
  {
    id: '2026-07-17-launch',
    date: '2026-07-17',
    title: 'The Call Log moves off the legacy site',
    items: [
      {
        icon: <Database size={SZ} />,
        title: 'Migrated to a real database',
        body: '5,899 submissions, 28,000 detail stages and 43,000 ZIP codes converted out of the legacy Bluehost/PHP database — HTML entities and mojibake cleaned up, ZIPs padded, and status derived from the old flags.',
      },
      {
        icon: <Rocket size={SZ} />,
        title: 'New Call Log viewer',
        body: 'A new web app with invite-only sign-in, pipeline views, search, sort and per-lead detail with the project stage breakdown, replacing the legacy PHP screens.',
      },
      {
        icon: <Images size={SZ} />,
        title: 'Photos render again',
        body: 'Submission photos are pulled from the legacy uploads host, with a count on each row so they’re findable without opening the lead.',
      },
    ],
  },
]

export const LATEST_RELEASE = RELEASES[0]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatReleaseDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`
}
