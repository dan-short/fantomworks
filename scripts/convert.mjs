// Convert the MySQL dump into:
//   1) web/lib/real-data.json  — cleaned submissions + detail stages for the app (dev mode)
//   2) exports/converted/supabase_load.sql — Postgres INSERTs for when the project exists
//
// Cleaning: HTML-entity decode, latin1/utf8 mojibake repair, zip zero-padding,
// budget->numeric, sentinel dates->null, status derived from legacy flags.
//
// Run: node scripts/convert.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import { parseTable } from './parse-dump.mjs'

const DUMP = process.argv[2] ?? 'exports/fantomwo_call_log.sql'
const sql = readFileSync(DUMP, 'utf8')

// ---------- cleaning helpers ----------
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', deg: '°',
  eacute: 'é', trade: '™', copy: '©', reg: '®',
  frac12: '½', frac14: '¼', frac34: '¾',
}
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in NAMED ? NAMED[n] : m))
}
function fixMojibake(s) {
  // Repairs UTF-8 bytes that were decoded as latin1 (â€™, Ã©, Â ...).
  if (!/[ÃÂâ]/.test(s)) return s
  try {
    const repaired = Buffer.from(s, 'latin1').toString('utf8')
    // only accept if it didn't introduce replacement chars
    if (!repaired.includes('�')) return repaired
  } catch { /* fall through */ }
  return s
}
function cleanText(v) {
  if (v == null) return null
  let s = String(v)
  s = fixMojibake(s)
  s = decodeEntities(s)
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  s = s.replace(/[ \t]+/g, ' ').trim()
  return s === '' ? null : s
}
function cleanNotes(v) {
  if (v == null) return null
  let s = String(v)
  s = fixMojibake(s)
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?b>/gi, '').replace(/<\/?i>/gi, '')
  s = decodeEntities(s)
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  s = s.split('\n').map((l) => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return s === '' ? null : s
}
function padZip(v) {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10)
  if (!Number.isFinite(n) || n <= 0) return null
  const s = String(n)
  return s.length < 5 ? s.padStart(5, '0') : s
}
function parseBudget(v) {
  if (v == null) return null
  const digits = String(v).replace(/[^0-9.]/g, '')
  if (digits === '' || digits === '.') return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}
