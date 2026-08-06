export type SubmissionStatus =
  | 'new'
  | 'pending'
  | 'active'
  | 'finished'
  | 'possible'
  | 'archived'
  | 'deleted'

export interface Submission {
  id: number
  legacy_id: number
  source: 'live' | 'archive'

  first_name: string | null
  last_name: string | null
  phone: string | null
  alt_phone: string | null
  call_schedule: string | null
  email: string | null

  street: string | null
  zipcode: string | null
  city: string | null
  state_country: string | null
  time_zone: string | null
  distance_miles: number | null

  year: string | null
  make: string | null
  model: string | null
  budget: number | null
  project_start: string | null
  project_description: string | null
  restoration_decision_matrix: string | null

  storage_type: string | null
  storage_years: number | null

  status: SubmissionStatus
  status_changed_at: string | null
  received_date: string | null
  original_date: string | null
  bumped_at: string | null
  added_by: string | null
  notes: string | null

  call_attempt_one: string | null
  call_attempt_two: string | null
  call_attempt_three: string | null
  email_attempt: string | null

  images: string[]
  image_urls?: string[]
}

export interface DetailStage {
  key: string
  label: string
  description: string | null
  parts_cost: number | null
  hours: number | null
  sort_order: number
}

export type DetailsMap = Record<number, DetailStage[]>

export const STATUS_VIEWS: {
  key: SubmissionStatus
  label: string
  legacyPage: string
}[] = [
  { key: 'new', label: 'Call Log', legacyPage: 'index.php' },
  { key: 'pending', label: 'Pending', legacyPage: 'pending.php' },
  { key: 'active', label: 'Active', legacyPage: 'confirmed.php' },
  { key: 'finished', label: 'Finished', legacyPage: 'finished.php' },
  { key: 'possible', label: 'Possibles', legacyPage: 'office.php' },
  { key: 'archived', label: 'Archives', legacyPage: 'archives.php' },
]

export function isStatus(v: string): v is SubmissionStatus {
  return ['new', 'pending', 'active', 'finished', 'possible', 'archived', 'deleted'].includes(v)
}
