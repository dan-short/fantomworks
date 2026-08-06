import type { Submission, DetailStage, DetailsMap } from './types'
import { daysAgo } from './age'

// Fallback dataset used only when web/lib/real-data.json is absent (i.e. before
// scripts/convert.mjs has run). The real dump drives dev mode when present.
//
// Two hand-authored "hero" rows keep the cards looking realistic; the rest are
// generated deterministically so dev mode has enough leads to exercise the
// pipeline tabs AND multi-page pagination (the Call Log view alone spans >1
// page of PAGE_SIZE=50). Generation is seedable/pure — no Math.random — so the
// list is stable across reloads.

function base(over: Partial<Submission>): Submission {
  return {
    id: 0, legacy_id: 0, source: 'live',
    first_name: null, last_name: null, phone: null, alt_phone: null,
    call_schedule: null, email: null, street: null, zipcode: null,
    city: null, state_country: null, time_zone: null, distance_miles: null,
    year: null, make: null, model: null, budget: null, project_start: null,
    project_description: null, restoration_decision_matrix: null,
    storage_type: null, storage_years: null,
    status: 'new', status_changed_at: null,
    received_date: daysAgo(5), original_date: null, bumped_at: null,
    added_by: 'Online Form', notes: null,
    call_attempt_one: null, call_attempt_two: null, call_attempt_three: null,
    email_attempt: null, images: [],
    ...over,
  }
}

const heroes: Submission[] = [
  base({
    id: 1, legacy_id: 1042, first_name: 'Marcus', last_name: 'Reilly',
    phone: '(757) 555-0148', email: 'mreilly@example.com', city: 'Williamsburg',
    state_country: 'VA', zipcode: '23188', distance_miles: 41, time_zone: 'EST',
    year: '1969', make: 'Chevrolet', model: 'Camaro', budget: 85000,
    project_description: 'Full frame-off restoration. Numbers-matching 350.',
    storage_type: 'Indoor — unheated garage / barn', storage_years: 12,
    status: 'new', received_date: daysAgo(9),
  }),
  base({
    id: 2, legacy_id: 1029, first_name: 'Priya', last_name: 'Ranganathan',
    phone: '(571) 555-0155', email: 'priya.r@example.com', city: 'Alexandria',
    state_country: 'VA', zipcode: '22301', distance_miles: 195, time_zone: 'EST',
    year: '1963', make: 'Jaguar', model: 'E-Type Series 1', budget: 180000,
    project_description: 'Concours restoration, matching numbers.',
    status: 'active', received_date: daysAgo(140),
  }),
]

// ── Deterministic filler ────────────────────────────────────────────────────
const FIRST = ['James', 'Maria', 'Robert', 'Linda', 'David', 'Susan', 'Carl', 'Nancy', 'Frank', 'Karen', 'Gary', 'Betty', 'Larry', 'Donna', 'Roy', 'Sandra', 'Wayne', 'Ruth', 'Dale', 'Gloria']
const LAST = ['Baker', 'Whitfield', 'Cordova', 'Nguyen', 'Okafor', 'Petrucci', 'Salazar', 'Kowalski', 'Ferraro', 'Abernathy', 'Delgado', 'Holloway', 'Ivanov', 'McBride', 'Sørensen', 'Tanaka', 'Underwood', 'Vasquez', 'Weatherby', 'Zielinski']
const RIGS: [string, string, string][] = [
  ['1957', 'Chevrolet', 'Bel Air'], ['1965', 'Ford', 'Mustang'], ['1970', 'Dodge', 'Challenger'],
  ['1932', 'Ford', 'Roadster'], ['1967', 'Chevrolet', 'Corvette'], ['1955', 'Ford', 'Thunderbird'],
  ['1969', 'Pontiac', 'GTO'], ['1971', 'Plymouth', "'Cuda"], ['1948', 'Chevrolet', 'Fleetline'],
  ['1966', 'Ford', 'Bronco'], ['1959', 'Cadillac', 'Series 62'], ['1968', 'Chevrolet', 'C10'],
  ['1973', 'Volkswagen', 'Beetle'], ['1964', 'Buick', 'Riviera'], ['1972', 'Datsun', '240Z'],
]
const PLACES: [string, string, string, number][] = [
  ['Norfolk', 'VA', '23517', 3], ['Virginia Beach', 'VA', '23451', 18], ['Richmond', 'VA', '23220', 92],
  ['Raleigh', 'NC', '27601', 178], ['Baltimore', 'MD', '21201', 235], ['Charlotte', 'NC', '28202', 320],
  ['Atlanta', 'GA', '30303', 545], ['Nashville', 'TN', '37201', 620], ['Columbus', 'OH', '43215', 470],
  ['Philadelphia', 'PA', '19103', 285],
]
const AGES = [4, 11, 17, 23, 28, 34, 41, 52, 63, 71, 85, 96, 110, 128, 150, 190, 240, 305]

// Status mix: enough 'new' to force pagination, plus a spread across the
// pipeline so every tab has a count.
const MIX: { status: Submission['status']; n: number }[] = [
  { status: 'new', n: 58 },
  { status: 'pending', n: 9 },
  { status: 'active', n: 7 },
  { status: 'possible', n: 6 },
  { status: 'finished', n: 5 },
  { status: 'archived', n: 8 },
]

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

const generated: Submission[] = []
let seq = 0
for (const { status, n } of MIX) {
  for (let k = 0; k < n; k++) {
    const i = seq++
    const [year, make, model] = RIGS[i % RIGS.length]
    const [city, st, zip, dist] = PLACES[i % PLACES.length]
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 7) % LAST.length]
    generated.push(
      base({
        id: 100 + i,
        legacy_id: 2000 + i,
        source: 'live',
        first_name: first,
        last_name: last,
        phone: `(757) 555-${pad(1000 + i, 4)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
        city,
        state_country: st,
        zipcode: zip,
        distance_miles: dist,
        time_zone: 'EST',
        year,
        make,
        model,
        budget: 20000 + ((i * 6500) % 160000),
        project_description: `${year} ${make} ${model} — owner inquiry.`,
        status,
        status_changed_at: status === 'archived' ? daysAgo(Math.floor(AGES[i % AGES.length] / 2)) : null,
        received_date: daysAgo(AGES[i % AGES.length]),
        added_by: i % 4 === 0 ? 'Office' : 'Online Form',
      }),
    )
  }
}

export const seedSubmissions: Submission[] = [...heroes, ...generated]

export const seedDetails: DetailsMap = {
  1: [
    { key: 'dis', label: 'Disassembly', description: 'Full teardown to bare frame.', parts_cost: 0, hours: 20, sort_order: 0 },
    { key: 'paint', label: 'Paint', description: 'Base/clear in Fathom Green.', parts_cost: 2500, hours: 60, sort_order: 8 },
  ] as DetailStage[],
}
