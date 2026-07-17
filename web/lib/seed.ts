import type { Submission, DetailStage, DetailsMap } from './types'
import { daysAgo } from './age'

// Minimal fallback used only when web/lib/real-data.json is absent
// (i.e. before scripts/convert.mjs has run). The real dump drives dev mode.

function base(over: Partial<Submission>): Submission {
  return {
    id: 0, legacy_id: 0, source: 'live',
    first_name: null, last_name: null, phone: null, alt_phone: null,
    call_schedule: null, email: null, street: null, zipcode: null,
    city: null, state_country: null, time_zone: null, distance_miles: null,
    year: null, make: null, model: null, budget: null, project_start: null,
    project_description: null, restoration_decision_matrix: null,
    storage_type: null, storage_years: null,
    status: 'new', received_date: daysAgo(5), original_date: null, bumped_at: null,
    added_by: 'Online Form', notes: null,
    call_attempt_one: null, call_attempt_two: null, call_attempt_three: null,
    email_attempt: null, images: [],
    ...over,
  }
}

export const seedSubmissions: Submission[] = [
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

export const seedDetails: DetailsMap = {
  1: [
    { key: 'dis', label: 'Disassembly', description: 'Full teardown to bare frame.', parts_cost: 0, hours: 20, sort_order: 0 },
    { key: 'paint', label: 'Paint', description: 'Base/clear in Fathom Green.', parts_cost: 2500, hours: 60, sort_order: 8 },
  ] as DetailStage[],
}
