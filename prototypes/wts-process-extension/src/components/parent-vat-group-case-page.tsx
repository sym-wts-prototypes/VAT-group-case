import type { BadgeTone } from '@wts/ui'
import { Badge } from '@wts/ui'

import { SectionLabel } from '@/components/body/BodyPlaceholder'
import { CasePhaseStepper } from '@/components/body/CasePhaseStepper'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
import { DueDate } from '@/components/headers/parts/DueDate'
import { CASE_MANAGEMENT_BREADCRUMB, SAMPLE_PEOPLE } from '@/config/sampleData'
import { useDemoStore } from '@/store/useDemoStore'
import type { HeaderDescriptor } from '@/types'

import { CASE_STATUS_TONE, DUMMY_GROUP_CASES } from './case-management-data'
import { vatRegistrationForJurisdiction } from './org-details-data'

// First version of the Parent VAT Group Case page (see "Case Management Improvements & Parent
// VAT Group Case Page" ticket, Part 3) — a static prototype page, structurally modelled on the
// HR Case Wrapper page (breadcrumb + title header, "cases in this wrapper" list) but adapted
// for a VAT Group Case's children, plus the process stepper the HR wrapper doesn't have.
// Reuses one of the existing dummy VAT Group Cases as its static content instead of inventing a
// parallel dataset. Deliberately self-contained (no props, no store reads beyond what
// PlaygroundMain needs to decide to render it) so a future, data-driven version can replace the
// static content here without touching how it's wired in.
const PARENT_CASE = DUMMY_GROUP_CASES[0]
const REPRESENTATIVE_VAT_REGISTRATION = vatRegistrationForJurisdiction(PARENT_CASE.jurisdiction)

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

const EDIT_TOOLTIP =
  "Changes made here apply only to the Parent Case. Assigned users will also be assigned to the Representative Legal Entity's Child Case, but not to the Child Cases of the other Legal Entities in the group."

// Each Child Case's workflow status — independent of whether it requires Client Approval at
// all (see WORKFLOW_STATUS_LABEL below, that's now its own always-visible pill).
type WorkflowStatus = 'InPreparation' | 'InReview' | 'ClientApproval' | 'ReadyForGroupCaseReview'

const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  InPreparation: 'In Preparation',
  InReview: 'In Review',
  ClientApproval: 'Client Approval',
  // Renamed from "Ready for Consolidation" — the Parent Case review replaces a separate
  // consolidation step, so the label should say what actually happens next.
  ReadyForGroupCaseReview: 'Ready for Group Case Review',
}

const WORKFLOW_STATUS_TONE: Record<WorkflowStatus, BadgeTone> = {
  InPreparation: CASE_STATUS_TONE.InPreparation,
  InReview: CASE_STATUS_TONE.InReview,
  ClientApproval: CASE_STATUS_TONE.ClientApproval,
  ReadyForGroupCaseReview: 'green',
}

// Static per-entity demo config, keyed by the dummy case's own child id: whether that legal
// entity requires a Client Approval step, and which workflow status it shows before "Tasks
// done" is checked. Deliberately varied so the page demonstrates every status this iteration
// supports, including a case that never goes through Client Approval at all.
const CHILD_CONFIG: Record<string, { requiresClientApproval: boolean; defaultStatus: WorkflowStatus }> = {
  [PARENT_CASE.children[0].id]: { requiresClientApproval: true, defaultStatus: 'InPreparation' },
  [PARENT_CASE.children[1].id]: { requiresClientApproval: true, defaultStatus: 'ClientApproval' },
  [PARENT_CASE.children[2].id]: { requiresClientApproval: false, defaultStatus: 'InReview' },
}

export function ParentVatGroupCasePage() {
  // Reuses the existing Playground "Tasks Done" checkbox (see ControlPanel.tsx) as the single
  // demo lever for "every Child Case is ready" — same control, same behaviour pattern already
  // used to gate "Send for review" on every other case page in this prototype.
  const tasksDoneChecked = useDemoStore((state) => state.tasksDoneChecked)
  const role = useDemoStore((state) => state.role)
  const isCreator = role === 'creator'

  const descriptor: HeaderDescriptor = {
    headerType: 'caseWrapper',
    breadcrumb: [CASE_MANAGEMENT_BREADCRUMB, { label: PARENT_CASE.id, current: true }],
    title: {
      parts: ['VAT', 'Group Case', PARENT_CASE.reportingPeriod],
      // The Parent Case belongs to the Representative Legal Entity — not the parent
      // organisation or VAT group name — so that's what the info pill under the title shows.
      subtitle: PARENT_CASE.representativeEntity,
      // Same "compact code under subtitle" slot every other case header uses for a VAT/company
      // code (e.g. "DE999999") — here it's the Representative Legal Entity's VAT Registration.
      subCode: REPRESENTATIVE_VAT_REGISTRATION,
    },
    people: SAMPLE_PEOPLE,
    // Only the Creator may progress the Parent Case or reassign its people — everyone else
    // (Reviewer, Partner, Client) gets a read-only header, so the actions/edit link are simply
    // omitted from the descriptor rather than rendered-then-hidden.
    editable: isCreator,
    editTooltip: EDIT_TOOLTIP,
    actions: isCreator
      ? {
          // Same shape used for every other "Send for review" primary action in the prototype
          // (see config/headers.ts) — reused as-is, not a new action pattern.
          primary: { label: 'Send for review', icon: 'ArrowRight', iconSide: 'right', variant: 'default' },
        }
      : {},
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <HeaderRenderer descriptor={descriptor} primaryDisabled={!tasksDoneChecked} />
      <CasePhaseStepper currentPhase="inPreparation" process="vat" />

      <div className="flex flex-col gap-4 bg-muted/30 p-6">
        <div className="flex flex-col gap-3">
          <SectionLabel>Child cases in this case group</SectionLabel>
          <div className="flex flex-col gap-2">
            {PARENT_CASE.children.map((child) => {
              const config = CHILD_CONFIG[child.id]
              const status: WorkflowStatus = tasksDoneChecked ? 'ReadyForGroupCaseReview' : config.defaultStatus
              const isRepresentative = child.client === PARENT_CASE.representativeEntity

              return (
                <div
                  key={child.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {child.client}
                      {isRepresentative && (
                        <Badge variant="soft" tone="blue" size="sm">
                          Representative
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {child.serviceLine} · {child.caseType} · {child.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="soft" tone={config.requiresClientApproval ? 'orange' : 'gray'} size="sm">
                      {config.requiresClientApproval ? 'Client Approval step required' : 'Client Approval not required'}
                    </Badge>
                    <Badge variant="soft" tone={WORKFLOW_STATUS_TONE[status]} size="sm">
                      {WORKFLOW_STATUS_LABEL[status]}
                    </Badge>
                    <DueDate date={formatDate(child.statutoryDeadline)} label="Statutory Deadline" variant="gray" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
