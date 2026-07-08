import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, UploadIcon } from 'lucide-react'
import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Stepper,
  Switch,
} from '@wts/ui'

import {
  CustomDeadlineSection,
  FrequencyPeriodFields,
  periodLabel,
  ScheduleSummaryBox,
  StatutoryDeadlineFields,
  useDeadlineSchedule,
} from './scheduler-shared'
import { SelectableUser, UserSelect } from './user-select'

// Prototype replica of the reference platform's VAT scheduler modal (see
// reference/WTS20Platform/src/components/vat-scheduler/vat-scheduler-modal.tsx). Layout,
// fields, and structure mirror that component as closely as possible — no redesign, no
// backend, no validation library. The left "Case details" panel is a read-only summary of
// what was already picked in the Create Case drawer; only the scheduler fields on the
// right are locally interactive. "Create scheduled cases" has no backend yet — it just
// closes this modal and the parent drawer, same as the drawer's own submit used to.
//
// The Frequency/Period/Statutory-Deadline/custom-override scheduling below is shared with
// SingleCaseSchedulerModal via scheduler-shared.tsx (same component, same behaviour, same
// styling). This modal additionally splits into two steps (Stepper, matching this library's
// existing case-phase stepper pattern) — Step 1 is scheduler configuration, Step 2 is the
// per-legal-entity Client Approval + role assignment, both unique to the group flow.

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-foreground text-sm">{value || '—'}</span>
  </div>
)

// Same placeholder directory used by the group-case form — a real user directory doesn't
// exist in this prototype yet. Needed here (not just names) so non-representative entities
// can be assigned a different Creator/Reviewer/Partner than the case-level defaults.
const DUMMY_USERS: SelectableUser[] = [
  { id: 'maria-fischer', name: 'Maria Fischer', email: 'maria.fischer@example.com' },
  { id: 'jordan-miller', name: 'Jordan Miller', email: 'jordan.miller@example.com' },
  { id: 'oscar-wilson', name: 'Oscar Wilson', email: 'oscar.wilson@example.com' },
  { id: 'emma-johnson', name: 'Emma Johnson', email: 'emma.johnson@example.com' },
  { id: 'lucas-brown', name: 'Lucas Brown', email: 'lucas.brown@example.com' },
  { id: 'sophie-martin', name: 'Sophie Martin', email: 'sophie.martin@example.com' },
  { id: 'noah-davis', name: 'Noah Davis', email: 'noah.davis@example.com' },
  { id: 'olivia-taylor', name: 'Olivia Taylor', email: 'olivia.taylor@example.com' },
]

type SchedulerStep = 'schedule' | 'entities'

interface EntityRoleAssignment {
  creatorId?: string
  reviewerId?: string
  partnerIds: string[]
}

export interface GroupMember {
  id: string
  name: string
  /** The group's single Representative Legal Entity — badged, informational only. */
  isRepresentative?: boolean
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
  const [templateFileName, setTemplateFileName] = useState<string | undefined>(undefined)
  const [step, setStep] = useState<SchedulerStep>('schedule')
  // Client Approval rule per legal entity — defaults to skipped (false/absent) for everyone.
  const [approvalByEntityId, setApprovalByEntityId] = useState<Record<string, boolean>>({})
  const [entitySearch, setEntitySearch] = useState('')
  // Per-entity role overrides — the Representative entity has none (it always inherits the
  // case-level Creator/Reviewer/Partner instead), every other entity gets its own.
  const [entityRoles, setEntityRoles] = useState<Record<string, EntityRoleAssignment>>({})

  // Group cases are named after the group, not a per-entity case type — e.g.
  // "DE VAT Group — Q1 2026" — since a VAT group files one consolidated return per period.
  const schedule = useDeadlineSchedule((p, frequency) => `${groupName} — ${periodLabel(frequency, p.period, p.year)}`)

