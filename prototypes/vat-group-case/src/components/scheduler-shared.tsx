import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { CheckCircle2, Minus, Plus, TriangleAlert } from 'lucide-react'
import {
  Button,
  Checkbox,
  cn,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
} from '@wts/ui'

// Statutory Deadline scheduling — shared between SingleCaseSchedulerModal and the Group Case
// VatSchedulerModal (see Part 3/4 of the "Refine Case Creation Drawer & Align Group Scheduler
// with Single Scheduler" ticket: same Frequency/Period/deadline-mode/+2-months/custom-override
// experience in both, without touching either flow's own group- or single-specific fields).
// The `useDeadlineSchedule` hook owns all of the state; the exported field components render
// it. Each modal still owns its own header, side summary panel, and footer.

export const CURRENT_YEAR = new Date().getFullYear()
export const CURRENT_MONTH = new Date().getMonth() + 1
// Quarter-selection validation ticket — only the current year and onwards are selectable.
export const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR + i)
export const DAY_OPTIONS_31 = Array.from({ length: 31 }, (_, i) => i + 1)
export const WORKING_DAY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)
export const QUARTER_OPTIONS = [1, 2, 3, 4] as const
export const MONTH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export type Frequency = 'Monthly' | 'Quarterly'
export type DeadlineMode = 'workingDays' | 'dayOfMonth'

export interface Period {
  key: string
  period: number
  year: number
  /** Flexible month-based quarters ticket (Single Case VAT Scheduler only) — the concrete
   *  calendar month (1-12) this specific quarter block starts on, when it was derived from an
   *  arbitrary month-range selection rather than a fixed Jan-start calendar quarter. Absent for
   *  Monthly periods and for the Group Case scheduler's plain Quarter Q1-4 periods. */
  startMonth?: number
}

export interface GeneratedCase extends Period {
  name: string
  defaultDeadline: Date
  customDeadline: Date | undefined
}

// n-th weekday (Mon–Fri) of a month, 1-indexed — e.g. n=2 for the month's 2nd working day.
export function nthWeekdayOfMonth(year: number, monthIndex: number, n: number): Date {
  let count = 0
  let day = 1
  while (true) {
    const date = new Date(year, monthIndex, day)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) {
      count++
      if (count === n) return date
    }
    day++
  }
}

export function dateForDayOfMonth(year: number, monthIndex: number, day: number): Date {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  return new Date(year, monthIndex, Math.min(day, daysInMonth))
}

// Case Management table's "Next deadline" column ticket — a freshly scheduled/generated case
// previously always got `nextDeadline: null` (permanently "—" in the table, with no traffic-
// light pill). This gives it a real, nearer-term milestone ahead of its own statutory deadline
// instead. This prototype doesn't model a distinct "data provision" calendar date, so a flat
// lead time stands in for it — good enough for the table to show real dates/pills once cases
// are scheduled, without inventing business logic nobody specified.
export const NEXT_DEADLINE_LEAD_DAYS = 10

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function ordinalSuffix(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

// "Thursday, April 2nd 2026" — no date-fns dependency here (this prototype doesn't have a
// direct dependency on it, only @wts/ui does); native Intl covers this format fine.
export function formatLongDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = date.getDate()
  return `${weekday}, ${month} ${day}${ordinalSuffix(day)} ${date.getFullYear()}`
}

export function periodLabel(frequency: Frequency, period: number, year: number): string {
  return frequency === 'Monthly' ? `${MONTH_NAMES[period - 1]} ${year}` : `Q${period} ${year}`
}

// Flexible month-based quarters ticket (Single Case VAT Scheduler only) — a quarter block's own
// label, e.g. "Feb - Apr 2026", used instead of the fixed "Q1 2026" style once the block was
// derived from an arbitrary start month rather than a standard Jan-start calendar quarter.
export function monthRangeLabel(startMonth: number, year: number): string {
  const endAbs = year * 12 + (startMonth - 1) + 2
  const endYear = Math.floor(endAbs / 12)
  const endMonthIndex = ((endAbs % 12) + 12) % 12
  const startLabel = `${MONTH_NAMES_SHORT[startMonth - 1]}${endYear !== year ? ` ${year}` : ''}`
  return `${startLabel} - ${MONTH_NAMES_SHORT[endMonthIndex]} ${endYear}`
}

