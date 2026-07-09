import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
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

export type Frequency = 'Monthly' | 'Quarterly'
export type DeadlineMode = 'workingDays' | 'dayOfMonth'

export interface Period {
  key: string
  period: number
  year: number
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

// The month `monthsAhead` after a period's end month — e.g. Q1 (Jan–Mar) → April for 1,
// May for 2 (the "Deadline extension (+2 months)" checkbox).
export function followingMonth(
  frequency: Frequency,
  period: number,
  year: number,
  monthsAhead: 1 | 2,
): { monthIndex: number; year: number } {
  const endMonthIndex = frequency === 'Monthly' ? period - 1 : period * 3 - 1
  const total = endMonthIndex + monthsAhead
  return { monthIndex: total % 12, year: year + Math.floor(total / 12) }
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

export interface DeadlineScheduleOptions {
  /**
   * Group Case flow only: drops the "Statutory deadline" mode config (working days/day of
   * month + extension) and the custom per-case override table entirely — Group Case Deadline
   * (the renamed data-provision-deadline stepper) becomes the sole driver of each case's
   * default deadline, computed the same way the old "working days" mode was (Nth working day
   * of the month following the period), just fed by `dataProvisionDeadline` instead of
   * `workingDaysValue`, and always +1 month (no deadline-extension toggle for group).
   * Single Case's own call site omits this — nothing about its behaviour changes.
   */
  deadlineFromDataProvision?: boolean
}

export function useDeadlineSchedule(
  caseNameFor: (p: Period, frequency: Frequency) => string,
  options?: DeadlineScheduleOptions,
): DeadlineSchedule {
  const deadlineFromDataProvision = options?.deadlineFromDataProvision ?? false
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

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as Frequency)
    setStartPeriod(undefined)
    setEndPeriod(undefined)
  }

  const endYearOptions = YEAR_OPTIONS.filter((y) => y >= startYear)
  const endMonthKeys = startYear === endYear && startPeriod ? MONTH_KEYS.filter((k) => Number(k) >= startPeriod) : MONTH_KEYS
  const endQuarterOptions = startYear === endYear && startPeriod ? QUARTER_OPTIONS.filter((q) => q >= startPeriod) : QUARTER_OPTIONS

  // Group Case Deadline (dataProvisionDeadline) always has a valid positive-integer default,
  // so it's effectively always "chosen" — only single case's mode-based value can be unset.
  const deadlineValueChosen = deadlineFromDataProvision
    ? true
    : deadlineMode === 'workingDays'
      ? !!workingDaysValue
      : !!dayOfMonthValue

  const periods = useMemo(() => {
    if (!startPeriod || !endPeriod || !deadlineValueChosen) return []
    return generatePeriods(frequency, startPeriod, startYear, endPeriod, endYear)
  }, [frequency, startPeriod, startYear, endPeriod, endYear, deadlineValueChosen])

  const cases = useMemo(
    () =>
      periods.map((p) => {
        const defaultDeadline = deadlineFromDataProvision
          ? nthWeekdayOfMonth(
              followingMonth(frequency, p.period, p.year, 1).year,
              followingMonth(frequency, p.period, p.year, 1).monthIndex,
              dataProvisionDeadline,
            )
          : (() => {
              const { monthIndex, year } = followingMonth(frequency, p.period, p.year, deadlineExtension ? 2 : 1)
              return deadlineMode === 'workingDays'
                ? nthWeekdayOfMonth(year, monthIndex, workingDaysValue)
                : dateForDayOfMonth(year, monthIndex, dayOfMonthValue ?? 1)
            })()
        return { ...p, name: caseNameFor(p, frequency), defaultDeadline, customDeadline: customDeadlines[p.key] }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      periods,
      frequency,
      deadlineFromDataProvision,
      dataProvisionDeadline,
      deadlineMode,
      workingDaysValue,
      dayOfMonthValue,
      deadlineExtension,
      customDeadlines,
    ],
  )

  const setCustomDeadline = (key: string, date: Date | undefined) =>
    setCustomDeadlines((prev) => ({ ...prev, [key]: date }))

  const canSubmitSchedule = !!startPeriod && !!endPeriod && !!periodCloseDay && deadlineValueChosen

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

export function FrequencyPeriodFields({ s }: { s: DeadlineSchedule }) {
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
        <p className="font-medium text-foreground text-sm">Scheduled period</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-2">
            {s.isMonthly ? (
              <Select value={s.startPeriod?.toString() ?? ''} onValueChange={(v) => s.setStartPeriod(Number(v))}>
                <SelectTrigger aria-label="Month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
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
                <SelectTrigger aria-label="Month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {s.endMonthKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
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
      </div>
    </div>
  )
}

export function StatutoryDeadlineFields({ s }: { s: DeadlineSchedule }) {
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
              <TooltipContent>How many working days the client has to provide data.</TooltipContent>
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
          Statutory deadline
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>The legal filing deadline for this VAT return.</TooltipContent>
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

// Group Case flow only — replaces StatutoryDeadlineFields + CustomDeadlineSection. Drops the
// working-days/day-of-month mode tabs and the +2-months extension entirely; Group Case Deadline
// (the renamed data-provision-deadline stepper) is the sole driver of each case's deadline (see
// `deadlineFromDataProvision` on useDeadlineSchedule). Single case keeps StatutoryDeadlineFields.
export function GroupCaseDeadlineFields({ s }: { s: DeadlineSchedule }) {
  return (
    <div className="grid grid-cols-2 gap-3">
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
        <label htmlFor="group-case-deadline" className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          Group Case Deadline
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>Working day of the following month each case in this group is due.</TooltipContent>
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
          <div id="group-case-deadline" className="flex h-9 w-14 items-center justify-center text-center text-sm">
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
        <p className="text-muted-foreground text-sm">working days after the closure, of following month</p>
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
