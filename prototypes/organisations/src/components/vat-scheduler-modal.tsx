import { useEffect, useMemo, useRef, useState } from 'react'
import { InfoIcon, Minus, Plus, UploadIcon } from 'lucide-react'
import {
  Badge,
  Button,
  Checkbox,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@wts/ui'

// Prototype replica of the reference platform's VAT scheduler modal (see
// reference/WTS20Platform/src/components/vat-scheduler/vat-scheduler-modal.tsx). Layout,
// fields, and structure mirror that component as closely as possible — no redesign, no
// backend, no validation library. The left "Case details" panel is a read-only summary of
// what was already picked in the Create Case drawer; only the scheduler fields on the
// right are locally interactive. "Create scheduled cases" has no backend yet — it just
// closes this modal and the parent drawer, same as the drawer's own submit used to.

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 1 + i)
const DAY_OPTIONS_31 = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const
const QUARTER_OPTIONS = [1, 2, 3, 4] as const

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-foreground text-sm">{value || '—'}</span>
  </div>
)

export interface GroupMember {
  id: string
  name: string
}

export interface VatSchedulerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Closes the parent Create Case drawer once a schedule is "created". */
  onCreated: () => void
  /** Drawer-collected values — shown read-only in the left summary panel. */
  organisationName: string
  groupName: string
  jurisdiction: string
  vatRegistration: string
  projectCode: string
  caseTypeLabel: string
  creatorName: string
  reviewerName: string
  partnerNames: string[]
  clientName: string
  /** Legal entities belonging to the selected group — each gets a Client Approval toggle. */
  groupMembers: GroupMember[]
}

export function VatSchedulerModal({
  open,
  onOpenChange,
  onCreated,
  organisationName,
  groupName,
  jurisdiction,
  vatRegistration,
  projectCode,
  caseTypeLabel,
  creatorName,
  reviewerName,
  partnerNames,
  clientName,
  groupMembers,
}: VatSchedulerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly'>('Quarterly')
  const [startPeriod, setStartPeriod] = useState<number | undefined>(undefined)
  const [startYear, setStartYear] = useState(CURRENT_YEAR)
  const [endPeriod, setEndPeriod] = useState<number | undefined>(undefined)
  const [endYear, setEndYear] = useState(CURRENT_YEAR)
  const [periodCloseDay, setPeriodCloseDay] = useState<number | undefined>(undefined)
  const [dataProvisionDeadline, setDataProvisionDeadline] = useState(3)
  const [statutoryDeadlineDay, setStatutoryDeadlineDay] = useState<number | undefined>(undefined)
  const [deadlineExtension, setDeadlineExtension] = useState(false)
  const [templateFileName, setTemplateFileName] = useState<string | undefined>(undefined)
  // Client Approval rule per legal entity — defaults to skipped (false/absent) for everyone.
  const [approvalByEntityId, setApprovalByEntityId] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return
    setFrequency('Quarterly')
    setStartPeriod(undefined)
    setStartYear(CURRENT_YEAR)
    setEndPeriod(undefined)
    setEndYear(CURRENT_YEAR)
    setPeriodCloseDay(undefined)
    setDataProvisionDeadline(3)
    setStatutoryDeadlineDay(undefined)
    setDeadlineExtension(false)
    setTemplateFileName(undefined)
    setApprovalByEntityId({})
  }, [open])

  const toggleApproval = (entityId: string) =>
    setApprovalByEntityId((prev) => ({ ...prev, [entityId]: !prev[entityId] }))

  const schedulePayload = useMemo(
    () => ({
      group: groupName,
      entities: groupMembers.map((m) => ({
        name: m.name,
        requiresClientApproval: !!approvalByEntityId[m.id],
      })),
    }),
    [groupName, groupMembers, approvalByEntityId],
  )

  const isMonthly = frequency === 'Monthly'

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as 'Monthly' | 'Quarterly')
    setStartPeriod(undefined)
    setEndPeriod(undefined)
  }

  const canSubmit = !!startPeriod && !!endPeriod && !!periodCloseDay && !!statutoryDeadlineDay

  const handleCancel = () => onOpenChange(false)

  const handleSubmit = () => {
    if (!canSubmit) return
    // No backend yet — mirrors what the drawer's submit used to do. The structured
    // group/entity/requiresClientApproval payload has nowhere to go yet, so it's logged
    // here to demonstrate the data model this modal produces.
    console.log('VAT group schedule payload', schedulePayload)
    onOpenChange(false)
    onCreated()
  }

  const handleUploadClick = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setTemplateFileName(file.name)
    e.target.value = ''
  }

  const endYearOptions = YEAR_OPTIONS.filter((y) => y >= startYear)
  const endMonthKeys = startYear === endYear && startPeriod ? MONTH_KEYS.filter((k) => Number(k) >= startPeriod) : MONTH_KEYS
  const endQuarterOptions = startYear === endYear && startPeriod ? QUARTER_OPTIONS.filter((q) => q >= startPeriod) : QUARTER_OPTIONS

  const partnerLabel = partnerNames.length > 0 ? partnerNames.join(', ') : ''
  const clientLabel = clientName ? `${clientName} (external)` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-5xl flex-row gap-0 overflow-hidden p-0">
        {/* Left sidebar: read-only summary of the Create Case drawer selections */}
        <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-muted/30 px-6 py-5">
          <h3 className="font-semibold text-foreground text-sm">Group case details</h3>
          <div className="flex flex-col gap-5">
            <SummaryRow label="Organisation" value={organisationName} />
            <SummaryRow label="Group" value={groupName} />
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
            <DialogTitle className="text-lg">VAT Group Scheduler</DialogTitle>
            {caseTypeLabel && (
              <Badge variant="soft" tone="blue" size="sm">
                {caseTypeLabel}
              </Badge>
            )}
            <DialogDescription className="sr-only">VAT Group Scheduler</DialogDescription>
          </DialogHeader>

          <p className="border-b px-6 py-3 text-muted-foreground text-sm">
            This will create cases for the selected time period for each member of the selected group.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
          >
            {/* Client Approval rule per legal entity in the group — defaults to skipped */}
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground text-sm">Legal entities</p>
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border">
                {groupMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                    <span className="text-foreground text-sm">{m.name}</span>
                    <label className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm">
                      <Checkbox
                        checked={!!approvalByEntityId[m.id]}
                        onCheckedChange={() => toggleApproval(m.id)}
                      />
                      Requires Client Approval
                    </label>
                  </div>
                ))}
              </div>
            </div>

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
                  {/* Start */}
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

                  {/* End */}
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
                <p className="text-muted-foreground text-sm">of the previous month</p>
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
                <label htmlFor="statutory-deadline" className="flex items-center gap-1.5 font-medium text-foreground text-sm">
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
                <Select value={statutoryDeadlineDay?.toString() ?? ''} onValueChange={(v) => setStatutoryDeadlineDay(Number(v))}>
                  <SelectTrigger id="statutory-deadline">
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
                <p className="text-muted-foreground text-sm">
                  {deadlineExtension ? 'of the second following month' : 'of the following month'}
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="statutory-deadline-extension"
                    checked={deadlineExtension}
                    onCheckedChange={(checked) => setDeadlineExtension(checked === true)}
                  />
                  <label htmlFor="statutory-deadline-extension" className="cursor-pointer select-none font-medium text-sm">
                    Deadline extension (+2 months)
                  </label>
                </div>
              </div>
            </div>

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