// Total number of calendar months from start to end, inclusive — the span calculation behind
// countMonthBasedQuarters below.
function monthSpan(startMonth: number, startYear: number, endMonth: number, endYear: number): number {
  return (endYear * 12 + (endMonth - 1)) - (startYear * 12 + (startMonth - 1)) + 1
}

// Schedule-period-banner ticket — a period that ends before the current month is entirely
// historical (e.g. picking Jan-Mar while "now" is August 2026) — mathematically a valid
// quarter, but not one that makes sense to schedule. Treated as invalid alongside "doesn't form
// a quarter at all", both by the banner and by `periods`/`canSubmitSchedule` (so a past period
// can't be submitted either).
function isPeriodEntirelyPast(endMonth: number, endYear: number): boolean {
  return endYear * 12 + (endMonth - 1) < CURRENT_YEAR * 12 + (CURRENT_MONTH - 1)
}

// Flexible month-based quarters ticket — groups an arbitrary selected month range into 3-month
// quarter blocks. Only full 3-month blocks become a case; a trailing partial quarter doesn't get
// one of its own, so a 5-month Jan-May span still yields exactly one quarter case (Jan-Mar), same
// as a plain 3-month Feb-Apr span. A span under 3 months (e.g. Jan-Feb) yields 0 — not enough for
// even a single quarter — which callers treat as invalid rather than rounding up to one.
export function countMonthBasedQuarters(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
): number {
  const span = monthSpan(startMonth, startYear, endMonth, endYear)
  if (span <= 0) return 0
  return Math.floor(span / 3)
}

export function generateMonthBasedQuarterPeriods(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
): Period[] {
  const count = countMonthBasedQuarters(startMonth, startYear, endMonth, endYear)
  const startAbs = startYear * 12 + (startMonth - 1)
  return Array.from({ length: count }, (_, i) => {
    const abs = startAbs + i * 3
    const year = Math.floor(abs / 12)
    const blockStartMonth = (abs % 12) + 1
    return { key: `${year}-${blockStartMonth}`, period: 1, year, startMonth: blockStartMonth }
  })
}

// The month `monthsAhead` after a period's end month — e.g. Q1 (Jan–Mar) → April for 1,
// May for 2 (the "Deadline extension (+2 months)" checkbox).
//
// `quarterStartMonth` (1-12, default January) shifts which calendar month a quarter's own
// 3-month span starts from. The Group Case scheduler always calls this with the default
// (standard Jan-start calendar quarters); the Single Case VAT Scheduler's month-based quarters
// (see generateMonthBasedQuarterPeriods above) pass each block's own concrete `startMonth` here
// instead, together with `period` forced to 1 (each block is "quarter 1" of its own span).
export function followingMonth(
  frequency: Frequency,
  period: number,
  year: number,
  monthsAhead: 1 | 2,
  quarterStartMonth = 1,
): { monthIndex: number; year: number } {
  const endMonthOffset =
    frequency === 'Monthly' ? period - 1 : (quarterStartMonth - 1) + period * 3 - 1
  const total = endMonthOffset + monthsAhead
  return { monthIndex: ((total % 12) + 12) % 12, year: year + Math.floor(total / 12) }
}

export function generatePeriods(
  frequency: Frequency,
  startPeriod: number,
  startYear: number,
  endPeriod: number,
  endYear: number,
): Period[] {
  const periods: Period[] = []
  const maxPeriod = frequency === 'Monthly' ? 12 : 4
  let period = startPeriod
  let year = startYear
  // Safety cap — malformed/reversed ranges shouldn't spin forever.
  while ((year < endYear || (year === endYear && period <= endPeriod)) && periods.length < 60) {
    periods.push({ key: `${year}-${period}`, period, year })
    period++
    if (period > maxPeriod) {
      period = 1
      year++
    }
  }
  return periods
}

