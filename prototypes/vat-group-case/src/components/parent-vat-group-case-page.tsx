import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import {
  Alert,
  Badge,
  cn,
  Input,
  MiniStepper,
  Stepper,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type BadgeTone,
  type MiniStepperStepState,
  type StepperStepState,
} from '@wts/ui'

import { CaseWtsTasksBody, SectionLabel } from '@/components/body/BodyPlaceholder'
import { FileDropzone } from '@/components/body/FileDropzone'
import { PackageBanner } from '@/components/body/PackageBanner'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
import { PeopleRow } from '@/components/headers/parts/PeopleRow'
import type { PackageBannerDescriptor } from '@/config/packageBanners'
import { CASE_MANAGEMENT_BREADCRUMB, SAMPLE_PEOPLE } from '@/config/sampleData'
import { useDemoStore } from '@/store/useDemoStore'
import type { HeaderDescriptor, Phase, PeopleRow as PeopleRowData } from '@/types'

import { formatDottedDate } from './case-generation'
import { ROLE_TO_PLAYGROUND_ROLE, RowActions } from './case-management-page'
import { DUMMY_GROUP_CASES, type Case } from './case-management-data'
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

const EDIT_TOOLTIP =
  "Changes made here apply only to the Parent Case. Assigned users will also be assigned to the Representative Legal Entity's Child Case, but not to the Child Cases of the other Legal Entities in the group."

// Adapted from the existing PackageBanner used for a single case's joined file (see
// config/packageBanners.ts / BodyPlaceholder.tsx) — same component, just describing a
// multi-file group package instead of one case's own generated package.
const GROUP_PACKAGE_DESCRIPTOR = (childCount: number): PackageBannerDescriptor => ({
  variant: 'blue',
  icon: 'fileText',
  title: 'Group Case Package',
  description: `A single downloadable bundle of the "Ready for Consolidation" files from all ${childCount} Child Cases in this group.`,
  meta: `${childCount} files`,
  showFooter: true,
  showVersionHistory: false,
})

const SKIPPED_APPROVAL_TOOLTIP =
  'Client Approval has been intentionally skipped for this Legal Entity — its workflow has one fewer step.'

// Each Child Case's workflow status — independent of whether it requires Client Approval at
// all (a case that skips it just uses a 3-step progression instead of 4, see STEPS_* below).
type WorkflowStatus = 'InPreparation' | 'InReview' | 'ClientApproval' | 'ReadyForConsolidation'

const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  InPreparation: 'In Preparation',
  InReview: 'In Review',
  ClientApproval: 'Client Approval',
  ReadyForConsolidation: 'Ready for Consolidation',
}

// Current-step pill color, by stage: In Preparation is blue, every intermediate stage (In
// Review, Client Approval) is yellow, and the final stage is green — independent of the
// MiniStepper dots' own finished/inProgress palette just to the pill's left.
const WORKFLOW_STATUS_BADGE_TONE: Record<WorkflowStatus, BadgeTone> = {
  InPreparation: 'blue',
  InReview: 'orange',
  ClientApproval: 'orange',
  ReadyForConsolidation: 'green',
}

// Where clicking a Child Case lands in the normal case dispatch — mirrors
// case-management-page.tsx's STATUS_TO_PHASE, extended with the Parent-Case-only terminal
// status (closest real workflow equivalent: the child's own work is done, i.e. submitted).
const WORKFLOW_STATUS_TO_PHASE: Record<WorkflowStatus, Phase> = {
  InPreparation: 'inPreparation',
  InReview: 'inReview',
  ClientApproval: 'clientApproval',
  ReadyForConsolidation: 'submitted',
}

// A Child Case's full progression when Client Approval applies, vs. the shorter one when it
// doesn't — the step is omitted outright rather than shown disabled (Part 2 of the "Playground
// Improvements & Parent Case Child Case Progress View" ticket).
const STEPS_WITH_APPROVAL: WorkflowStatus[] = ['InPreparation', 'InReview', 'ClientApproval', 'ReadyForConsolidation']
const STEPS_WITHOUT_APPROVAL: WorkflowStatus[] = ['InPreparation', 'InReview', 'ReadyForConsolidation']

function miniStepperStates(steps: WorkflowStatus[], current: WorkflowStatus): MiniStepperStepState[] {
  const activeIndex = steps.indexOf(current)
  const isLast = activeIndex === steps.length - 1
  return steps.map((_, i) => {
    if (i < activeIndex) return 'finished'
    if (i === activeIndex) return isLast ? 'finished' : 'inProgress'
    return 'notStarted'
  })
}