function cleanDate(v) {
  if (v == null) return null
  const s = String(v).trim()
  if (s === '' || s === '1900-01-01' || s === '0000-00-00') return null
  return s
}
function toInt(v) {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '').replace(/[^0-9-]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

// ---------- column index helper ----------
function indexer(columns) {
  const idx = Object.fromEntries(columns.map((c, i) => [c, i]))
  return (row, col) => row[idx[col]]
}

function deriveStatus(get, row) {
  if (toInt(get(row, 'Deleted'))) return 'deleted'
  if (toInt(get(row, 'Confirmed_Finished'))) return 'finished'
  if (toInt(get(row, 'Confirmed')) || toInt(get(row, 'Confirmed_Coming_In')) || toInt(get(row, 'Confirmed_Here')))
    return 'active'
  if (toInt(get(row, 'Office'))) return 'possible'
  if (toInt(get(row, 'Pending'))) return 'pending'
  if (toInt(get(row, 'Archived'))) return 'archived'
  return 'new'
}

// ---------- transform submissions (live + archive) ----------
function transformSubmissions(table, source, out, startId) {
  const { columns, rows } = parseTable(sql, table)
  const get = indexer(columns)
  let id = startId
  for (const row of rows) {
    id++
    out.push({
      id,
      legacy_id: toInt(get(row, 'ID')),
      source,
      first_name: cleanText(get(row, 'First_Name')),
      last_name: cleanText(get(row, 'Last_Name')),
      phone: cleanText(get(row, 'Phone')),
      alt_phone: cleanText(get(row, 'Alt_Phone')),
      call_schedule: cleanText(get(row, 'CallSchedule')),
      email: cleanText(get(row, 'Email')),
      street: cleanText(get(row, 'Street')),
      zipcode: padZip(get(row, 'ZipCode')),
      city: cleanText(get(row, 'City')),
      state_country: cleanText(get(row, 'State_Country')),
      time_zone: cleanText(get(row, 'Time_Zone')),
      distance_miles: get(row, 'Distance') == null ? null : toInt(get(row, 'Distance')),
      year: cleanText(get(row, 'Year')),
      make: cleanText(get(row, 'Make')),
      model: cleanText(get(row, 'Model')),
      budget: parseBudget(get(row, 'Budget')),
      project_start: cleanText(get(row, 'Project_Start')),
      project_description: cleanNotes(get(row, 'Project_Description')),
      parts_policies: cleanText(get(row, 'Parts_Policies')),
      guarantee_warranty_policies: cleanText(get(row, 'Guarantee_Warranty_Policies')),
      storage_fees_policies: cleanText(get(row, 'Storage_Fees_Policies')),
      paint_changes_everything: cleanText(get(row, 'Paint_Changes_Everything')),
      estimate_terms: cleanText(get(row, 'Estimate_Terms')),
      restoration_decision_matrix: cleanText(get(row, 'Restoration_Decision_Matrix')),
      status: deriveStatus(get, row),
      received_date: cleanDate(get(row, 'Received_Date')),
      original_date: cleanDate(get(row, 'Original_Date')),
      arrival_date: cleanDate(get(row, 'Arrival_Date')),
      added_by: cleanText(get(row, 'Added_By')),
      notes: cleanNotes(get(row, 'Notes')),
      call_attempt_one: cleanText(get(row, 'CallAttemptOne')),
      call_attempt_two: cleanText(get(row, 'CallAttemptTwo')),
      call_attempt_three: cleanText(get(row, 'CallAttemptThree')),
      email_attempt: cleanText(get(row, 'EmailAttempt')),
      images: [1, 2, 3, 4]
        .map((n) => cleanText(get(row, `ImageName_${n}`)))
        .filter(Boolean),
      legacy: {
        archived: toInt(get(row, 'Archived')),
        pending: toInt(get(row, 'Pending')),
        pending_status: toInt(get(row, 'Pending_Status')),
        confirmed: toInt(get(row, 'Confirmed')),
        confirmed_coming_in: toInt(get(row, 'Confirmed_Coming_In')),
        confirmed_here: toInt(get(row, 'Confirmed_Here')),
        confirmed_finished: toInt(get(row, 'Confirmed_Finished')),
        deleted: toInt(get(row, 'Deleted')),
        office: toInt(get(row, 'Office')),
      },
    })
  }
  return id
}

// ---------- transform Project_Desc -> stages ----------
const STAGES = [
  ['Dis', 'Disassembly'], ['Media', 'Media Blasting'], ['Fab', 'Fabrication'],
  ['Chassis', 'Chassis / Suspension'], ['Drive', 'Drivetrain'], ['Assem', 'Assembly'],
  ['Test', 'Testing'], ['Body', 'Body'], ['Paint', 'Paint'], ['Elec', 'Electrical'],
  ['Int', 'Interior'], ['Ext', 'Exterior / Trim'], ['Wring', 'Wiring'],
]
function transformDetails() {
  const { columns, rows } = parseTable(sql, 'Project_Desc')
  const get = indexer(columns)
  const byLegacyId = new Map()
  for (const row of rows) {
    const legacyId = toInt(get(row, 'ID'))
    const stages = []
    STAGES.forEach(([prefix, label], i) => {
      const desc = cleanText(get(row, `${prefix}Desc`))
      const parts = toInt(get(row, `${prefix}Parts`))
      const hours = toInt(get(row, `${prefix}Hour`))
      if (desc || parts || hours) {
        stages.push({ key: prefix.toLowerCase(), label, description: desc, parts_cost: parts, hours, sort_order: i })
      }
    })
    if (stages.length) byLegacyId.set(legacyId, stages)
  }
  return byLegacyId
}

// ---------- run ----------
const submissions = []
let nextId = 0
nextId = transformSubmissions('Project_Submissions', 'live', submissions, nextId)
transformSubmissions('Project_Submissions_Archive', 'archive', submissions, nextId)

// attach details by legacy_id, preferring 'live' on the 10 collisions
const detailsByLegacy = transformDetails()
const details = {}
let matched = 0
// build legacy_id -> app id, live wins
const legacyToApp = new Map()
for (const s of submissions) {
  if (s.source === 'live') legacyToApp.set(s.legacy_id, s.id)
}
for (const s of submissions) {
  if (!legacyToApp.has(s.legacy_id)) legacyToApp.set(s.legacy_id, s.id)
}
for (const [legacyId, stages] of detailsByLegacy) {
  const appId = legacyToApp.get(legacyId)
  if (appId != null) { details[appId] = stages; matched++ }
}

// ---------- write JSON for the app ----------
mkdirSync('web/lib', { recursive: true })
writeFileSync('web/lib/real-data.json', JSON.stringify({ submissions, details }))

// ---------- write CSVs for a fast COPY load ----------
mkdirSync('exports/converted', { recursive: true })

function csvCell(v) {
  if (v == null) return '' // COPY ... NULL '' treats empty as NULL
  const s = typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
function writeCsv(path, header, rows) {
  const out = [header.join(',')]
  for (const r of rows) out.push(r.map(csvCell).join(','))
  writeFileSync(path, out.join('\n'))
}

const SUB_COLS = [
  'legacy_id', 'source', 'first_name', 'last_name', 'phone', 'alt_phone', 'call_schedule', 'email',
  'street', 'zipcode', 'city', 'state_country', 'time_zone', 'distance_miles', 'year', 'make', 'model',
  'budget', 'project_start', 'project_description', 'parts_policies', 'guarantee_warranty_policies',
  'storage_fees_policies', 'paint_changes_everything', 'estimate_terms', 'restoration_decision_matrix',
  'status', 'received_date', 'original_date', 'arrival_date', 'added_by', 'notes',
  'call_attempt_one', 'call_attempt_two', 'call_attempt_three', 'email_attempt',
  'image_name_1', 'image_name_2', 'image_name_3', 'image_name_4',
  'legacy_archived', 'legacy_pending', 'legacy_pending_status', 'legacy_confirmed',
  'legacy_confirmed_coming_in', 'legacy_confirmed_here', 'legacy_confirmed_finished',
  'legacy_deleted', 'legacy_office',
]
writeCsv(
  'exports/converted/submissions.csv',
  SUB_COLS,
  submissions.map((s) => [
    s.legacy_id, s.source, s.first_name, s.last_name, s.phone, s.alt_phone, s.call_schedule, s.email,
    s.street, s.zipcode, s.city, s.state_country, s.time_zone, s.distance_miles, s.year, s.make, s.model,
    s.budget, s.project_start, s.project_description, s.parts_policies, s.guarantee_warranty_policies,
    s.storage_fees_policies, s.paint_changes_everything, s.estimate_terms, s.restoration_decision_matrix,
    s.status, s.received_date, s.original_date, s.arrival_date, s.added_by, s.notes,
    s.call_attempt_one, s.call_attempt_two, s.call_attempt_three, s.email_attempt,
    s.images[0] ?? null, s.images[1] ?? null, s.images[2] ?? null, s.images[3] ?? null,
    s.legacy.archived ? true : false, s.legacy.pending, s.legacy.pending_status, s.legacy.confirmed,
    s.legacy.confirmed_coming_in, s.legacy.confirmed_here, s.legacy.confirmed_finished,
    s.legacy.deleted ? true : false, s.legacy.office,
  ]),
)

// detail stages carry legacy_id + source so the loader joins to the generated submission id
const stageRows = []
for (const s of submissions) {
  const stages = details[s.id]
  if (!stages) continue
  for (const st of stages) {
    stageRows.push([s.legacy_id, s.source, st.key, st.label, st.description, st.parts_cost, st.hours, st.sort_order])
  }
}
writeCsv(
  'exports/converted/detail_stages.csv',
  ['legacy_id', 'source', 'stage_key', 'stage_label', 'description', 'parts_cost', 'hours', 'sort_order'],
  stageRows,
)

const zip = parseTable(sql, 'ZipCodes')
const zipGet = indexer(zip.columns)
const zipRows = []
const seenZip = new Set()
for (const row of zip.rows) {
  const z = padZip(zipGet(row, 'Zip_Code'))
  if (!z || seenZip.has(z)) continue // zip_code is PK; dedupe after zero-padding
  seenZip.add(z)
  zipRows.push([z, zipGet(row, 'Latitude'), zipGet(row, 'Longitude')])
}
writeCsv('exports/converted/zipcodes.csv', ['zip_code', 'latitude', 'longitude'], zipRows)

// ---------- report ----------
const byStatus = {}
for (const s of submissions) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1
console.log(`submissions: ${submissions.length} (details matched: ${matched}/${detailsByLegacy.size})`)
console.log('by status:', byStatus)
console.log(`detail stage rows: ${stageRows.length}`)
console.log(`zipcodes: ${zipRows.length} unique (of ${zip.rows.length})`)
console.log('wrote web/lib/real-data.json + exports/converted/{submissions,detail_stages,zipcodes}.csv')