export interface DeadlineSchedule {
  /** No-prepopulated-fields ticket — undefined until the user actually picks one; every Select
   *  bound to a field below only renders sensibly (or, for the period fields, only enables at
   *  all) once this is set. */
  frequency: Frequency | undefined
  isMonthly: boolean
  handleFrequencyChange: (value: string) => void
  startPeriod: number | undefined
  setStartPeriod: (v: number) => void
  startYear: number | undefined
  setStartYear: (v: number) => void
  endPeriod: number | undefined
  setEndPeriod: (v: number) => void
  endYear: number | undefined
  setEndYear: (v: number) => void
  endYearOptions: number[]
  endMonthKeys: readonly string[]
  endQuarterOptions: readonly number[]
  periodCloseDay: number | undefined
  setPeriodCloseDay: (v: number) => void
  dataProvisionDeadline: number
  setDataProvisionDeadline: Dispatch<SetStateAction<number>>
  deadlineMode: DeadlineMode
  setDeadlineMode: (v: DeadlineMode) => void
  workingDaysValue: number | undefined
  setWorkingDaysValue: (v: number) => void
  dayOfMonthValue: number | undefined
  setDayOfMonthValue: (v: number) => void
  deadlineExtension: boolean
  setDeadlineExtension: (v: boolean) => void
  useCustomDeadlines: boolean
  setUseCustomDeadlines: (v: boolean) => void
  cases: GeneratedCase[]
  setCustomDeadline: (key: string, date: Date | undefined) => void
  /** How many cases Frequency + Scheduled period alone would produce — available as soon as
   *  those are filled in, before Period close date/Statutory deadline are (see
   *  `SchedulePeriodBanner`, which shows green/red once `periodSelectionComplete`). */
  periodCaseCount: number
  /** Frequency + every Scheduled period field has a value — regardless of whether that
   *  combination is actually valid (`periodCaseCount > 0` covers that). Gates whether
   *  `SchedulePeriodBanner` renders at all. */
  periodSelectionComplete: boolean
  /** Statutory deadline's own value (working days or day of month, per `deadlineMode`) has been
   *  chosen — exposed so callers can tell "Frequency + period done" (`periodCaseCount > 0`)
   *  apart from "the rest of the form is also done" without re-deriving this themselves. */
  deadlineValueChosen: boolean
  /** Period range + close date + deadline value all chosen — the shared slice of validity. */
  canSubmitSchedule: boolean
  /** Call from the modal's own open-reset effect: `useEffect(() => { if (open) s.reset() }, [open])`. */
  reset: () => void
}

