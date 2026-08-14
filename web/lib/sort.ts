import type { SubmissionStatus } from './types'

export type SortKey = 'relevance' | 'received' | 'name' | 'vehicle' | 'distance'
export type SortDir = 'asc' | 'desc'

// 'received' defaults to oldest-first on the Call Log (new leads should get
// worked in the order they came in); every other view/field keeps its
// existing default direction.
export function defaultSortDir(sort: SortKey, view: SubmissionStatus): SortDir {
  switch (sort) {
    case 'received':
      return view === 'new' ? 'asc' : 'desc'
    case 'name':
      return 'asc'
    case 'vehicle':
      return 'asc'
    case 'distance':
      return 'desc'
    default:
      return 'desc'
  }
}
