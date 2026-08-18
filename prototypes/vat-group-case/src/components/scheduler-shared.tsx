import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { InfoIcon, Minus, Plus } from 'lucide-react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@wts/ui'

// Statutory Deadline scheduling — shared between SingleCaseSchedulerModal and the Group Case
// VatSchedulerModal (see Part 3/4 of the "Refine Case Creation Drawer & Align Group Scheduler
// with Single Scheduler" ticket: same Frequency/Period/deadline-mode/+2-months/custom-override
// experience in both, without touching either flow's own group- or single-specific fields).
// The `useDeadlineSchedule` hook owns all of the state; the exported field components render
// it. Each modal still owns its own header, side summary panel, and footer.

export const CURRENT_YEAR = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 1 + i)
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

// Total number of calendar months from start to end, inclusive — the shared span calculation
// behind both countMonthBasedQuarters and isQuarterBoundaryMonth below.
function monthSpan(startMonth: number, startYear: number, endMonth: number, endYear: number): number {
  return (endYear * 12 + (endMonth - 1)) - (startYear * 12 + (startMonth - 1)) + 1
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

// Flexible month-based quarters ticket — true for exactly the end months that complete another
// full quarter (every 3rd month out from the start: e.g. start = January → March, June,
// September, December), so the end-month dropdown can flag which choices actually add a case vs
// which ones (like April, still within Q1) don't change the count.
export function isQuarterBoundaryMonth(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
): boolean {
  const span = monthSpan(startMonth, startYear, endMonth, endYear)
  return span > 0 && span % 3 === 0
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
  frequency: Frequency
  isMonthly: boolean
  handleFrequencyChange: (value: string) => void
  startPeriod: number | undefined
  setStartPeriod: (v: number) => void
  startYear: number
  setStartYear: (v: number) => void
  endPeriod: number | undefined
  setEndPeriod: (v: number) => void
  endYear: number
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
  workingDaysValue: number
  setWorkingDaysValue: (v: number) => void
  dayOfMonthValue: number | undefined
  setDayOfMonthValue: (v: number) => void
  deadlineExtension: boolean
  setDeadlineExtension: (v: boolean) => void
  useCustomDeadlines: boolean
  setUseCustomDeadlines: (v: boolean) => void
  cases: GeneratedCase[]
  setCustomDeadline: (key: string, date: Date | undefined) => void
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
  const [frequency, setFrequency] = useState<Frequency>('Quarterly')
  const [startPeriod, setStartPeriod] = useState<number | undefined>(undefined)
  const [startYear, setStartYear] = useState(CURRENT_YEAR)
  const [endPeriod, setEndPeriod] = useState<number | undefined>(undefined)
  const [endYear, setEndYear] = useState(CURRENT_YEAR)
  const [periodCloseDay, setPeriodCloseDay] = useState<number | undefined>(undefined)
  const [dataProvisionDeadline, setDataProvisionDeadline] = useState(3)
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('workingDays')
  const [workingDaysValue, setWorkingDaysValue] = useState(2)
  const [dayOfMonthValue, setDayOfMonthValue] = useState<number | undefined>(undefined)
  const [deadlineExtension, setDeadlineExtension] = useState(false)
  const [useCustomDeadlines, setUseCustomDeadlines] = useState(false)
  const [customDeadlines, setCustomDeadlines] = useState<Record<string, Date | undefined>>({})

  const isMonthly = frequency === 'Monthly'
  const useMonthBasedQuarters = monthBasedQuarters && !isMonthly

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as Frequency)
    setStartPeriod(undefined)
    setEndPeriod(undefined)
  }

  const endYearOptions = YEAR_OPTIONS.filter((y) => y >= startYear)
  const endMonthKeys = startYear === endYear && startPeriod ? MONTH_KEYS.filter((k) => Number(k) >= startPeriod) : MONTH_KEYS
  const endQuarterOptions = startYear === endYear && startPeriod ? QUARTER_OPTIONS.filter((q) => q >= startPeriod) : QUARTER_OPTIONS

  // Flexible month-based quarters ticket — if a start-month change (or the end month/year
  // themselves) leaves the previously chosen end month no longer forming a full 3-month
  // quarter with the start, clear it instead of silently keeping a now-invalid selection
  // (FrequencyPeriodFields' own month list already stops offering it, but a stale value chosen
  // before the start changed wouldn't otherwise be cleared).
  useEffect(() => {
    if (!useMonthBasedQuarters || !startPeriod || endPeriod === undefined) return
    if (countMonthBasedQuarters(startPeriod, startYear, endPeriod, endYear) === 0) setEndPeriod(undefined)
  }, [useMonthBasedQuarters, startPeriod, startYear, endPeriod, endYear])

  const deadlineValueChosen = deadlineMode === 'workingDays' ? !!workingDaysValue : !!dayOfMonthValue

  const periods = useMemo(() => {
    if (!startPeriod || !endPeriod || !deadlineValueChosen) return []
    if (useMonthBasedQuarters) {
      return generateMonthBasedQuarterPeriods(startPeriod, startYear, endPeriod, endYear)
    }
    return generatePeriods(frequency, startPeriod, startYear, endPeriod, endYear)
  }, [frequency, startPeriod, startYear, endPeriod, endYear, deadlineValueChosen, useMonthBasedQuarters])

  const cases = useMemo(
    () =>
      periods.map((p) => {
        const { monthIndex, year } = followingMonth(
          frequency,
          p.startMonth !== undefined ? 1 : p.period,
          p.year,
          deadlineExtension ? 2 : 1,
          p.startMonth ?? 1,
        )
        const defaultDeadline =
          deadlineMode === 'workingDays'
            ? nthWeekdayOfMonth(year, monthIndex, workingDaysValue)
            : dateForDayOfMonth(year, monthIndex, dayOfMonthValue ?? 1)
        return { ...p, name: caseNameFor(p, frequency), defaultDeadline, customDeadline: customDeadlines[p.key] }
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
  const canSubmitSchedule = !!startPeriod && !!endPeriod && !!periodCloseDay && deadlineValueChosen && cases.length > 0

  const reset = () => {
    setFrequency('Quarterly')
    setStartPeriod(undefined)
    setStartYear(CURRENT_YEAR)
    setEndPeriod(undefined)
    setEndYear(CURRENT_YEAR)
    setPeriodCloseDay(undefined)
    setDataProvisionDeadline(3)
    setDeadlineMode('workingDays')
    setWorkingDaysValue(2)
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
  const quarterCaseCount =
    useMonthPickerForQuarters && s.startPeriod && s.endPeriod
      ? countMonthBasedQuarters(s.startPeriod, s.startYear, s.endPeriod, s.endYear)
      : 0
  // Flexible month-based quarters ticket — an end month only offered once it forms at least one
  // full 3-month quarter with the chosen start (e.g. start = January → February is not
  // selectable, March is the earliest); reuses the exact same grouping math as the case count
  // and the "not enough months" message below, so the three always agree.
  const quarterEndMonthKeys = s.startPeriod
    ? MONTH_KEYS.filter((k) => countMonthBasedQuarters(s.startPeriod!, s.startYear, Number(k), s.endYear) > 0)
    : MONTH_KEYS
  // No month in the currently selected end year can complete a quarter (e.g. start = November,
  // end year still the same year — even December is only 2 months out) — rather than opening an
  // empty dropdown, disable it and point at the fix (a later end year) instead.
  const noValidEndMonthForYear = useMonthPickerForQuarters && !!s.startPeriod && quarterEndMonthKeys.length === 0

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="frequency" className="font-medium text-foreground text-sm">
          Frequency
        </label>
        <Select value={s.frequency} onValueChange={s.handleFrequencyChange}>
          <SelectTrigger id="frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 flex flex-col gap-2">
        <p className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          Scheduled period
          {useMonthPickerForQuarters && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
                </TooltipTrigger>
                <TooltipContent>
                  A blue dot marks the end months that complete another quarter — picking one
                  of those adds a case; picking a month in between doesn't change the count.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-2">
            {s.isMonthly ? (
              <Select value={s.startPeriod?.toString() ?? ''} onValueChange={(v) => s.setStartPeriod(Number(v))}>
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
              <Select value={s.startPeriod?.toString() ?? ''} onValueChange={(v) => s.setStartPeriod(Number(v))}>
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
              <Select value={s.startPeriod?.toString() ?? ''} onValueChange={(v) => s.setStartPeriod(Number(v))}>
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
            <Select value={s.startYear.toString()} onValueChange={(v) => s.setStartYear(Number(v))}>
              <SelectTrigger aria-label="Year">
                <SelectValue />
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
              <Select value={s.endPeriod?.toString() ?? ''} onValueChange={(v) => s.setEndPeriod(Number(v))}>
                <SelectTrigger aria-label="Month" className="w-24">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {s.endMonthKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {MONTH_NAMES_SHORT[Number(k) - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : useMonthPickerForQuarters ? (
              <Select
                value={s.endPeriod?.toString() ?? ''}
                onValueChange={(v) => s.setEndPeriod(Number(v))}
                disabled={noValidEndMonthForYear}
              >
                <SelectTrigger aria-label="Month" className="w-24">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {quarterEndMonthKeys.map((k) => {
                    const addsQuarter = isQuarterBoundaryMonth(s.startPeriod!, s.startYear, Number(k), s.endYear)
                    return (
                      <SelectItem
                        key={k}
                        value={k}
                        rightSlot={
                          addsQuarter ? (
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"
                              aria-label="Completes another quarter"
                            />
                          ) : undefined
                        }
                      >
                        {MONTH_NAMES_SHORT[Number(k) - 1]}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : (
              <Select value={s.endPeriod?.toString() ?? ''} onValueChange={(v) => s.setEndPeriod(Number(v))}>
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
            <Select value={s.endYear.toString()} onValueChange={(v) => s.setEndYear(Number(v))}>
              <SelectTrigger aria-label="Year">
                <SelectValue />
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
        {noValidEndMonthForYear ? (
          <p className="text-destructive text-xs">
            No quarter fits in {s.endYear} starting from {MONTH_NAMES_SHORT[s.startPeriod! - 1]} — change the end
            year to a later one.
          </p>
        ) : (
          useMonthPickerForQuarters && s.startPeriod && s.endPeriod && (
            quarterCaseCount > 0 ? (
              <p className="text-muted-foreground text-xs">
                Cases will be created for {quarterCaseCount} {quarterCaseCount === 1 ? 'quarter' : 'quarters'}
              </p>
            ) : (
              <p className="text-destructive text-xs">Selected period does not include a quarter.</p>
            )
          )
        )}
      </div>
    </div>
  )
}

export interface StatutoryDeadlineFieldsProps {
  s: DeadlineSchedule
  /** Group Case flow: overrides the "Data provision deadline" tooltip copy — the group
   * scheduler mirrors this field exactly (same +/- control) but describes it in terms of the
   * client's own data-delivery commitment rather than a generic working-days count. Defaults
   * to Single Case's existing tooltip. */
  dataProvisionTooltip?: string
  /** Group Case flow: renames the third column from "Statutory deadline" to "Group Case
   * Deadline" — same mode-toggle control (working days / day of month) and the same
   * calculation, just relabeled for the group context. Defaults to Single Case's label. */
  deadlineLabel?: string
  deadlineTooltip?: string
}

export function StatutoryDeadlineFields({
  s,
  dataProvisionTooltip = 'How many working days the client has to provide data.',
  deadlineLabel = 'Statutory deadline',
  deadlineTooltip = 'The legal filing deadline for this VAT return.',
}: StatutoryDeadlineFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="period-close-day" className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          Period close date
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>The date the VAT period closes each cycle.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Select value={s.periodCloseDay?.toString() ?? ''} onValueChange={(v) => s.setPeriodCloseDay(Number(v))}>
          <SelectTrigger id="period-close-day">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS_31.map((d) => (
              <SelectItem key={d} value={d.toString()}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">of previous month</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="data-provision-deadline" className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          Data provision deadline
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>{dataProvisionTooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        <p className="text-muted-foreground text-sm">working days after the closure</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          {deadlineLabel}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>{deadlineTooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Tabs
          value={s.deadlineMode}
          onChange={s.setDeadlineMode}
          options={[
            { value: 'workingDays', label: 'Working days' },
            { value: 'dayOfMonth', label: 'Day of month' },
          ]}
        />
        {s.deadlineMode === 'workingDays' ? (
          <Select value={s.workingDaysValue.toString()} onValueChange={(v) => s.setWorkingDaysValue(Number(v))}>
            <SelectTrigger aria-label="Working days">
              <SelectValue />
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
            <SelectTrigger aria-label="Day of month">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS_31.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
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
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Switch checked={s.useCustomDeadlines} onCheckedChange={s.setUseCustomDeadlines} />
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

export function ScheduleSummaryBox({ count, frequency }: { count: number; frequency: Frequency }) {
  if (count === 0) return null
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
      <p className="font-medium text-blue-900 text-sm">Schedule Summary</p>
      <p className="text-blue-800 text-sm">
        {count} {count === 1 ? 'case' : 'cases'} planned · {frequency} recurrence
      </p>
    </div>
  )
}