export function useDeadlineSchedule(
  caseNameFor: (p: Period, frequency: Frequency) => string,
  options?: {
    /** Flexible month-based quarters ticket — Single Case VAT Scheduler only (see
     *  FrequencyPeriodFields' own `monthBasedQuarters`). When true and Quarterly is selected,
     *  `startPeriod`/`endPeriod` are calendar months (1-12) rather than Quarter numbers (1-4),
     *  and periods are derived by grouping that month range into 3-month blocks instead of the
     *  Group Case scheduler's fixed Jan-start calendar quarters. */
    monthBasedQuarters?: boolean
  },
): DeadlineSchedule {
  const monthBasedQuarters = options?.monthBasedQuarters ?? false
  // No-prepopulated-fields ticket — every field below starts genuinely unset (not a silently-
  // assumed default like "Quarterly" or "this year") so nothing can be submitted without the
  // user actively choosing it; each field's own Select shows a placeholder until then. The one
  // exception is Start month/year (month-based quarters, VAT Scheduler only): they default to
  // today rather than blank. "Until" always starts unset regardless — every month stays freely
  // selectable (see FrequencyPeriodFields), and an impossible combination is caught by
  // `SchedulePeriodBanner` rather than by narrowing what can be picked. The Group Case
  // scheduler never sets `monthBasedQuarters`, so its own Month-vs-Quarter-number period fields
  // are unaffected and stay unset until chosen.
  const [frequency, setFrequency] = useState<Frequency | undefined>(undefined)
  const [startPeriod, setStartPeriodRaw] = useState<number | undefined>(monthBasedQuarters ? CURRENT_MONTH : undefined)
  const [startYear, setStartYearRaw] = useState<number | undefined>(monthBasedQuarters ? CURRENT_YEAR : undefined)
  const [endPeriod, setEndPeriod] = useState<number | undefined>(undefined)
  const [endYear, setEndYear] = useState<number | undefined>(undefined)
  const [periodCloseDay, setPeriodCloseDay] = useState<number | undefined>(undefined)
  const [dataProvisionDeadline, setDataProvisionDeadline] = useState(3)
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('workingDays')
  const [workingDaysValue, setWorkingDaysValue] = useState<number | undefined>(undefined)
  const [dayOfMonthValue, setDayOfMonthValue] = useState<number | undefined>(undefined)
  const [deadlineExtension, setDeadlineExtension] = useState(false)
  const [useCustomDeadlines, setUseCustomDeadlines] = useState(false)
  const [customDeadlines, setCustomDeadlines] = useState<Record<string, Date | undefined>>({})

  const isMonthly = frequency === 'Monthly'
  const useMonthBasedQuarters = monthBasedQuarters && !isMonthly
  const setStartPeriod = setStartPeriodRaw
  const setStartYear = setStartYearRaw

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as Frequency)
    // Monthly and month-based-quarters both use month-shaped (1-12) period values, so an
    // already-filled start/end carries over cleanly between them — only the Group Case
    // scheduler's Quarter-number mode (1-4) is shape-incompatible with Monthly and needs
    // clearing when switching.
    if (!monthBasedQuarters) {
      setStartPeriodRaw(undefined)
      setEndPeriod(undefined)
    }
  }

  const endYearOptions = startYear === undefined ? YEAR_OPTIONS : YEAR_OPTIONS.filter((y) => y >= startYear)
  const endMonthKeys =
    startYear !== undefined && startYear === endYear && startPeriod
      ? MONTH_KEYS.filter((k) => Number(k) >= startPeriod)
      : MONTH_KEYS
  const endQuarterOptions =
    startYear !== undefined && startYear === endYear && startPeriod
      ? QUARTER_OPTIONS.filter((q) => q >= startPeriod)
      : QUARTER_OPTIONS

  const deadlineValueChosen = deadlineMode === 'workingDays' ? !!workingDaysValue : !!dayOfMonthValue

  // Schedule-summary-placement ticket — how many cases the Frequency + Scheduled period alone
  // would produce, independent of whether Period close date/Statutory deadline are filled in
  // yet. `periods` below can't be reused for this since it deliberately waits on
  // `deadlineValueChosen` too (it needs a real deadline mode to compute each case's actual
  // default deadline) — this is a lighter, earlier-available count for the summary banner only.
  const periodCaseCount = useMemo(() => {
    if (!frequency || !startPeriod || startYear === undefined || !endPeriod || endYear === undefined) return 0
    if (isPeriodEntirelyPast(endPeriod, endYear)) return 0
    return useMonthBasedQuarters
      ? countMonthBasedQuarters(startPeriod, startYear, endPeriod, endYear)
      : generatePeriods(frequency, startPeriod, startYear, endPeriod, endYear).length
  }, [frequency, startPeriod, startYear, endPeriod, endYear, useMonthBasedQuarters])
  // Green/red SchedulePeriodBanner ticket — Frequency + every Scheduled period field has a
  // value (regardless of whether that combination is actually valid — `periodCaseCount` above
  // covers that). The banner renders nothing at all until this is true.
  const periodSelectionComplete =
    !!frequency && !!startPeriod && startYear !== undefined && !!endPeriod && endYear !== undefined

  const periods = useMemo(() => {
    if (!frequency || !startPeriod || startYear === undefined || !endPeriod || endYear === undefined || !deadlineValueChosen)
      return []
    if (isPeriodEntirelyPast(endPeriod, endYear)) return []
    if (useMonthBasedQuarters) {
      return generateMonthBasedQuarterPeriods(startPeriod, startYear, endPeriod, endYear)
    }
    return generatePeriods(frequency, startPeriod, startYear, endPeriod, endYear)
  }, [frequency, startPeriod, startYear, endPeriod, endYear, deadlineValueChosen, useMonthBasedQuarters])

  const cases = useMemo(
    () =>
      periods.map((p) => {
        const { monthIndex, year } = followingMonth(
          frequency!,
          p.startMonth !== undefined ? 1 : p.period,
          p.year,
          deadlineExtension ? 2 : 1,
          p.startMonth ?? 1,
        )
        const defaultDeadline =
          deadlineMode === 'workingDays'
            ? nthWeekdayOfMonth(year, monthIndex, workingDaysValue ?? 1)
            : dateForDayOfMonth(year, monthIndex, dayOfMonthValue ?? 1)
        return { ...p, name: caseNameFor(p, frequency!), defaultDeadline, customDeadline: customDeadlines[p.key] }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periods, frequency, deadlineMode, workingDaysValue, dayOfMonthValue, deadlineExtension, customDeadlines],
  )

  const setCustomDeadline = (key: string, date: Date | undefined) =>
    setCustomDeadlines((prev) => ({ ...prev, [key]: date }))

  // `cases.length > 0` guards against a selected range that's technically "complete" (both
  // periods, close day, and deadline value chosen) but produces no actual quarter case — e.g. a
  // month-based-quarters span under 3 months; without this, submitting would silently create
  // zero cases instead of visibly doing nothing.
  const canSubmitSchedule =
    !!frequency && !!startPeriod && !!endPeriod && !!periodCloseDay && deadlineValueChosen && cases.length > 0

  const reset = () => {
    setFrequency(undefined)
    setStartPeriodRaw(monthBasedQuarters ? CURRENT_MONTH : undefined)
    setStartYearRaw(monthBasedQuarters ? CURRENT_YEAR : undefined)
    setEndPeriod(undefined)
    setEndYear(undefined)
    setPeriodCloseDay(undefined)
    setDataProvisionDeadline(3)
    setDeadlineMode('workingDays')
    setWorkingDaysValue(undefined)
    setDayOfMonthValue(undefined)
    setDeadlineExtension(false)
    setUseCustomDeadlines(false)
    setCustomDeadlines({})
  }

  return {
    frequency,
    isMonthly,
    handleFrequencyChange,
    startPeriod,
    setStartPeriod,
    startYear,
    setStartYear,
    endPeriod,
    setEndPeriod,
    endYear,
    setEndYear,
    endYearOptions,
    endMonthKeys,
    endQuarterOptions,
    periodCloseDay,
    setPeriodCloseDay,
    dataProvisionDeadline,
    setDataProvisionDeadline,
    deadlineMode,
    setDeadlineMode,
    workingDaysValue,
    setWorkingDaysValue,
    dayOfMonthValue,
    setDayOfMonthValue,
    deadlineExtension,
    setDeadlineExtension,
    useCustomDeadlines,
    setUseCustomDeadlines,
    cases,
    setCustomDeadline,
    periodCaseCount,
    periodSelectionComplete,
    deadlineValueChosen,
    canSubmitSchedule,
    reset,
  }
}