// The Parent Case's own top-of-page workflow — distinct from the per-Child-Case WorkflowStatus
// above. "Consolidation" only exists on this page: it sits after In Preparation (once every
// Child Case is Ready for Consolidation) and before In Review, where the reviewer takes over —
// Client Approval/Submission stay visible as the case's eventual remaining steps, same as the
// single-case stepper always shows the full journey rather than only what's implemented so far.
type ParentPhase = 'inPreparation' | 'consolidation' | 'inReview'
const PARENT_STEPPER_LABELS = ['In Preparation', 'Consolidation', 'In Review', 'Client Approval', 'Submission']
const PARENT_PHASE_INDEX: Record<ParentPhase, number> = { inPreparation: 0, consolidation: 1, inReview: 2 }

function parentStepperStates(phase: ParentPhase): { label: string; state: StepperStepState }[] {
  const activeIndex = PARENT_PHASE_INDEX[phase]
  return PARENT_STEPPER_LABELS.map((label, i) => ({
    label,
    state: i < activeIndex ? 'finished' : i === activeIndex ? 'inProgress' : 'notStarted',
  }))
}

// Static per-entity demo config, keyed by the dummy case's own child id: whether that legal
// entity requires a Client Approval step, and which workflow status it shows before "Tasks
// done" is checked. Deliberately varied so the page demonstrates every status this iteration
// supports, including a case that never goes through Client Approval at all. The fourth entry
// (EUROPIPE France, see case-management-data.ts) is the reference example for the "click a
// Child Case to open it" flow — Creator already has access and it skips Client Approval, so
// opening it always succeeds.
// [requiresClientApproval, defaultStatus] per Child Case, in the same order as PARENT_CASE's
// children — alternates through every combination this page supports so the ~20-row list (see
// case-management-data.ts's DE_VAT_GROUP_MEMBERS) exercises every stepper/tooltip variant.
const CHILD_CONFIG_BY_INDEX: Array<[boolean, WorkflowStatus]> = [
  [true, 'InPreparation'],
  [true, 'ClientApproval'],
  [false, 'InReview'],
  [false, 'InPreparation'],
  [true, 'ClientApproval'],
  [false, 'InReview'],
  [true, 'InPreparation'],
  [false, 'InPreparation'],
  [true, 'ClientApproval'],
  [false, 'InReview'],
  [true, 'InPreparation'],
  [false, 'InPreparation'],
  [true, 'ClientApproval'],
  [false, 'InReview'],
  [true, 'InPreparation'],
  [false, 'InPreparation'],
  [true, 'ClientApproval'],
  [false, 'InReview'],
  [true, 'InPreparation'],
  [false, 'InPreparation'],
]

const CHILD_CONFIG: Record<string, { requiresClientApproval: boolean; defaultStatus: WorkflowStatus }> =
  Object.fromEntries(
    PARENT_CASE.children.map((child, index) => {
      const [requiresClientApproval, defaultStatus] = CHILD_CONFIG_BY_INDEX[index % CHILD_CONFIG_BY_INDEX.length]
      return [child.id, { requiresClientApproval, defaultStatus }]
    }),
  )

// Who's assigned to each Child Case — informational only (Part 1 of the "Child Case
// Responsibility, Access Messaging & Workflow Variants" ticket): always visible regardless of
// whether the current role can open that case, and reused for the access-denied message below
// (Part 2) so it can point at the actual Creator/Reviewer instead of a generic instruction.
// Creator/Reviewer line up with each child's existing `myRole`/`latestActivity.actor`.
// Rotates through the same 8-person demo directory every other Create Case flow in this
// prototype uses (see vat-scheduler-modal.tsx's DUMMY_USERS) — partner is omitted on every
// third row, matching how the original 4 rows had 3 with a Partner and 1 without.
const CHILD_PEOPLE_CREATORS = ['Maria Fischer', 'Sophie Martin', 'Oscar Wilson', 'Lucas Brown']
const CHILD_PEOPLE_REVIEWERS = ['Jordan Miller', 'Olivia Taylor', 'Noah Davis']
const CHILD_PEOPLE_CLIENTS = ['Emma Johnson', 'Noah Davis', 'Oscar Wilson']

const CHILD_PEOPLE: Record<string, PeopleRowData> = Object.fromEntries(
  PARENT_CASE.children.map((child, index) => [
    child.id,
    {
      creator: CHILD_PEOPLE_CREATORS[index % CHILD_PEOPLE_CREATORS.length],
      reviewer: CHILD_PEOPLE_REVIEWERS[index % CHILD_PEOPLE_REVIEWERS.length],
      ...(index % 3 !== 2 ? { partner: CHILD_PEOPLE_CREATORS[(index + 1) % CHILD_PEOPLE_CREATORS.length] } : {}),
      client: CHILD_PEOPLE_CLIENTS[index % CHILD_PEOPLE_CLIENTS.length],
    },
  ]),
)