  useEffect(() => {
    if (!open) return
    schedule.reset()
    setTemplateFileName(undefined)
    setStep('schedule')
    setApprovalByEntityId({})
    setEntitySearch('')
    setEntityRoles({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggleApproval = (entityId: string) =>
    setApprovalByEntityId((prev) => ({ ...prev, [entityId]: !prev[entityId] }))

  const setEntityRole = (entityId: string, field: 'creatorId' | 'reviewerId', value: string | undefined) =>
    setEntityRoles((prev) => {
      const existing = prev[entityId] ?? { partnerIds: [] }
      return { ...prev, [entityId]: { ...existing, [field]: value } }
    })

  const setEntityPartners = (entityId: string, partnerIds: string[]) =>
    setEntityRoles((prev) => ({ ...prev, [entityId]: { ...prev[entityId], partnerIds } }))

  const visibleGroupMembers = useMemo(() => {
    const q = entitySearch.trim().toLowerCase()
    if (!q) return groupMembers
    return groupMembers.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
  }, [groupMembers, entitySearch])

  const approvedCount = groupMembers.filter((m) => approvalByEntityId[m.id]).length

  const userName = (id: string | undefined) => DUMMY_USERS.find((u) => u.id === id)?.name

  const schedulePayload = useMemo(
    () => ({
      group: groupName,
      entities: groupMembers.map((m) => ({
        name: m.name,
        requiresClientApproval: !!approvalByEntityId[m.id],
        roles: m.isRepresentative
          ? { creator: creatorName, reviewer: reviewerName, partners: partnerNames }
          : {
              creator: userName(entityRoles[m.id]?.creatorId),
              reviewer: userName(entityRoles[m.id]?.reviewerId),
              partners: (entityRoles[m.id]?.partnerIds ?? []).map(userName).filter((n): n is string => !!n),
            },
      })),
      cases: schedule.cases.map((c) => ({
        name: c.name,
        statutoryDeadline: c.customDeadline ?? c.defaultDeadline,
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupName, groupMembers, approvalByEntityId, entityRoles, creatorName, reviewerName, partnerNames, schedule.cases],
  )

  const canSubmit = schedule.canSubmitSchedule

  const handleCancel = () => onOpenChange(false)
  const handleNext = () => {
    if (schedule.canSubmitSchedule) setStep('entities')
  }
  const handleBack = () => setStep('schedule')

  const handleSubmit = () => {
    if (!canSubmit) return
    // No backend yet — mirrors what the drawer's submit used to do. The structured
    // group/entity/requiresClientApproval/roles payload has nowhere to go yet, so it's
    // logged here to demonstrate the data model this modal produces.
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

  const partnerLabel = partnerNames.length > 0 ? partnerNames.join(', ') : ''
  const clientLabel = clientName ? `${clientName} (external)` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-background/40 backdrop-blur-sm"
        className="flex max-h-[85vh] max-w-6xl flex-row gap-0 overflow-hidden p-0"
      >
        {/* Left sidebar: read-only summary of the Create Case drawer selections — fixed, never
            scrolls (it's always short static case info, unlike the scheduler form beside it). */}
        <aside className="flex w-64 shrink-0 flex-col gap-4 border-r bg-muted/30 px-6 py-5">
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

        {/* Right column: header, step indicator, scheduling form, footer */}
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

          <div className="border-b px-6 py-4">
            <Stepper
              steps={[
                { label: 'Schedule details', state: step === 'schedule' ? 'inProgress' : 'finished' },
                { label: 'Entities and roles', state: step === 'entities' ? 'inProgress' : 'notStarted' },
              ]}
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (step === 'schedule') handleNext()
              else handleSubmit()
            }}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
          >
            {step === 'schedule' ? (
              <>
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
              </>
            ) : (
              /* Client Approval + per-entity role assignment. Group-specific: a single case has
                 only one legal entity, so this step has no equivalent in SingleCaseSchedulerModal. */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground text-sm">Configure case settings for this group's legal entities</p>
                  <div className="relative w-56 shrink-0">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={entitySearch}
                      onChange={(e) => setEntitySearch(e.target.value)}
                      placeholder="Search legal entities…"
                      className="h-8 pl-8"
                    />
                  </div>
                </div>

                {/* Large VAT Groups shouldn't keep growing the modal — past 3 entities the
                    list scrolls internally instead, same threshold/pattern as the custom
                    Statutory Deadline table in scheduler-shared.tsx. */}
                <div
                  className={cn(
                    'flex flex-col gap-3',
                    visibleGroupMembers.length > 3 && 'max-h-[420px] overflow-y-auto pr-1',
                  )}
                >
                  {visibleGroupMembers.map((m) => {
                    const roles = entityRoles[m.id]
                    const creatorOptions = DUMMY_USERS.filter((u) => u.id !== roles?.reviewerId)
                    const reviewerOptions = DUMMY_USERS.filter((u) => u.id !== roles?.creatorId)
                    const requiresApproval = !!approvalByEntityId[m.id]
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'rounded-md border transition-colors',
                          requiresApproval ? 'border-amber-300 bg-amber-50' : 'border-border',
                        )}
                      >
                        <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                          <span
                            className={cn(
                              'flex items-center gap-2 text-sm',
                              requiresApproval ? 'font-medium text-amber-950' : 'text-foreground',
                            )}
                          >
                            {m.name}
                            {m.isRepresentative && (
                              <Badge variant="soft" tone="blue" size="sm">
                                Representative
                              </Badge>
                            )}
                          </span>
                          {/* A plain checkbox left it unclear what selecting it actually did —
                              the switch + on/off label + amber row highlight (same accent as a
                              manually-set Statutory Deadline) makes "this enables Client
                              Approval for this entity" obvious at a glance. */}
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm', requiresApproval ? 'text-amber-900' : 'text-muted-foreground')}>
                              Client Approval is {requiresApproval ? 'on' : 'off'}
                            </span>
                            <Switch
                              aria-label={`Requires Client Approval — ${m.name}`}
                              checked={requiresApproval}
                              onCheckedChange={() => toggleApproval(m.id)}
                            />
                          </div>
                        </div>
                        <div
                          className={cn(
                            'grid grid-cols-3 gap-3 border-t px-3 py-3',
                            requiresApproval ? 'border-amber-200' : 'border-border',
                          )}
                        >
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Creator</Label>
                            {m.isRepresentative ? (
                              <p className="text-foreground text-sm">{creatorName || '—'}</p>
                            ) : (
                              <UserSelect
                                users={creatorOptions}
                                value={roles?.creatorId}
                                onChange={(id) => setEntityRole(m.id, 'creatorId', id)}
                                data-testid={`entity-creator-${m.id}`}
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Reviewer</Label>
                            {m.isRepresentative ? (
                              <p className="text-foreground text-sm">{reviewerName || '—'}</p>
                            ) : (
                              <UserSelect
                                users={reviewerOptions}
                                value={roles?.reviewerId}
                                onChange={(id) => setEntityRole(m.id, 'reviewerId', id)}
                                data-testid={`entity-reviewer-${m.id}`}
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Partner</Label>
                            {m.isRepresentative ? (
                              <p className="text-foreground text-sm">{partnerLabel || '—'}</p>
                            ) : (
                              <UserSelect
                                multiple
                                users={DUMMY_USERS}
                                value={roles?.partnerIds ?? []}
                                onChange={(ids) => setEntityPartners(m.id, ids)}
                                data-testid={`entity-partner-${m.id}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-right text-muted-foreground text-sm">
                  {approvedCount} of {groupMembers.length} require the Client Approval step
                </p>
              </div>
            )}
          </form>

          <DialogFooter className="border-t px-6 py-4">
            {step === 'schedule' ? (
              <>
                <Button variant="outline" size="lg" className="flex-1" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="button" size="lg" className="flex-1" disabled={!schedule.canSubmitSchedule} onClick={handleNext}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="lg" className="flex-1" onClick={handleBack}>
                  Back
                </Button>
                <Button type="button" size="lg" className="flex-1" disabled={!canSubmit} onClick={handleSubmit}>
                  Create scheduled cases
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