export interface FrequencyPeriodFieldsProps {
  s: DeadlineSchedule
  /** Flexible month-based quarters ticket — Single Case VAT Scheduler only. When true and
   * Quarterly is selected, the period Start/End selects show short month names (Jan, Feb, …)
   * instead of Quarter numbers, and the chosen month range is grouped into 3-month quarter
   * cases (see countMonthBasedQuarters) instead of the Group Case scheduler's fixed Jan-start
   * calendar quarters. The Group Case scheduler never passes this, so it's unaffected. */
  monthBasedQuarters?: boolean
}

export function FrequencyPeriodFields({ s, monthBasedQuarters = false }: FrequencyPeriodFieldsProps) {
  const useMonthPickerForQuarters = monthBasedQuarters && !s.isMonthly
  // No-prepopulated-fields ticket — the whole "Scheduled period" row stays disabled (all four
  // Selects) until Frequency is actually chosen; there's no sensible Month-vs-Quarter option
  // set to show for an unset frequency, so asking for it first keeps the flow linear instead of
  // letting the user fill in a period that then silently gets reinterpreted once they do pick
  // one.
  const periodFieldsDisabled = !s.frequency

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="frequency" className="font-medium text-foreground text-sm">
          Frequency
        </label>
        <Select value={s.frequency ?? ''} onValueChange={s.handleFrequencyChange}>
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 flex flex-col gap-2">
        <p className="font-medium text-foreground text-sm">Scheduled period</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-2">
            {s.isMonthly ? (
              <Select
                value={s.startPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setStartPeriod(Number(v))}
                disabled={periodFieldsDisabled}
              >
                <SelectTrigger aria-label="Month" className="w-24">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {MONTH_KEYS.map((k, i) => (
                    <SelectItem key={k} value={k}>
                      {MONTH_NAMES_SHORT[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : useMonthPickerForQuarters ? (
              <Select
                value={s.startPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setStartPeriod(Number(v))}
                disabled={periodFieldsDisabled}
              >
                <SelectTrigger aria-label="Month" className="w-24">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {MONTH_KEYS.map((k, i) => (
                    <SelectItem key={k} value={k}>
                      {MONTH_NAMES_SHORT[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={s.startPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setStartPeriod(Number(v))}
                disabled={periodFieldsDisabled}
              >
                <SelectTrigger aria-label="Quarter">
                  <SelectValue placeholder="Quarter" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTER_OPTIONS.map((q) => (
                    <SelectItem key={q} value={q.toString()}>
                      Q{q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={s.startYear?.toString() ?? ''}
              onValueChange={(v) => s.setStartYear(Number(v))}
              disabled={periodFieldsDisabled}
            >
              <SelectTrigger aria-label="Year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-muted-foreground text-sm">→</span>

          <div className="flex flex-1 gap-2">
            {s.isMonthly ? (
              <Select
                value={s.endPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setEndPeriod(Number(v))}
                disabled={periodFieldsDisabled}
              >
                <SelectTrigger aria-label="Month" className="w-24">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {MONTH_KEYS.map((k, i) => (
                    <SelectItem key={k} value={k}>
                      {MONTH_NAMES_SHORT[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : useMonthPickerForQuarters ? (
              // Quarter-selection validation ticket — every month is always selectable (never
              // disabled); an impossible combination is caught by the green/red
              // SchedulePeriodBanner instead of blocking the pick itself.
              <Select
                value={s.endPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setEndPeriod(Number(v))}
                disabled={periodFieldsDisabled}
              >
                <SelectTrigger aria-label="Month" className="w-24">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {MONTH_KEYS.map((k, i) => (
                    <SelectItem key={k} value={k}>
                      {MONTH_NAMES_SHORT[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={s.endPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setEndPeriod(Number(v))}
                disabled={periodFieldsDisabled}
              >
                <SelectTrigger aria-label="Quarter">
                  <SelectValue placeholder="Quarter" />
                </SelectTrigger>
                <SelectContent>
                  {s.endQuarterOptions.map((q) => (
                    <SelectItem key={q} value={q.toString()}>
                      Q{q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={s.endYear?.toString() ?? ''}
              onValueChange={(v) => s.setEndYear(Number(v))}
              disabled={periodFieldsDisabled}
            >
              <SelectTrigger aria-label="Year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {s.endYearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface StatutoryDeadlineFieldsProps {
  s: DeadlineSchedule
  /** Group Case flow: renames the third column from "Statutory deadline" to "Group Case
   * Deadline" — same mode-toggle control (working days / calendar day) and the same
   * calculation, just relabeled for the group context. Defaults to Single Case's label. */
  deadlineLabel?: string
}

export function StatutoryDeadlineFields({ s, deadlineLabel = 'Statutory deadline' }: StatutoryDeadlineFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="period-close-day" className="font-medium text-foreground text-sm">
          Client closes the VAT period cycle on the
        </label>
        <Select value={s.periodCloseDay?.toString() ?? ''} onValueChange={(v) => s.setPeriodCloseDay(Number(v))}>
          <SelectTrigger id="period-close-day">
            <SelectValue placeholder="Select date" />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS_31.map((d) => (
              <SelectItem key={d} value={d.toString()}>
                {d}
                {ordinalSuffix(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">of the following month.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="data-provision-deadline" className="font-medium text-foreground text-sm">
          Deadline for providing the data is
        </label>
        <div className="flex w-fit items-center rounded-md border border-input shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => s.setDataProvisionDeadline((n) => Math.max(1, n - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <div id="data-provision-deadline" className="flex h-9 w-14 items-center justify-center text-center text-sm">
            {s.dataProvisionDeadline}
          </div>
          <div className="h-5 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => s.setDataProvisionDeadline((n) => n + 1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">working days after VAT period cycle closes.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium text-foreground text-sm">{deadlineLabel}</label>
        <Tabs
          value={s.deadlineMode}
          onChange={s.setDeadlineMode}
          options={[
            { value: 'workingDays', label: 'Working days' },
            { value: 'dayOfMonth', label: 'Calendar day' },
          ]}
        />
        {s.deadlineMode === 'workingDays' ? (
          <Select value={s.workingDaysValue?.toString() ?? ''} onValueChange={(v) => s.setWorkingDaysValue(Number(v))}>
            <SelectTrigger aria-label="Working days">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {WORKING_DAY_OPTIONS.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} {n === 1 ? 'day' : 'days'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={s.dayOfMonthValue?.toString() ?? ''} onValueChange={(v) => s.setDayOfMonthValue(Number(v))}>
            <SelectTrigger aria-label="Calendar day">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS_31.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
                  {ordinalSuffix(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-muted-foreground text-sm">
          {s.deadlineExtension ? 'of second following month' : 'of following month'}
        </p>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Checkbox
            id="statutory-deadline-extension"
            checked={s.deadlineExtension}
            onCheckedChange={(checked) => s.setDeadlineExtension(checked === true)}
          />
          <label htmlFor="statutory-deadline-extension" className="cursor-pointer select-none font-medium text-sm">
            Deadline extension (+2 months)
          </label>
        </div>
      </div>
    </div>
  )
}

export function CustomDeadlineSection({ s }: { s: DeadlineSchedule }) {
  // Custom-deadlines-warning ticket — the switch itself only becomes interactive once every
  // field above it (Frequency, Scheduled period, Period close date, Statutory deadline) is
  // filled in and forms a valid, non-past schedule; before that there's no real case list to
  // set a custom deadline for. No accompanying message — the disabled switch says enough on
  // its own.
  const priorDataComplete = s.periodCaseCount > 0 && !!s.periodCloseDay && s.deadlineValueChosen
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Switch checked={s.useCustomDeadlines} onCheckedChange={s.setUseCustomDeadlines} disabled={!priorDataComplete} />
        <span className="font-medium text-foreground text-sm">Set custom statutory deadlines for each case</span>
      </div>

      {s.useCustomDeadlines && s.cases.length > 0 && (
        <div
          className={cn(
            'rounded-md border border-border',
            s.cases.length > 3 ? 'max-h-56 overflow-y-auto' : 'overflow-hidden',
          )}
        >
          <Table>
            <TableHeader className={s.cases.length > 3 ? 'sticky top-0 z-10' : undefined}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/50 px-4">Case name</TableHead>
                <TableHead className="bg-muted/50 px-4">Default statutory deadline</TableHead>
                <TableHead className="bg-muted/50 px-4">Set custom deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.cases.map((c) => {
                const hasCustom = !!c.customDeadline
                return (
                  <TableRow key={c.key}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{c.name}</TableCell>
                    {/* Whichever deadline is currently active reads as the prominent one — the
                        other fades to a ghost/muted state, so it's obvious at a glance which
                        value a case will actually use. */}
                    <TableCell
                      className={cn('px-4 py-3', hasCustom ? 'text-muted-foreground/50' : 'font-medium text-foreground')}
                    >
                      {formatLongDate(c.defaultDeadline)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <DatePicker
                        value={c.customDeadline}
                        onChange={(date) => s.setCustomDeadline(c.key, date)}
                        placeholder="Set custom deadline"
                        formatValue={formatLongDate}
                        // Opens on the already-calculated default deadline (not today) so the
                        // user adjusts from that starting point; Monday-first week, per the
                        // reference calendar convention.
                        defaultMonth={c.defaultDeadline}
                        weekStartsOn={1}
                        className={cn(
                          'w-fit',
                          hasCustom && 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 hover:text-amber-950',
                        )}
                        data-testid={`custom-deadline-${c.key}`}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Green/red SchedulePeriodBanner ticket — replaces the old blue "Schedule Summary" info box.
// Renders nothing until Frequency + every Scheduled period field has a value
// (`periodSelectionComplete`); from then on it's a straight verdict on that selection — green
// with the resulting case count, or red explaining the combination doesn't work, never both and
// never a third "still missing something below" state (that's what the disabled submit button
// already communicates).
export function SchedulePeriodBanner({ ready, count }: { ready: boolean; count: number }) {
  if (!ready) return null
  if (count > 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        {count} {count === 1 ? 'case' : 'cases'} will be scheduled
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      Selected period is not supporting the frequency. Please select a correct scheduling period.
    </div>
  )
}
