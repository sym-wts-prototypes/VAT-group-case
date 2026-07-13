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

import { SectionLabel, TaskRow } from '@/components/body/BodyPlaceholder'
import { PackageBanner } from '@/components/body/PackageBanner'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
import { PeopleRow } from '@/components/headers/parts/PeopleRow'
import {
  packageBannerStateFromOutcome,
  type PackageBannerDescriptor,
  type PackageBannerState,
  type PackageReviewOutcome,
} from '@/config/packageBanners'
import { showTaskUploadButton, WTS_CASE_DEMO_SUBMISSION_DOCUMENTS, type TaskStatus } from '@/lib/caseTasks'
import { CASE_MANAGEMENT_BREADCRUMB, SAMPLE_PEOPLE } from '@/config/sampleData'
import { useDemoStore } from '@/store/useDemoStore'
import type { HeaderDescriptor, Phase, PeopleRow as PeopleRowData, Role } from '@/types'

import { formatDottedDate } from './case-generation'
import { ROLE_TO_PLAYGROUND_ROLE } from './case-management-page'
import { DataTablePagination } from './data-table-pagination'
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

// Same demo timestamp used throughout config/packageBanners.ts's own meta strings — kept in
// sync manually since this page's banners are a separate, group-adapted copy set.
const DEMO_TIMESTAMP = '12 Mar 2026, 13:55'
const CLIENT_NAMES = Array.isArray(SAMPLE_PEOPLE.client) ? SAMPLE_PEOPLE.client.join(', ') : (SAMPLE_PEOPLE.client ?? 'the client')