// Fixed-width stepper column so it lines up across rows regardless of a row's step count (3 vs
// 4) — the status pill and name column both size to content, so this is the only column that
// needs pinning.
const ROW_GRID_COLS = 'grid-cols-[minmax(0,1fr)_104px_auto_auto]'

export function ParentVatGroupCasePage() {
  // Reuses the existing Playground "Tasks Done" checkbox (see ControlPanel.tsx) as the single
  // demo lever for "every Child Case is ready" — same control, same behaviour pattern already
  // used to gate "Send for review" on every other case page in this prototype.
  const tasksDoneChecked = useDemoStore((state) => state.tasksDoneChecked)
  const role = useDemoStore((state) => state.role)
  const setCaseKind = useDemoStore((state) => state.setCaseKind)
  const setGroupCaseView = useDemoStore((state) => state.setGroupCaseView)
  const setPhase = useDemoStore((state) => state.setPhase)
  const setChildCaseRequiresClientApproval = useDemoStore((state) => state.setChildCaseRequiresClientApproval)
  const isCreator = role === 'creator'
  const [deniedChild, setDeniedChild] = useState<Case | null>(null)
  const [childSearch, setChildSearch] = useState('')
  const [parentPhase, setParentPhase] = useState<ParentPhase>('inPreparation')
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  // Same lever used to move every Child Case to "Ready for Consolidation" at once (see the
  // status computation below) — reused here as "all Child Cases are ready" for the gate.
  const allChildrenReady = tasksDoneChecked

  // Live, case-insensitive substring match against the Legal Entity name (`client`) — same
  // pattern as the VAT Scheduler's "Search legal entities…" filter (vat-scheduler-modal.tsx).
  // Filtering never mutates PARENT_CASE.children, just narrows what's rendered below.
  const visibleChildren = useMemo(() => {
    const q = childSearch.trim().toLowerCase()
    if (!q) return PARENT_CASE.children
    return PARENT_CASE.children.filter((child) => child.client.toLowerCase().includes(q))
  }, [childSearch])

  // Opens a Child Case exactly like the existing Group + Child Case dispatch — using whichever
  // role is currently selected in the Playground and the workflow stage the case is currently
  // in, and telling the dispatch whether this Legal Entity's workflow includes Client Approval
  // (so the stepper and the Playground's Phase options reflect the right variant). Access is
  // modelled the same way the rest of this prototype models "my role" on a case: if the
  // currently selected role doesn't match the case's assigned role, there's no access.
  const openChildCase = (child: Case, status: WorkflowStatus, requiresClientApproval: boolean) => {
    if (ROLE_TO_PLAYGROUND_ROLE[child.myRole] !== role) {
      setDeniedChild(child)
      return
    }
    setDeniedChild(null)
    setCaseKind('group')
    setGroupCaseView('child')
    setPhase(WORKFLOW_STATUS_TO_PHASE[status])
    setChildCaseRequiresClientApproval(requiresClientApproval)
  }

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
    // Blue pill, same visual pattern as the Due Date pill on single (non-group) case headers —
    // just relabeled, since a VAT Group Case's deadline is the group's, not any one entity's.
    dueDate: formatDottedDate(PARENT_CASE.statutoryDeadline),
    dueDateLabel: 'Group Case Deadline',
    // Only the Creator may progress the Parent Case or reassign its people — everyone else
    // (Reviewer, Partner, Client) gets a read-only header, so the actions/edit link are simply
    // omitted from the descriptor rather than rendered-then-hidden.
    editable: isCreator,
    editTooltip: EDIT_TOOLTIP,
    actions:
      isCreator && parentPhase !== 'inReview'
        ? {
            // Same "Send for review"-shaped primary action every other case page in this
            // prototype uses — just relabeled per step: entering Consolidation, then leaving it.
            primary:
              parentPhase === 'inPreparation'
                ? { label: 'Send to Consolidation', icon: 'ArrowRight', iconSide: 'right', variant: 'default' }
                : { label: 'Send to Review', icon: 'ArrowRight', iconSide: 'right', variant: 'default' },
          }
        : role === 'reviewer' && parentPhase === 'inReview'
          ? {
              // Same primary action the single-case VAT Reviewer sees in In Review (see
              // config/headers.ts's vat.case.phases.inReview.reviewer) — the Reviewer's part
              // of this page mirrors the single-case flow exactly, not a group-specific variant.
              primary: { label: 'Submit review', icon: 'Check', iconSide: 'right', variant: 'default' },
            }
          : {},
  }

  const primaryDisabled = parentPhase === 'inPreparation' ? !allChildrenReady : !uploadedFileName
  const handlePrimaryClick = () => {
    if (parentPhase === 'inPreparation' && allChildrenReady) setParentPhase('consolidation')
    else if (parentPhase === 'consolidation' && uploadedFileName) setParentPhase('inReview')
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <HeaderRenderer descriptor={descriptor} primaryDisabled={primaryDisabled} onPrimaryClick={handlePrimaryClick} />
      <div className="border-b border-border bg-background px-6 py-6">
        <Stepper steps={parentStepperStates(parentPhase)} />
      </div>

      {parentPhase !== 'inPreparation' && (
        <div className="flex flex-col gap-4 border-b border-border bg-muted/30 p-6">
          <SectionLabel>Consolidation</SectionLabel>
          <PackageBanner
            descriptor={GROUP_PACKAGE_DESCRIPTOR(PARENT_CASE.children.length)}
            packageFileName={`${PARENT_CASE.vatGroupName.replace(/\s+/g, '_')}_${PARENT_CASE.reportingPeriod.replace(/\s+/g, '_')}_Package.zip`}
            hideVersionHistory
          />
          {parentPhase === 'consolidation' && (
            <FileDropzone
              id="consolidation-document-upload"
              label="Upload consolidation document"
              onFileChange={setUploadedFileName}
            />
          )}
        </div>
      )}

      {parentPhase === 'inReview' && role === 'reviewer' && (
        <div className="border-b border-border bg-background px-6 py-6">
          <CaseWtsTasksBody
            process="vat"
            role="reviewer"
            phase="inReview"
            headerType="case"
            platform="wts"
            tasksDoneChecked
            approvedChecked={false}
            tasksReconfirmedDone={false}
            protocolConfirmationChecked={false}
            packageBannerState="sent"
            packageReviewOutcome="default"
          />
        </div>
      )}

      <div className="flex flex-col gap-4 bg-muted/30 p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Child cases in this case group</SectionLabel>
            <div className="relative w-56 shrink-0">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={childSearch}
                onChange={(e) => setChildSearch(e.target.value)}
                placeholder="Search by legal entity name"
                className="h-8 pl-8"
              />
            </div>
          </div>

          {deniedChild && (
            <Alert variant="warning" title="No access" onClose={() => setDeniedChild(null)}>
              You don't have access to {deniedChild.client}'s Child Case with the currently
              selected role. For updates on this case, contact{' '}
              {CHILD_PEOPLE[deniedChild.id]?.creator} (Creator) or{' '}
              {CHILD_PEOPLE[deniedChild.id]?.reviewer} (Reviewer).
            </Alert>
          )}

          {visibleChildren.length === 0 && (
            <p className="py-10 text-center text-muted-foreground text-sm">
              No legal entities match your search.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {visibleChildren.map((child) => {
              const config = CHILD_CONFIG[child.id]
              const status: WorkflowStatus = tasksDoneChecked ? 'ReadyForConsolidation' : config.defaultStatus
              const steps = config.requiresClientApproval ? STEPS_WITH_APPROVAL : STEPS_WITHOUT_APPROVAL
              const isRepresentative = child.client === PARENT_CASE.representativeEntity
              const stepper = <MiniStepper states={miniStepperStates(steps, status)} />

              const handleOpen = () => openChildCase(child, status, config.requiresClientApproval)

              return (
                <div
                  key={child.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleOpen}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    handleOpen()
                  }}
                  className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className={cn('grid items-center gap-4', ROW_GRID_COLS)}>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {child.client}
                        {isRepresentative && (
                          <Badge variant="soft" tone="blue" size="sm">
                            Representative
                          </Badge>
                        )}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {child.serviceLine} · {child.caseType} · {child.id}
                      </span>
                    </div>

                    {config.requiresClientApproval ? (
                      stepper
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-fit">{stepper}</div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">{SKIPPED_APPROVAL_TOOLTIP}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <Badge variant="soft" tone={WORKFLOW_STATUS_BADGE_TONE[status]} size="sm" className="justify-self-end">
                      {WORKFLOW_STATUS_LABEL[status]}
                    </Badge>

                    <RowActions id={child.id} onEdit={handleOpen} />
                  </div>

                  {/* Read-only — who's assigned to this Legal Entity's case, visible regardless
                      of whether the current role can open it (Part 1 of the ticket). */}
                  <PeopleRow people={CHILD_PEOPLE[child.id]} className="border-t border-border pt-3" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
