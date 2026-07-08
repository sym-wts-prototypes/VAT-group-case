import { countryCodeFor } from './org-details-data'

// Shared helpers for turning a VAT Scheduler's generated periods into actual `Case`/`VatGroupCase`
// records (see case-management-data.ts) — used by both SingleCaseSchedulerModal and
// VatSchedulerModal's "Create scheduled cases" submit.

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Short form used in individual case names (e.g. "VAT - Return - Jan 2026"), distinct from
// scheduler-shared.tsx's `periodLabel` (full month name, used for the schedule's own case names
// and the group's reportingPeriod).
export function shortPeriodLabel(frequency: 'Monthly' | 'Quarterly', period: number, year: number): string {
  return frequency === 'Monthly' ? `${MONTH_ABBR[period - 1]} ${year}` : `Q${period} ${year}`
}

// Local calendar date components — avoids the UTC shift `toISOString()` would introduce for
// dates near midnight, keeping the deadline the user actually picked.
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

let idCounter = 0

// Prototype-only unique id — no backend to allocate real case numbers from. Mirrors the shape
// of the dummy dataset's ids (`PREFIX-CC-YEAR-...`) closely enough to read naturally in the list.
export function generateCaseId(prefix: string, jurisdiction: string): string {
  idCounter += 1
  const cc = countryCodeFor(jurisdiction) || 'XX'
  return `${prefix}-${cc}-${new Date().getFullYear()}-GEN${Date.now().toString(36).toUpperCase()}${idCounter}`
}