// Client's own Client Approval banner — varies by package review outcome exactly like the
// single-case Client's own Client Approval banner (see config/packageBanners.ts's
// clientApproval:client:* entries, which this copy is taken from verbatim): purple while
// awaiting a decision, amber once changes are requested, green once approved — only the header
// button changes per status (see the header-actions logic below).
const CLIENT_APPROVAL_BANNERS: Partial<Record<PackageBannerState, PackageBannerDescriptor>> = {
  requested: {
    variant: 'purple',
    icon: 'fileText',
    title: 'Awaiting your approval',
    description: 'A package has been submitted for your sign-off. Please review the contents and approve or request changes.',
    meta: `Review requested by ${SAMPLE_PEOPLE.creator} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
  },
  needChanges: {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested',
    description: "You've sent your feedback to the team. They'll update the package and resubmit for your approval.",
    meta: `Changes requested by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  approved: {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved',
    description: 'You approved this package. The team will now submit it to the tax authorities.',
    meta: `Approved by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
}

// In Review / Client Approval — mirrors the single-case flow's own PackageBanner copy per
// (role, package status) exactly where the ticket calls for verbatim reuse (Reviewer/Partner's
// needChanges/approved decision states, all of Client Approval), and adapts only the "sent"
// copy to name the Group Case package explicitly. Partner falls back to Creator's own copy
// (informational, non-decision-maker in both phases, same as the single-case flow).
type ParentBannerKey = `${'inReview' | 'clientApproval'}:${'creator' | 'reviewer'}:${PackageBannerState}`
const PARENT_BANNERS: Partial<Record<ParentBannerKey, PackageBannerDescriptor>> = {
  'inReview:creator:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Group Case package sent for internal review.',
    description: "The consolidated Group Case package is with the reviewer. You'll be notified once a decision is made.",
    meta: `Review requested by you · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
  },
  'inReview:creator:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by reviewer',
    description: 'The reviewer has left feedback. Review the comments, update the package, and resubmit.',
    meta: 'Changes requested',
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },
  'inReview:creator:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by reviewer',
    description: 'The package passed internal review. You can now send it to the client for approval.',
    meta: 'Approved',
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },
  'inReview:reviewer:requested': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Group Case package awaiting your review.',
    description:
      'The consolidated Group Case package has been submitted for your review. Open it, check the contents, and approve or request changes.',
    meta: 'Awaiting review',
    showFooter: true,
    showVersionHistory: false,
  },
  'inReview:reviewer:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested',
    description: "You've sent your feedback to the creator. They'll update the package and resubmit for your review.",
    meta: 'Changes requested',
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'inReview:reviewer:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved',
    description: 'You approved this package. The creator can now send it to the client for approval.',
    meta: 'Approved',
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'clientApproval:creator:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description: "Your package is with the client for approval. You'll be notified once they respond.",
    meta: 'Sent for client approval',
    showFooter: true,
    showVersionHistory: false,
  },
  'clientApproval:creator:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description: 'The client has left feedback. Review their comments, update the package, and resubmit for approval.',
    meta: 'Changes requested',
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:creator:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description: 'The client has signed off. You can now submit the package to the tax authorities.',
    meta: 'Approved',
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:reviewer:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description: "The package is with the client for approval. You'll be notified once they respond.",
    meta: `Request sent to ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
  },
  'clientApproval:reviewer:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description: 'The client has left feedback. The creator will update the package and resubmit for consolidation.',
    meta: `Changes requested by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:reviewer:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description: 'The client has signed off. The package can be submitted to the tax authorities.',
    meta: `Approved by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: false,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
}

function resolveParentBanner(
  phase: 'inReview' | 'clientApproval',
  role: Role,
  packageReviewOutcome: PackageReviewOutcome,
): PackageBannerDescriptor | undefined {
  const bannerRole = role === 'reviewer' ? 'reviewer' : 'creator'
  const state = packageBannerStateFromOutcome(phase, bannerRole, packageReviewOutcome)
  return PARENT_BANNERS[`${phase}:${bannerRole}:${state}`]
}

const PARENT_SUBMITTED_BANNER: PackageBannerDescriptor = {
  variant: 'blue',
  icon: 'hourglass',
  title: 'Group Case submitted to tax authorities',
  description: 'Filed successfully. The consolidated package has been submitted for this VAT Group.',
  meta: 'Submitted',
  showFooter: true,
  showVersionHistory: false,
}

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
// above. Consolidation used to be its own step here, sitting between In Preparation and In
// Review; it's now a task inside In Preparation instead (see the Consolidation TaskRow further
// below), so this stepper matches the single-case one exactly. Client Approval/Submission stay
// visible as the case's eventual remaining steps, same as the single-case stepper always shows
// the full journey rather than only what's implemented so far.
type ParentPhase = 'inPreparation' | 'inReview' | 'clientApproval' | 'submitted'
const PARENT_STEPPER_LABELS = ['In Preparation', 'In Review', 'Client Approval', 'Submission']
const PARENT_PHASE_INDEX: Record<ParentPhase, number> = {
  inPreparation: 0,
  inReview: 1,
  clientApproval: 2,
  submitted: 3,
}

function parentStepperStates(phase: ParentPhase): { label: string; state: StepperStepState }[] {
  const activeIndex = PARENT_PHASE_INDEX[phase]
  // Submission is shown as already-finished the instant it's reached — the tax authority
  // submission itself is what "Submission" represents, and that's already done by this point.
  if (phase === 'submitted') {
    return PARENT_STEPPER_LABELS.map((label) => ({ label, state: 'finished' as StepperStepState }))
  }
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

// Fixed-width stepper AND pill columns so both line up across rows regardless of a row's step
// count (3 vs 4) or pill label length ("In Review" vs "Ready for Consolidation") — an `auto`
// column here would resize per-row, which in turn shifts how much space is left for the
// 1fr name column and moves the stepper's own start position row to row.
const ROW_GRID_COLS = 'grid-cols-[minmax(0,1fr)_104px_168px]'
// In Preparation shows the full, actionable list (5/page); every later stage re-adds it as a
// simplified, view-only reference (3/page) — see Feature 8's "re-add child case list" note.
const CHILD_PAGE_SIZE = 5
const CHILD_PAGE_SIZE_LATER_STAGES = 3

export function ParentVatGroupCasePage() {
  // Reuses the existing Playground "Tasks Done" checkbox (see ControlPanel.tsx) as the single
  // demo lever for "every Child Case is ready" — same control, same behaviour pattern already
  // used to gate "Send for review" on every other case page in this prototype.
  const tasksDoneChecked = useDemoStore((state) => state.tasksDoneChecked)
  const role = useDemoStore((state) => state.role)
  const phase = useDemoStore((state) => state.phase)
  const packageReviewOutcome = useDemoStore((state) => state.packageReviewOutcome)
  const setCaseKind = useDemoStore((state) => state.setCaseKind)
  const setGroupCaseView = useDemoStore((state) => state.setGroupCaseView)
  const setPhase = useDemoStore((state) => state.setPhase)
  const setChildCaseRequiresClientApproval = useDemoStore((state) => state.setChildCaseRequiresClientApproval)
  const isCreator = role === 'creator'
  const isReviewer = role === 'reviewer'
  const isClient = role === 'client'
  const [deniedChild, setDeniedChild] = useState<Case | null>(null)
  const [childSearch, setChildSearch] = useState('')
  const [childPage, setChildPage] = useState(1)
  // Driven by the Playground's own global Phase control (see ControlPanel.tsx's
  // PARENT_CASE_PHASES) rather than local state, so the PHASE radio buttons can manually
  // trigger/render each step exactly like every other case page in this prototype.
  const parentPhase: ParentPhase = phase in PARENT_PHASE_INDEX ? (phase as ParentPhase) : 'inPreparation'
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  // Same lever used to move every Child Case to "Ready for Consolidation" at once (see the
  // status computation below) — reused here as "all Child Cases are ready" for the gate.
  const allChildrenReady = tasksDoneChecked

  // Mirrors the single-case flow's own "Changes requested" reset (see caseTasks.ts's
  // isNeedChangesWorkflowReset/effectiveCaseWorkflowPhase): once changes are requested during
  // In Review or Client Approval, EVERY viewer's stepper visually reverts to In Preparation —
  // the underlying phase state doesn't actually change, this only affects what's displayed (the
  // single-case system doesn't gate this reset by role either, only the header actions differ).
  const isNeedChangesReset =
    (parentPhase === 'inReview' || parentPhase === 'clientApproval') && packageReviewOutcome === 'needChanges'
  const displayedParentPhase: ParentPhase = isNeedChangesReset ? 'inPreparation' : parentPhase

  // Client sees the same child-case list the Creator/Reviewer see In Preparation — full page
  // size, real per-child status — all the way through In Review (Feature 10); Client Approval
  // switches to the simplified, paginated, all-green reference list instead (Feature 11.1), same
  // as every other role from In Review onward.
  const isFullChildList = parentPhase === 'inPreparation' || (isClient && parentPhase === 'inReview')
  const showChildList =
    isFullChildList ||
    ((isCreator || isReviewer) &&
      (parentPhase === 'inReview' || parentPhase === 'clientApproval' || parentPhase === 'submitted')) ||
    (isClient && (parentPhase === 'clientApproval' || parentPhase === 'submitted'))
  const childPageSize = isFullChildList ? CHILD_PAGE_SIZE : CHILD_PAGE_SIZE_LATER_STAGES
  // From In Review onward every Child Case has already been confirmed ready — the later-stage
  // list is a simplified, view-only reference, not the actionable In Preparation list.
  const forcedChildStatus: WorkflowStatus | undefined = isFullChildList ? undefined : 'ReadyForConsolidation'

  // The Consolidation task (folded into In Preparation, see the "Merge Consolidation Step into
  // In Preparation" ticket) — gated behind every Child Case being ready (Feature 4.4): not
  // started at all until then, in progress once the Creator can act but hasn't uploaded yet, and
  // done once they have (reusing `uploadedFileName`, the same state that used to gate the old
  // standalone Consolidation step's own primary action).
  const consolidationTaskStatus: TaskStatus = !allChildrenReady
    ? 'notStarted'
    : uploadedFileName
      ? 'done'
      : 'inProgress'

  // Live, case-insensitive substring match against the Legal Entity name (`client`) — same
  // pattern as the VAT Scheduler's "Search legal entities…" filter (vat-scheduler-modal.tsx).
  // Filtering never mutates PARENT_CASE.children, just narrows what's rendered below.
  const visibleChildren = useMemo(() => {
    const q = childSearch.trim().toLowerCase()
    if (!q) return PARENT_CASE.children
    return PARENT_CASE.children.filter((child) => child.client.toLowerCase().includes(q))
  }, [childSearch])

  const childTotalPages = Math.max(1, Math.ceil(visibleChildren.length / childPageSize))
  const childCurrentPage = Math.min(childPage, childTotalPages)
  const pagedChildren = useMemo(
    () => visibleChildren.slice((childCurrentPage - 1) * childPageSize, childCurrentPage * childPageSize),
    [visibleChildren, childCurrentPage, childPageSize],
  )

  // Opens a Child Case exactly like the existing Group + Child Case dispatch — using whichever
  // role is currently selected in the Playground and the workflow stage the case is currently
  // in, and telling the dispatch whether this Legal Entity's workflow includes Client Approval
  // (so the stepper and the Playground's Phase options reflect the right variant). Access is
  // modelled the same way the rest of this prototype models "my role" on a case: if the
  // currently selected role doesn't match the case's assigned role, there's no access — clicking
  // surfaces the "No access" banner at the top of the list instead of navigating (see the render
  // below); every row stays clickable regardless, only the result of the click differs.
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

  // Resolved once and reused by both the header actions below and the body banners further
  // down — same (phase, role, outcome) → state mapping the single-case flow itself uses.
  const creatorInReviewState = packageBannerStateFromOutcome('inReview', 'creator', packageReviewOutcome)
  const reviewerInReviewState = packageBannerStateFromOutcome('inReview', 'reviewer', packageReviewOutcome)
  const creatorClientApprovalState = packageBannerStateFromOutcome('clientApproval', 'creator', packageReviewOutcome)
  const clientClientApprovalState = packageBannerStateFromOutcome('clientApproval', 'client', packageReviewOutcome)

  let actions: HeaderDescriptor['actions'] = {}
  let primaryDisabled = false
  let handlePrimaryClick = () => {}

  if (parentPhase === 'inPreparation') {
    if (isCreator) {
      // Consolidation is now a task inside this same step (Feature 4.2) rather than its own
      // step — so this button only ever does one thing: enable once that task is Done (i.e. a
      // file has been uploaded), and move straight on to In Review (Feature 4.5).
      actions = { primary: { label: 'Send for review', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
      primaryDisabled = !uploadedFileName
      handlePrimaryClick = () => {
        if (uploadedFileName) setPhase('inReview')
      }
    }
  } else if (parentPhase === 'inReview') {
    if (isCreator) {
      // No "Requirements" button here anymore (Feature 3) — a package-status-dependent primary
      // action instead (Feature 5), same "back to In Preparation" reset a needChanges decision
      // triggers everywhere else in this page.
      if (creatorInReviewState === 'approved') {
        actions = { primary: { label: 'Send for approval', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
        handlePrimaryClick = () => setPhase('clientApproval')
      } else if (creatorInReviewState === 'needChanges') {
        actions = { primary: { label: 'Send for review', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
        handlePrimaryClick = () => {
          setUploadedFileName(null)
          setPhase('inPreparation')
        }
      } else {
        actions = { primary: { label: 'Send for approval', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
        primaryDisabled = true
      }
    } else if (isReviewer) {
      // Same primary action the single-case VAT Reviewer sees in In Review — removed entirely
      // once approved (Feature 6), disabled (but still visible) once changes are requested.
      if (reviewerInReviewState !== 'approved') {
        actions = { primary: { label: 'Submit review', icon: 'Check', iconSide: 'right', variant: 'default' } }
        primaryDisabled = reviewerInReviewState === 'needChanges'
      }
    }
  } else if (parentPhase === 'clientApproval') {
    if (isCreator) {
      // Same button the single-case Creator sees at Client Approval — disabled until the
      // client's decision is "Approved"; replaced entirely by a reset back to In Preparation
      // (Consolidation task included) once changes are requested (Feature 7), same reset
      // pattern as In Review's own needChanges.
      if (creatorClientApprovalState === 'needChanges') {
        actions = { primary: { label: 'Send for review', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
        handlePrimaryClick = () => {
          setUploadedFileName(null)
          setPhase('inPreparation')
        }
      } else {
        actions = { primary: { label: 'Submit to tax authorities', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
        primaryDisabled = creatorClientApprovalState !== 'approved'
        handlePrimaryClick = () => {
          if (creatorClientApprovalState === 'approved') setPhase('submitted')
        }
      }
    } else if (isClient) {
      // Client is the actual decision-maker at this stage (Feature 11.1) — "Submit review"
      // while awaiting a decision, "Submit changes" (disabled) once they've requested changes,
      // no button at all once already approved.
      if (clientClientApprovalState === 'requested') {
        actions = { primary: { label: 'Submit review', icon: 'Check', iconSide: 'right', variant: 'default' } }
      } else if (clientClientApprovalState === 'needChanges') {
        actions = { primary: { label: 'Submit changes', icon: 'Check', iconSide: 'right', variant: 'default' } }
        primaryDisabled = true
      }
    }
  } else if (parentPhase === 'submitted' && isCreator) {
    // Same as the single-case VAT Creator at Submission — no-op here, happy path only.
    actions = { primary: { label: 'Create correction', icon: 'Plus', iconSide: 'left', variant: 'default' } }
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
    actions,
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <HeaderRenderer descriptor={descriptor} primaryDisabled={primaryDisabled} onPrimaryClick={handlePrimaryClick} />
      {/* Client never sees the step-by-step progress bar (Feature 11.3) — In Preparation and In
          Review are the same child-list view for Client; only Client Approval and Submission
          have distinct Client-facing content. */}
      {!isClient && (
        <div className="border-b border-border bg-background px-6 py-6">
          <Stepper steps={parentStepperStates(displayedParentPhase)} />
        </div>
      )}

      {/* Consolidation task — folded into In Preparation (see the "Merge Consolidation Step
          into In Preparation" ticket) instead of being its own step. Gated behind every Child
          Case being ready (Feature 4.4): the Creator can only upload once `allChildrenReady`,
          and the top-right "Send for review" button only enables once this task is Done
          (Feature 4.5). Reviewer/Partner get the same card read-only (no upload button); Client
          doesn't see it at all, consistent with every other WTS-team-only element on this page. */}
      {parentPhase === 'inPreparation' && !isClient && (
        <div className="flex flex-col gap-3 border-b border-border bg-background px-6 py-6">
          <SectionLabel>Tasks</SectionLabel>
          <TaskRow
            title="Consolidation"
            status={consolidationTaskStatus}
            showUpload={isCreator && allChildrenReady}
            showStatus
            showStatusDropdown={false}
            files={uploadedFileName ? [uploadedFileName] : []}
            onUploadFile={isCreator && allChildrenReady ? setUploadedFileName : undefined}
          />
        </div>
      )}

      {/* In Review reuses the single case's own per-(role, package status) banner copy for
          every role including Reviewer now (no task-checklist body here anymore — Feature 4);
          Client doesn't see this step at all (Feature 10 — same child list as In Preparation
          instead). Client Approval reuses the same banner system for Creator/Reviewer/Partner;
          Client gets its own dedicated banner further below. Submission stays a single static
          banner (no review-outcome branching at that terminal stage). */}
      {((parentPhase === 'inReview' && !isClient) || (parentPhase === 'clientApproval' && !isClient)) &&
        resolveParentBanner(parentPhase, role, packageReviewOutcome) && (
          <div className="border-b border-border bg-background px-6 py-6">
            <PackageBanner
              descriptor={resolveParentBanner(parentPhase, role, packageReviewOutcome)!}
              packageFileName={`${PARENT_CASE.vatGroupName.replace(/\s+/g, '_')}_${PARENT_CASE.reportingPeriod.replace(/\s+/g, '_')}_Package.zip`}
              hideVersionHistory
            />
          </div>
        )}

      {parentPhase === 'clientApproval' && isClient && CLIENT_APPROVAL_BANNERS[clientClientApprovalState] && (
        <div className="border-b border-border bg-background px-6 py-6">
          <PackageBanner
            descriptor={CLIENT_APPROVAL_BANNERS[clientClientApprovalState]!}
            packageFileName={`${PARENT_CASE.vatGroupName.replace(/\s+/g, '_')}_${PARENT_CASE.reportingPeriod.replace(/\s+/g, '_')}_Package.zip`}
            hideVersionHistory
          />
        </div>
      )}

      {parentPhase === 'submitted' && (
        <div className="border-b border-border bg-background px-6 py-6">
          <PackageBanner
            descriptor={PARENT_SUBMITTED_BANNER}
            packageFileName={`${PARENT_CASE.vatGroupName.replace(/\s+/g, '_')}_${PARENT_CASE.reportingPeriod.replace(/\s+/g, '_')}_Package.zip`}
            hideVersionHistory
          />
        </div>
      )}

      {/* Submission confirmation — the same two documents the single-case Submission step
          shows, added here for Creator and Reviewer (Partner too, view-only like Reviewer);
          Client doesn't see this, consistent with every other WTS-team-only element on this
          page. Creator can upload to both (showTaskUploadButton already gates this exactly the
          same way the single-case flow does); Reviewer/Partner get a read-only version. */}
      {parentPhase === 'submitted' && !isClient && (
        <div className="flex flex-col gap-3 border-b border-border bg-background px-6 py-6">
          <SectionLabel>Submission confirmation</SectionLabel>
          <div className="flex flex-col gap-2">
            {WTS_CASE_DEMO_SUBMISSION_DOCUMENTS.map((doc) => (
              <TaskRow
                key={doc.id}
                title={doc.title}
                status="notStarted"
                showUpload={showTaskUploadButton('vat', role)}
                showStatus={false}
                showStatusDropdown={false}
                files={[]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Child Case list: the full, actionable version during In Preparation; a simplified,
          view-only reference (3/page, every case already Ready for Consolidation) on every
          later stage, for Creator and Reviewer only (Feature 8 — this re-adds what an earlier
          ticket had removed from these later stages). */}
      {showChildList && (
      <div className="flex flex-col gap-4 bg-muted/30 p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Child cases in this case group</SectionLabel>
            <div className="relative w-56 shrink-0">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={childSearch}
                onChange={(e) => {
                  setChildSearch(e.target.value)
                  setChildPage(1)
                }}
                placeholder="Search by legal entity name"
                className="h-8 pl-8"
              />
            </div>
          </div>

          {/* Click-triggered, not persistent: only appears after clicking a Child Case the
              current role can't open, at the top of the list — not shown by default, and not
              inline on the row itself. Same contact-names copy as before, just relocated. */}
          {deniedChild && (
            <Alert variant="warning" title="No access" onClose={() => setDeniedChild(null)}>
              You don't have access. For access, contact {CHILD_PEOPLE[deniedChild.id]?.reviewer},{' '}
              {CHILD_PEOPLE[deniedChild.id]?.creator}.
            </Alert>
          )}

          {visibleChildren.length === 0 && (
            <p className="py-10 text-center text-muted-foreground text-sm">
              No results found. Try a different search term.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {pagedChildren.map((child) => {
              const config = CHILD_CONFIG[child.id]
              const status: WorkflowStatus = forcedChildStatus ?? (tasksDoneChecked ? 'ReadyForConsolidation' : config.defaultStatus)
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
                      <span className="truncate text-xs text-muted-foreground">{child.id}</span>
                    </div>

                    {config.requiresClientApproval ? (
                      <div className="w-full">{stepper}</div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full">{stepper}</div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">{SKIPPED_APPROVAL_TOOLTIP}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <Badge variant="soft" tone={WORKFLOW_STATUS_BADGE_TONE[status]} size="sm" className="w-fit justify-self-start">
                      {WORKFLOW_STATUS_LABEL[status]}
                    </Badge>
                  </div>

                  {/* Read-only — who's assigned to this Legal Entity's case, visible regardless
                      of whether the current role can open it (Part 1 of the ticket). */}
                  <PeopleRow people={CHILD_PEOPLE[child.id]} className="border-t border-border pt-3" />
                </div>
              )
            })}
          </div>

          <DataTablePagination
            page={childCurrentPage}
            totalPages={childTotalPages}
            onPageChange={setChildPage}
            className="flex justify-end border-t border-border pt-3"
          />
        </div>
      </div>
      )}
    </div>
  )
}
