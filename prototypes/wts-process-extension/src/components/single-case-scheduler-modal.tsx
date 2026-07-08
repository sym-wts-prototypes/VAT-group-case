import { useEffect, useMemo, useRef, useState } from 'react'
import { InfoIcon, Minus, Plus, UploadIcon } from 'lucide-react'
import {
  Badge,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@wts/ui'

// Prototype replica of the reference platform's UPDATED single-case VAT scheduler (distinct
// from — and does not touch — the older Group Case VAT scheduler in vat-scheduler-modal.tsx,
// which keeps its per-legal-entity Client Approval checklist). This version drops that
// checklist (a single case has only one legal entity) in favor of period-by-period case
// generation with an optional per-case Statutory Deadline override.

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 1 + i)
const DAY_OPTIONS_31 = Array.from({ length: 31 }, (_, i) => i + 1)
const WORKING_DAY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)
const QUARTER_OPTIONS = [1, 2, 3, 4] as const
const MONTH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type Frequency = 'Monthly' | 'Quarterly'
type DeadlineMode = 'workingDays' | 'dayOfMonth'

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-foreground text-sm">{value || '—'}</span>
  </div>
)

// n-th weekday (Mon–Fri) of a month, 1-indexed — e.g. n=2 for the month's 2nd working day.
function nthWeekdayOfMonth(year: number, monthIndex: number, n: number): Date {
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

function dateForDayOfMonth(year: number, monthIndex: number, day: number): Date {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  return new Date(year, monthIndex, Math.min(day, daysInMonth))
}

function ordinalSuffix(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

// "Thursday, April 2nd 2026" — no date-fns dependency here (this prototype doesn't have a
// direct dependency on it, only @wts/ui does); native Intl covers this format fine.
function formatLongDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = date.getDate()
  return `${weekday}, ${month} ${day}${ordinalSuffix(day)} ${date.getFullYear()}`
}

interface Period {
  key: string
  period: number
  year: number
}

function periodLabel(frequency: Frequency, period: number, year: number): string {
  return frequency === 'Monthly' ? `${MONTH_NAMES[period - 1]} ${year}` : `Q${period} ${year}`
}

// The month immediately after a period's end month — e.g. Q1 (Jan–Mar) → April.
function followingMonth(frequency: Frequency, period: number, year: number): { monthIndex: number; year: number } {
  const endMonthIndex = frequency === 'Monthly' ? period - 1 : period * 3 - 1
  const next = endMonthIndex + 1
  return next > 11 ? { monthIndex: 0, year: year + 1 } : { monthIndex: next, year }
}

function generatePeriods(frequency: Frequency, startPeriod: number, startYear: number, endPeriod: number, endYear: number): Period[] {
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

export interface SingleCaseSchedulerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Closes the parent Create Case drawer once a schedule is "created". */
  onCreated: () => void
  /** Drawer-collected values — shown read-only in the left summary panel. */
  legalEntityName: string
  jurisdiction: string
  vatRegistration: string
  projectCode: string
  caseTypeLabel: string
  creatorName: string
  reviewerName: string
  partnerNames: string[]
  clientNames: string[]
}

export function SingleCaseSchedulerModal({
  open,
  onOpenChange,
  onCreated,
  legalEntityName,
  jurisdiction,
  vatRegistration,
  projectCode,
  caseTypeLabel,
  creatorName,
  reviewerName,
  partnerNames,
  clientNames,
}: SingleCaseSchedulerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const [useCustomDeadlines, setUseCustomDeadlines] = useState(false)
  const [customDeadlines, setCustomDeadlines] = useState<Record<string, Date | undefined>>({})
  const [templateFileName, setTemplateFileName] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
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
    setUseCustomDeadlines(false)
    setCustomDeadlines({})
    setTemplateFileName(undefined)
  }, [open])

  const isMonthly = frequency === 'Monthly'

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as Frequency)
    setStartPeriod(undefined)
    setEndPeriod(undefined)
  }

  const endYearOptions = YEAR_OPTIONS.filter((y) => y >= startYear)
  const endMonthKeys = startYear === endYear && startPeriod ? MONTH_KEYS.filter((k) => Number(k) >= startPeriod) : MONTH_KEYS
  const endQuarterOptions = startYear === endYear && startPeriod ? QUARTER_OPTIONS.filter((q) => q >= startPeriod) : QUARTER_OPTIONS

  const deadlineValueChosen = deadlineMode === 'workingDays' ? !!workingDaysValue : !!dayOfMonthValue

  const periods = useMemo(() => {
    if (!startPeriod || !endPeriod || !deadlineValueChosen) return []
    return generatePeriods(frequency, startPeriod, startYear, endPeriod, endYear)
  }, [frequency, startPeriod, startYear, endPeriod, endYear, deadlineValueChosen])

  const defaultDeadlineFor = (p: Period): Date => {
    const { monthIndex, year } = followingMonth(frequency, p.period, p.year)
    return deadlineMode === 'workingDays'
      ? nthWeekdayOfMonth(year, monthIndex, workingDaysValue)
      : dateForDayOfMonth(year, monthIndex, dayOfMonthValue ?? 1)
  }

  const canSubmit = !!startPeriod && !!endPeriod && !!periodCloseDay && deadlineValueChosen

  const cases = useMemo(
    () =>
      periods.map((p) => ({
        ...p,
        name: `${caseTypeLabel} - ${periodLabel(frequency, p.period, p.year)}`,
        defaultDeadline: defaultDeadlineFor(p),
        customDeadline: customDeadlines[p.key],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periods, frequency, caseTypeLabel, deadlineMode, workingDaysValue, dayOfMonthValue, customDeadlines],
  )

  const schedulePayload = useMemo(
    () => ({
      legalEntity: legalEntityName,
      cases: cases.map((c) => ({
        name: c.name,
        statutoryDeadline: c.customDeadline ?? c.defaultDeadline,
      })),
    }),
    [legalEntityName, cases],
  )

  const handleCancel = () => onOpenChange(false)

  const handleSubmit = () => {
    if (!canSubmit) return
    // No backend yet — mirrors the group scheduler's placeholder submit.
    console.log('VAT single-case schedule payload', schedulePayload)
    onOpenChange(false)
    onCreated()
  }

  const handleUploadClick = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setTemplateFileName(file.name)
    e.target.value = ''
  }

  // The header badge drops a redundant "VAT " prefix ("VAT Scheduler" already says it); case
  // names in the table below keep the full case type ("VAT Return - Q1 2026").
  const badgeLabel = caseTypeLabel.replace(/^VAT\s+/, '')
  const partnerLabel = partnerNames.length > 0 ? partnerNames.join(', ') : ''
  const clientLabel = clientNames.length > 0 ? clientNames.join(', ') : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-5xl flex-row gap-0 overflow-hidden p-0">
        {/* Left sidebar: read-only summary of the Create Case drawer selections */}
        <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-muted/30 px-6 py-5">
          <h3 className="font-semibold text-foreground text-sm">Case details</h3>
          <div className="flex flex-col gap-5">
            <SummaryRow label="Legal entity" value={legalEntityName} />
            <SummaryRow label="Jurisdiction" value={jurisdiction} />
            <SummaryRow label="VAT Registration" value={vatRegistration} />
            <SummaryRow label="Project code" value={projectCode} />
            <SummaryRow label="Creator" value={creatorName} />
            <SummaryRow label="Reviewer" value={reviewerName} />
            <SummaryRow label="Partner (Optional)" value={partnerLabel} />
            <SummaryRow label="Clients" value={clientLabel} />
          </div>
        </aside>

        {/* Right column: header, scheduling form, footer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <DialogHeader className="flex-row items-center gap-2.5 border-b px-6 py-5">
            <DialogTitle className="text-lg">VAT Scheduler</DialogTitle>
            {badgeLabel && (
              <Badge variant="soft" tone="blue" size="sm">
                {badgeLabel}
              </Badge>
            )}
            <DialogDescription className="sr-only">VAT Scheduler</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
          >
            {/* Frequency + Scheduled period */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="frequency" className="font-medium text-foreground text-sm">
                  Frequency
                </label>
                <Select value={frequency} onValueChange={handleFrequencyChange}>
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
                    {isMonthly ? (
                      <Select value={startPeriod?.toString() ?? ''} onValueChange={(v) => setStartPeriod(Number(v))}>
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
                      <Select value={startPeriod?.toString() ?? ''} onValueChange={(v) => setStartPeriod(Number(v))}>
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
                    <Select value={startYear.toString()} onValueChange={(v) => setStartYear(Number(v))}>
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
                    {isMonthly ? (
                      <Select value={endPeriod?.toString() ?? ''} onValueChange={(v) => setEndPeriod(Number(v))}>
                        <SelectTrigger aria-label="Month">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {endMonthKeys.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={endPeriod?.toString() ?? ''} onValueChange={(v) => setEndPeriod(Number(v))}>
                        <SelectTrigger aria-label="Quarter">
                          <SelectValue placeholder="Quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {endQuarterOptions.map((q) => (
                            <SelectItem key={q} value={q.toString()}>
                              Q{q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={endYear.toString()} onValueChange={(v) => setEndYear(Number(v))}>
                      <SelectTrigger aria-label="Year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {endYearOptions.map((y) => (
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

            {/* Period close date + Data provision deadline + Statutory deadline */}
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
                <Select value={periodCloseDay?.toString() ?? ''} onValueChange={(v) => setPeriodCloseDay(Number(v))}>
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
                    onClick={() => setDataProvisionDeadline((n) => Math.max(1, n - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <div className="h-5 w-px bg-border" />
                  <div id="data-provision-deadline" className="flex h-9 w-14 items-center justify-center text-center text-sm">
                    {dataProvisionDeadline}
                  </div>
                  <div className="h-5 w-px bg-border" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setDataProvisionDeadline((n) => n + 1)}
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
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-md border border-input p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={deadlineMode === 'workingDays' ? 'default' : 'ghost'}
                      className="h-7 px-2.5"
                      onClick={() => setDeadlineMode('workingDays')}
                    >
                      Working days
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={deadlineMode === 'dayOfMonth' ? 'default' : 'ghost'}
                      className="h-7 px-2.5"
                      onClick={() => setDeadlineMode('dayOfMonth')}
                    >
                      Day of month
                    </Button>
                  </div>
                </div>
                {deadlineMode === 'workingDays' ? (
                  <Select value={workingDaysValue.toString()} onValueChange={(v) => setWorkingDaysValue(Number(v))}>
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
                  <Select value={dayOfMonthValue?.toString() ?? ''} onValueChange={(v) => setDayOfMonthValue(Number(v))}>
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
                <p className="text-muted-foreground text-sm">of following month</p>
              </div>
            </div>

            {/* Per-case Statutory Deadline override */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Switch checked={useCustomDeadlines} onCheckedChange={setUseCustomDeadlines} />
                <span className="font-medium text-foreground text-sm">Set custom statutory deadlines for each case</span>
              </div>

              {useCustomDeadlines && cases.length > 0 && (
                <div className="overflow-hidden rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="bg-muted/50 px-4">Case name</TableHead>
                        <TableHead className="bg-muted/50 px-4">Default statutory deadline</TableHead>
                        <TableHead className="bg-muted/50 px-4">Set custom deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c) => (
                        <TableRow key={c.key}>
                          <TableCell className="px-4 py-3 font-medium text-foreground">{c.name}</TableCell>
                          <TableCell className="px-4 py-3 text-muted-foreground">{formatLongDate(c.defaultDeadline)}</TableCell>
                          <TableCell className="px-4 py-3">
                            <DatePicker
                              value={c.customDeadline}
                              onChange={(date) => setCustomDeadlines((prev) => ({ ...prev, [c.key]: date }))}
                              placeholder="Set custom deadline"
                              className="w-fit"
                              data-testid={`custom-deadline-${c.key}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Schedule summary */}
            {cases.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="font-medium text-blue-900 text-sm">Schedule Summary</p>
                <p className="text-blue-800 text-sm">
                  {cases.length} {cases.length === 1 ? 'case' : 'cases'} planned · {frequency} recurrence
                </p>
              </div>
            )}

            {/* Template upload */}
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-foreground text-sm">Upload data template</p>
                <p className="text-muted-foreground text-sm opacity-90">
                  The client will receive this template to format and return their VAT transaction data.
                  {templateFileName && <span className="ml-1 text-foreground">Selected: {templateFileName}</span>}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
                <UploadIcon className="size-4" />
                Upload template
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
          </form>

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" size="lg" className="flex-1" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" size="lg" className="flex-1" disabled={!canSubmit} onClick={handleSubmit}>
              Create scheduled cases
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
