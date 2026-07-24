import type { Submission, DetailStage } from './types'
import { resolvePhotoUrl } from './images'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const fmtDate = (ts: string | null) =>
  ts
    ? new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

function infoRow(label: string, value: string | null | undefined): string {
  if (!value) return ''
  return `<div class="info-label">${esc(label)}</div><div class="info-value">${esc(value)}</div>`
}

// Opens a self-contained, print-ready page with just what the customer submitted
// (contact, vehicle, tasks, photos) — no internal pipeline data like estimated
// cost, call attempts, or status. Triggers window.print() once its own images
// finish loading, so "Save as PDF" in the print dialog produces a clean PDF.
export function printSubmission(lead: Submission, stages: DetailStage[]) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Submission'
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(' ')
  const location = [lead.city, lead.state_country].filter(Boolean).join(', ') + (lead.zipcode ? ` ${lead.zipcode}` : '')
  const storage = lead.storage_type
    ? `${lead.storage_type}${lead.storage_years != null ? ` — ${lead.storage_years} yr` : ''}`
    : null
  const budget = lead.budget != null ? `$${lead.budget.toLocaleString('en-US')}` : null

  const infoRows = [
    infoRow('Phone', lead.phone),
    infoRow('Alt phone', lead.alt_phone),
    infoRow('Email', lead.email),
    infoRow('Best time to call', lead.call_schedule),
    infoRow('Location', location.trim() || null),
    infoRow('Vehicle', vehicle || null),
    infoRow('Budget', budget),
    infoRow('Start', lead.project_start),
    infoRow('Storage', storage),
  ].join('')

  const taskItems = stages
    .filter((s) => s.description && s.description.trim())
    .map((s) => `<li>${esc(s.description || '')}</li>`)
    .join('')

  const photoUrls = (lead.images ?? [])
    .map((p, i) => lead.image_urls?.[i] || resolvePhotoUrl(p))
    .filter((u): u is string => Boolean(u))

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(name)} — Submission</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    color: #1f2430;
    margin: 0;
    padding: 44px 50px;
    background: #fff;
  }
  header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-bottom: 3px solid #3F4A55;
    padding-bottom: 14px;
    margin-bottom: 26px;
  }
  .wordmark {
    font-weight: 800;
    font-size: 18px;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #3F4A55;
  }
  .tagline {
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #8B8378;
    margin-top: 2px;
  }
  .printed {
    font-size: 11px;
    color: #8B8378;
    text-align: right;
  }
  h1 {
    margin: 0 0 2px;
    font-size: 24px;
    font-weight: 700;
  }
  .vehicle-line {
    font-size: 14px;
    color: #B45309;
    font-weight: 600;
    margin-bottom: 22px;
  }
  section { margin-bottom: 24px; break-inside: avoid; }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #B45309;
    margin-bottom: 10px;
    border-bottom: 1px solid #e4e0d8;
    padding-bottom: 6px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 150px 1fr;
    row-gap: 9px;
    column-gap: 16px;
    font-size: 13px;
  }
  .info-label {
    color: #8B8378;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .04em;
    padding-top: 1px;
  }
  .info-value { color: #1f2430; }
  ol.tasks {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    line-height: 1.7;
  }
  .description {
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    color: #1f2430;
  }
  .photos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .photos img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e4e0d8;
  }
  footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e4e0d8;
    font-size: 10.5px;
    color: #8B8378;
  }
  @page { margin: 16mm 14mm; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <header>
    <div>
      <div class="wordmark">FantomWorks</div>
      <div class="tagline">Submission Details</div>
    </div>
    <div class="printed">Printed ${esc(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</div>
  </header>

  <h1>${esc(name)}</h1>
  ${vehicle ? `<div class="vehicle-line">${esc(vehicle)}</div>` : ''}

  <section>
    <div class="section-title">Contact &amp; vehicle</div>
    <div class="info-grid">${infoRows}</div>
  </section>

  ${
    taskItems
      ? `<section>
    <div class="section-title">Tasks requested</div>
    <ol class="tasks">${taskItems}</ol>
  </section>`
      : ''
  }

  ${
    lead.project_description
      ? `<section>
    <div class="section-title">Description</div>
    <div class="description">${esc(lead.project_description)}</div>
  </section>`
      : ''
  }

  ${
    photoUrls.length
      ? `<section>
    <div class="section-title">Photos</div>
    <div class="photos">${photoUrls.map((src) => `<img src="${esc(src)}" />`).join('')}</div>
  </section>`
      : ''
  }

  <footer>Submitted ${esc(fmtDate(lead.received_date) ?? '—')}</footer>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 200);
    });
  </script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) {
    alert('Your browser blocked the print window — allow pop-ups for this site and try again.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
}
