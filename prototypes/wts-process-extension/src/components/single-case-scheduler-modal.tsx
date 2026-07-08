import { useEffect, useMemo, useRef, useState } from 'react'
import { UploadIcon } from 'lucide-react'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@wts/ui'

import {
  CustomDeadlineSection,
  FrequencyPeriodFields,
  periodLabel,
  ScheduleSummaryBox,
  StatutoryDeadlineFields,
  useDeadlineSchedule,
} from './scheduler-shared'

// Prototype replica of the reference platform's UPDATED single-case VAT scheduler (distinct
// from — and does not touch — the older Group Case VAT scheduler in vat-scheduler-modal.tsx,
// which keeps its per-legal-entity Client Approval checklist). This version drops that
// checklist (a single case has only one legal entity) in favor of period-by-period case
// generation with an optional per-case Statutory Deadline override. The scheduling logic
// (Frequency/Period, deadline modes, +2-months, custom overrides) lives in
// scheduler-shared.tsx, shared with the Group scheduler.

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-foreground text-sm">{value || '—'}</span>
  </div>
)

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
  const [templateFileName, setTemplateFileName] = useState<string | undefined>(undefined)

  const schedule = useDeadlineSchedule((p, frequency) => `${caseTypeLabel} - ${periodLabel(frequency, p.period, p.year)}`)

  useEffect(() => {
    if (!open) return
    schedule.reset()
    setTemplateFileName(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const schedulePayload = useMemo(
    () => ({
      legalEntity: legalEntityName,
      cases: schedule.cases.map((c) => ({
        name: c.name,
        statutoryDeadline: c.customDeadline ?? c.defaultDeadline,
      })),
    }),
    [legalEntityName, schedule.cases],
  )

  const handleCancel = () => onOpenChange(false)

  const handleSubmit = () => {
    if (!schedule.canSubmitSchedule) return
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
      <DialogContent className="flex max-h-[85vh] max-w-6xl flex-row gap-0 overflow-hidden p-0">
        {/* Left sidebar: read-only summary of the Create Case drawer selections — fixed, never
            scrolls (it's always short static case info, unlike the scheduler form beside it). */}
        <aside className="flex w-64 shrink-0 flex-col gap-4 border-r bg-muted/30 px-6 py-5">
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
            <FrequencyPeriodFields s={schedule} />
            <StatutoryDeadlineFields s={schedule} />
            <CustomDeadlineSection s={schedule} />
            <ScheduleSummaryBox count={schedule.cases.length} frequency={schedule.frequency} />

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
            <Button type="button" size="lg" className="flex-1" disabled={!schedule.canSubmitSchedule} onClick={handleSubmit}>
              Create scheduled cases
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
