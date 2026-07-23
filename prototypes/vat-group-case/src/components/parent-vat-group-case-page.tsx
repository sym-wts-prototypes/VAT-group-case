import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, History, Search } from 'lucide-react'

import {
  Alert,
  Badge,
  Button,
  cn,
  Input,
  MiniStepper,
  Progress,
  Stepper,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type BadgeTone,
  type MiniStepperStepState,
  type StepperStepState,
} from '@wts/ui'

import { AssignedPeople, type AssignedPeopleData } from '@/components/assigned-people'
import { SectionLabel, TaskRow } from '@/components/body/BodyPlaceholder'
import { ConsolidationTaskCard, type ConsolidationUploadedFile } from '@/components/consolidation-task-card'
import { NeedsChangesReopenModal } from '@/components/needs-changes-reopen-modal'
import { PackageBanner } from '@/components/body/PackageBanner'
import { PackageVersionHistoryDrawer } from '@/components/package-version-history-drawer'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
import {
  packageBannerStateFromOutcome,
  type PackageBannerDescriptor,
  type PackageBannerState,
  type PackageReviewOutcome,
} from '@/config/packageBanners'
import { showTaskUploadButton, WTS_CASE_DEMO_SUBMISSION_DOCUMENTS } from '@/lib/caseTasks'
import { CASE_MANAGEMENT_BREADCRUMB, SAMPLE_PEOPLE } from '@/config/sampleData'
import { useDemoStore } from '@/store/useDemoStore'
import type { HeaderDescriptor, Phase, Role } from '@/types'

import { formatDottedDate } from './case-generation'
import { ROLE_TO_PLAYGROUND_ROLE } from './case-management-page'
import { DataTablePagination } from './data-table-pagination'
import { DUMMY_GROUP_CASES, type Case } from './case-management-data'
import { vatRegistrationForJurisdiction } from './org-details-data'
import { assignedPeopleForChildIndex, REPRESENTATIVE_ASSIGNEES } from './vat-group-case-assignees'

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
    showVersionHistory: true,
  },
  needChanges: {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested',
    description: "You've sent your feedback to the team. They'll update the package and resubmit for your approval.",
    meta: `Changes requested by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  approved: {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved',
    description: 'You approved this package. The team will now submit it to the tax authorities.',
    meta: `Approved by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: true,
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
    showVersionHistory: true,
  },
  'inReview:creator:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by reviewer',
    description: 'The reviewer has left feedback. Review the comments, update the package, and resubmit.',
    meta: 'Changes requested',
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },
  'inReview:creator:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by reviewer',
    description: 'The package passed internal review. You can now send it to the client for approval.',
    meta: 'Approved',
    showFooter: true,
    showVersionHistory: true,
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
    showVersionHistory: true,
  },
  'inReview:reviewer:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested',
    description: "You've sent your feedback to the creator. They'll update the package and resubmit for your review.",
    meta: 'Changes requested',
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'inReview:reviewer:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved',
    description: 'You approved this package. The creator can now send it to the client for approval.',
    meta: 'Approved',
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'clientApproval:creator:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description: "Your package is with the client for approval. You'll be notified once they respond.",
    meta: 'Sent for client approval',
    showFooter: true,
    showVersionHistory: true,
  },
  'clientApproval:creator:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description: 'The client has left feedback. Review their comments, update the package, and resubmit for approval.',
    meta: 'Changes requested',
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:creator:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description: 'The client has signed off. You can now submit the package to the tax authorities.',
    meta: 'Approved',
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:reviewer:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description: "The package is with the client for approval. You'll be notified once they respond.",
    meta: `Request sent to ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: true,
  },
  'clientApproval:reviewer:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description: 'The client has left feedback. The creator will update the package and resubmit for consolidation.',
    meta: `Changes requested by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:reviewer:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description: 'The client has signed off. The package can be submitted to the tax authorities.',
    meta: `Approved by ${CLIENT_NAMES} · ${DEMO_TIMESTAMP}`,
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
}

// Segment 3 of the "review-flow rework" ticket: every banner below ships with a static
// "This is a comment" placeholder for its `comments` field. At render time, that placeholder is
// replaced with whatever was actually written in the reopen modal — for the same phase, every
// role's banner reflects the same underlying decision, so one comment value covers all of them
// (Feature 1 of the "review-flow update batch" ticket: Creator, Reviewer, and Partner all read
// from the same `reviewComment` state). A blank/never-written comment renders an explicit empty
// state rather than hiding the row — the Creator still needs to know a comment section exists
// and simply wasn't used, not wonder whether one is missing.
function applyReviewComment(
  descriptor: PackageBannerDescriptor | undefined,
  comment: string | null,
): PackageBannerDescriptor | undefined {
  if (!descriptor?.comments) return descriptor
  return { ...descriptor, comments: { ...descriptor.comments, body: comment ?? 'No comment was left.' } }
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
  // Feature 4 of the "VAT-registration alignment" ticket adds Version history to every yellow/
  // purple review banner on this page — this terminal blue banner isn't one of those, so it
  // keeps its version history hidden same as before.
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
// children — alternates through every combination this page supports so the ~12-row list (see
// case-management-data.ts's DE_VAT_GROUP_MEMBERS) exercises every stepper/tooltip variant.
// A couple are seeded ReadyForConsolidation up front, within the first page (Segment 6) — so
// the "hide completed" filter's effect is visible immediately, without first ticking "Tasks
// Done" (which still forces every remaining one to ReadyForConsolidation, same as before).
const CHILD_CONFIG_BY_INDEX: Array<[boolean, WorkflowStatus]> = [
  [true, 'InPreparation'],
  [false, 'ReadyForConsolidation'],
  [false, 'InReview'],
  [false, 'InPreparation'],
  [true, 'ReadyForConsolidation'],
  [true, 'ClientApproval'],
  [false, 'InPreparation'],
  [true, 'ClientApproval'],
  [false, 'InPreparation'],
  [true, 'ReadyForConsolidation'],
  [false, 'InReview'],
  [false, 'InPreparation'],
]

const CHILD_CONFIG: Record<string, { requiresClientApproval: boolean; defaultStatus: WorkflowStatus }> =
  Object.fromEntries(
    PARENT_CASE.children.map((child, index) => {
      const [requiresClientApproval, defaultStatus] = CHILD_CONFIG_BY_INDEX[index % CHILD_CONFIG_BY_INDEX.length]
      return [child.id, { requiresClientApproval, defaultStatus }]
    }),
  )

// Feature 4 of the "reopen-modal NO-state copy" ticket — these two Child Cases always have
// access, bypassing the myRole/Playground-role dummy gate every other Child Case still uses.
// Keyed by legal-entity name (stable across the group) rather than case id (which is generated
// from a year/group-number suffix, not a fixed string).
const ALWAYS_ACCESSIBLE_CHILD_CLIENTS = new Set(['EUROPIPE Poland', 'EUROPIPE France'])

// Dummy prior Reviewer comment shown the first time one of the always-accessible Child Cases
// above is opened — seeded once into childCaseComments (see openChildCase) so it reads as
// already-written feedback rather than the generic placeholder every other reopened case uses.
const ALWAYS_ACCESSIBLE_CHILD_DEFAULT_COMMENT: Record<string, string> = {
  'EUROPIPE Poland': 'The input VAT breakdown for Q1 is missing supporting invoices — please attach them before resubmitting.',
  'EUROPIPE France': 'Intra-community supplies were reported net of a credit note that has not been reissued yet — please correct and resend.',
}

// Who's assigned to each Child Case — informational only (Part 1 of the "Child Case
// Responsibility, Access Messaging & Workflow Variants" ticket): always visible regardless of
// whether the current role can open that case. Sourced from EUROPIPE's real Organisation Users
// (see vat-group-case-assignees.ts) rather than the generic 8-person Create Case directory —
// index 0 (EUROPIPE GmbH, the Representative) always matches the Parent Case's own assignees
// exactly; every other child gets a different, only-minorly-overlapping profile.
const CHILD_ASSIGNED_PEOPLE: Record<string, AssignedPeopleData> = Object.fromEntries(
  PARENT_CASE.children.map((child, index) => [child.id, assignedPeopleForChildIndex(index)]),
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
  const setPackageReviewOutcome = useDemoStore((state) => state.setPackageReviewOutcome)
  const setRole = useDemoStore((state) => state.setRole)
  const reopenedChildCaseIds = useDemoStore((state) => state.reopenedChildCaseIds)
  const setCaseKind = useDemoStore((state) => state.setCaseKind)
  const setGroupCaseView = useDemoStore((state) => state.setGroupCaseView)
  const setPhase = useDemoStore((state) => state.setPhase)
  const setChildCaseRequiresClientApproval = useDemoStore((state) => state.setChildCaseRequiresClientApproval)
  const setReopenedChildCaseIds = useDemoStore((state) => state.setReopenedChildCaseIds)
  const setOpenChildCaseId = useDemoStore((state) => state.setOpenChildCaseId)
  const addChildCaseComments = useDemoStore((state) => state.addChildCaseComments)
  const childCaseComments = useDemoStore((state) => state.childCaseComments)
  const isCreator = role === 'creator'
  const isReviewer = role === 'reviewer'
  const isClient = role === 'client'
  const isPartner = role === 'partner'
  const [deniedChild, setDeniedChild] = useState<Case | null>(null)
  const [childSearch, setChildSearch] = useState('')
  const [childPage, setChildPage] = useState(1)
  // Feature 5 of the "review-flow update batch" ticket — off by default: the list shows every
  // Child Case, completed ones included. Hiding Ready-for-Consolidation cases is opt-in, toggled
  // on via the pill below.
  const [hideReadyChildren, setHideReadyChildren] = useState(false)
  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  // Segment 3 — the actual text written in the reopen modal's Comment field, replacing every
  // banner's dummy "This is a comment" placeholder (see applyReviewComment above). Represents
  // "whatever was written in the most recently confirmed decision" — null renders no comment
  // row at all, matching the field's own optional/blank-means-empty behaviour.
  const [reviewComment, setReviewComment] = useState<string | null>(null)
  // Segment 3 — which phase a "Need Changes" decision came from, so the Creator/Reviewer/
  // Partner still see the right "Changes requested by reviewer/client" copy + comment once the
  // Parent Case has already snapped back to In Preparation (handleReopenChildCases sets the
  // real phase there immediately, unlike the sidebar-only preview reset `isNeedChangesReset`
  // models below). Cleared implicitly once `reopenedChildCaseIds` empties out again.
  const [needsChangesSourcePhase, setNeedsChangesSourcePhase] = useState<'inReview' | 'clientApproval' | null>(null)
  // Driven by the Playground's own global Phase control (see ControlPanel.tsx's
  // PARENT_CASE_PHASES) rather than local state, so the PHASE radio buttons can manually
  // trigger/render each step exactly like every other case page in this prototype.
  const parentPhase: ParentPhase = phase in PARENT_PHASE_INDEX ? (phase as ParentPhase) : 'inPreparation'
  // Feature 5 of the "VAT-registration alignment" ticket — the Creator-uploaded consolidation
  // documents (any number, see consolidation-task-card.tsx) and the task's own manual Done
  // toggle, replacing the old single generated-file/uploadedFileName pair.
  const [uploadedFiles, setUploadedFiles] = useState<ConsolidationUploadedFile[]>([])
  const [isConsolidationDone, setIsConsolidationDone] = useState(false)
  // Feature 4 — shared by the Data Package element and every yellow/purple review banner below.
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  // Same lever used to move every Child Case to "Ready for Consolidation" at once (see the
  // status computation below) — reused here as "all Child Cases are ready" for the gate.
  // Segment 3 — a Reviewer/Client "Need Changes" reopen sends specific Child Cases back to In
  // Preparation regardless of this checkbox; the Parent Case can't be ready again until none
  // remain reopened (the checkbox alone isn't enough once something's been sent back).
  const allChildrenReady = tasksDoneChecked && reopenedChildCaseIds.length === 0

  // Mirrors the single-case flow's own "Changes requested" reset (see caseTasks.ts's
  // isNeedChangesWorkflowReset/effectiveCaseWorkflowPhase): once changes are requested during
  // In Review or Client Approval, EVERY viewer's stepper visually reverts to In Preparation —
  // the underlying phase state doesn't actually change, this only affects what's displayed (the
  // single-case system doesn't gate this reset by role either, only the header actions differ).
  const isNeedChangesReset =
    (parentPhase === 'inReview' || parentPhase === 'clientApproval') && packageReviewOutcome === 'needChanges'
  const displayedParentPhase: ParentPhase = isNeedChangesReset ? 'inPreparation' : parentPhase

  // Every time the Creator freshly lands back on In Preparation — whether by manually
  // navigating back from In Review (Segment 3 of the "In Progress Label & Return-State" ticket),
  // or via the Reviewer/Client's own "Need Changes" reset above (Segment 4) — the previously
  // uploaded consolidation document is cleared so the Creator is prompted to upload a fresh one,
  // same as the single-case flow already discards a stale package on a needChanges reset
  // elsewhere. Every Child Case stays Ready for Consolidation (nothing here unchecks
  // `tasksDoneChecked`), so the task falls straight back to "In Progress" rather than
  // "Not started".
  const prevDisplayedPhaseRef = useRef(displayedParentPhase)
  useEffect(() => {
    if (prevDisplayedPhaseRef.current !== 'inPreparation' && displayedParentPhase === 'inPreparation') {
      setUploadedFiles([])
      setIsConsolidationDone(false)
    }
    prevDisplayedPhaseRef.current = displayedParentPhase
  }, [displayedParentPhase])

  // Consolidation task visibility: real In Preparation shows it to Creator/Reviewer/Partner as
  // before (unchanged). During the Reviewer/Client "Need Changes" visual reset, though, only the
  // Creator additionally sees it — the Reviewer's own page during that same reset is already
  // correct as-is (see the "Creator In Progress Task Element on Needs Changes / Client Return"
  // ticket) and must not gain a task card it didn't have before. Client never sees this task,
  // consistent with every other WTS-team-only element on this page.
  const showConsolidationTask = !isClient && (parentPhase === 'inPreparation' || (isNeedChangesReset && isCreator))

  // Client sees the same child-case list the Creator/Reviewer see In Preparation — full page
  // size, real per-child status — all the way through In Review (Feature 10); Client Approval
  // switches to the simplified, paginated, all-green reference list instead (Feature 11.1), same
  // as every other role from In Review onward.
  // Feature 8 of the "review-flow update batch" ticket — the Creator's own Needs-Changes reset
  // (top timeline mimicking In Preparation, same `isNeedChangesReset` the Consolidation task
  // above already keys off) needs the REAL per-child mix (some Ready for Consolidation, the
  // Reviewer/Client's selected ones back in In Preparation) — not the later-stage simplified
  // "everyone's already green" reference list every other stage past In Preparation gets.
  const isFullChildList =
    parentPhase === 'inPreparation' ||
    (isClient && parentPhase === 'inReview') ||
    (isNeedChangesReset && isCreator)
  const showChildList =
    isFullChildList ||
    // Feature 7 — Partner gets the same supporting-context list Creator/Reviewer already see
    // from In Review onward; it was previously missing at Client Approval since Partner matched
    // none of this OR's clauses.
    ((isCreator || isReviewer || isPartner) &&
      (parentPhase === 'inReview' || parentPhase === 'clientApproval' || parentPhase === 'submitted')) ||
    (isClient && (parentPhase === 'clientApproval' || parentPhase === 'submitted'))
  const childPageSize = isFullChildList ? CHILD_PAGE_SIZE : CHILD_PAGE_SIZE_LATER_STAGES
  // From In Review onward every Child Case has already been confirmed ready — the later-stage
  // list is a simplified, view-only reference, not the actionable In Preparation list.
  const forcedChildStatus: WorkflowStatus | undefined = isFullChildList ? undefined : 'ReadyForConsolidation'

  // Reused by the Data Package element and every PackageBanner footer on this page — extracted
  // once instead of repeating the same expression at every call site.
  const packageFileName = `${PARENT_CASE.vatGroupName.replace(/\s+/g, '_')}_${PARENT_CASE.reportingPeriod.replace(/\s+/g, '_')}_Package.zip`

  // Same status a Child Case's row computes for itself (see the render loop below) — pulled up
  // here so both the list filter and the progress bar can use it without duplicating the rule.
  // Segment 3 — a reopened Child Case is always In Preparation, overriding both the "every
  // child ready" checkbox and the later-stage forced status; it stays that way until either
  // "Ready for Consolidation" is re-checked (clears the whole reopened set) or its own Child
  // Case reaches Ready for Consolidation again through the normal flow.
  // Feature 3 of the "VAT-registration alignment" ticket — once a Needs Changes reopen has
  // happened at all, every OTHER Child Case must have been Ready for Consolidation for the
  // package to have been submitted in the first place, regardless of the live `tasksDoneChecked`
  // toggle's current value (which only reflects the demo's own In Preparation lever and can be
  // false here if this state was reached by jumping phases directly in the Playground instead of
  // clicking through). Without this, the non-reopened Child Cases fell back to their raw seeded
  // defaults — showing most of the group as still not ready, instead of "everyone except the
  // ones just sent back."
  const statusForChild = (childId: string): WorkflowStatus => {
    if (reopenedChildCaseIds.includes(childId)) return 'InPreparation'
    if (forcedChildStatus) return forcedChildStatus
    if (reopenedChildCaseIds.length > 0) return 'ReadyForConsolidation'
    return tasksDoneChecked ? 'ReadyForConsolidation' : CHILD_CONFIG[childId].defaultStatus
  }

  // Live, case-insensitive substring match against the Legal Entity name (`client`), same
  // pattern as the VAT Scheduler's "Search legal entities…" filter (vat-scheduler-modal.tsx) —
  // plus the "hide Ready for Consolidation" filter (Segment 5): the Parent Case is waiting on
  // whichever Child Cases aren't done yet, so that's the useful default view of a large group.
  // Filtering never mutates PARENT_CASE.children, just narrows what's rendered below.
  const visibleChildren = useMemo(() => {
    const q = childSearch.trim().toLowerCase()
    return PARENT_CASE.children.filter((child) => {
      if (q && !child.client.toLowerCase().includes(q)) return false
      if (hideReadyChildren && statusForChild(child.id) === 'ReadyForConsolidation') return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childSearch, hideReadyChildren, forcedChildStatus, tasksDoneChecked])

  // Progress bar (Segment 6) — always reflects the WHOLE group, independent of the search/hide
  // filters above (those only narrow what's rendered in the list below).
  const readyChildrenCount = PARENT_CASE.children.filter((child) => statusForChild(child.id) === 'ReadyForConsolidation').length
  const childReadyPercent = Math.round((readyChildrenCount / PARENT_CASE.children.length) * 100)

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
    // Feature 4 of the "reopen-modal NO-state copy" ticket — EUROPIPE Poland and EUROPIPE
    // France always have access, bypassing the myRole/Playground-role dummy gate every other
    // Child Case still uses.
    const alwaysAccessible = ALWAYS_ACCESSIBLE_CHILD_CLIENTS.has(child.client)
    if (!alwaysAccessible && ROLE_TO_PLAYGROUND_ROLE[child.myRole] !== role) {
      setDeniedChild(child)
      return
    }
    setDeniedChild(null)
    setCaseKind('group')
    setGroupCaseView('child')
    setChildCaseRequiresClientApproval(requiresClientApproval)
    // Feature 6 of the "button states & child-case comments" ticket — records which specific
    // Child Case this is, so its own view (PlaygroundMain.tsx) knows whose reopen comment (see
    // childCaseComments) to surface rather than showing every Child Case's Needs Changes banner
    // identically.
    setOpenChildCaseId(child.id)

    if (alwaysAccessible) {
      // Always lands in the Creator's own "Changes requested" reset (In Review, needChanges) so
      // the prior comment below actually renders — see isNeedChangesWorkflowReset in caseTasks.ts,
      // which needs phase 'inReview'/'clientApproval' + packageReviewOutcome 'needChanges'.
      setRole('creator')
      setPhase('inReview')
      setPackageReviewOutcome('needChanges')
      if (!childCaseComments[child.id]) {
        addChildCaseComments({ [child.id]: ALWAYS_ACCESSIBLE_CHILD_DEFAULT_COMMENT[child.client] })
      }
      return
    }

    setPhase(WORKFLOW_STATUS_TO_PHASE[status])
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
      // Segment 2 of the "review-flow rework" ticket: only the Creator can advance the Parent
      // Case, and only once every Child Case is Ready for Consolidation — the Consolidation
      // upload itself is already gated the same way (`canUpload` below), so this is a belt-and-
      // braces check rather than a new restriction in practice.
      actions = { primary: { label: 'Send for review', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
      primaryDisabled = !allChildrenReady || !isConsolidationDone
      handlePrimaryClick = () => {
        if (allChildrenReady && isConsolidationDone) setPhase('inReview')
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
          setUploadedFiles([])
          setIsConsolidationDone(false)
          setPhase('inPreparation')
        }
      } else {
        actions = { primary: { label: 'Send for approval', icon: 'ArrowRight', iconSide: 'right', variant: 'default' } }
        primaryDisabled = true
      }
    } else if (isReviewer) {
      // Segment 1 of the "review-flow rework" ticket: the review modal now opens while the
      // decision is still pending ("Review requested" — the `default` outcome), not once
      // "Needs Changes" has already been recorded. Once a decision exists — approved or
      // needChanges — the Reviewer has no button at all: approved has nothing left to do,
      // needChanges hands the ball back to the Creator (its own "Send for review" branch above).
      if (reviewerInReviewState === 'requested') {
        actions = { primary: { label: 'Submit review', icon: 'Check', iconSide: 'right', variant: 'default' } }
        handlePrimaryClick = () => setReopenModalOpen(true)
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
          setUploadedFiles([])
          setIsConsolidationDone(false)
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
      // Client is the actual decision-maker at this stage (Feature 11.1) — same rule as the
      // Reviewer above (Segment 1): the modal opens while the decision is still pending
      // ("Review requested"); once a decision exists (approved or needChanges) the Client has
      // no button — the Creator is the actor from here.
      if (clientClientApprovalState === 'requested') {
        actions = { primary: { label: 'Submit review', icon: 'Check', iconSide: 'right', variant: 'default' } }
        handlePrimaryClick = () => setReopenModalOpen(true)
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
    // The Parent Case belongs to the Representative Legal Entity (EUROPIPE GmbH) — its
    // assignees must be identical to that entity's own Child Case (see EDIT_TOOLTIP below).
    assignedPeople: REPRESENTATIVE_ASSIGNEES,
    // AssignedPeople's own edit rule: Creator and Reviewer can edit, everyone else is view-only
    // (independent of `editable` below, which also gates the header's other primary actions).
    assignedPeopleEditable: isCreator || isReviewer,
    // Blue pill, same visual pattern as the Due Date pill on single (non-group) case headers —
    // just relabeled, since a VAT Group Case's deadline is the group's, not any one entity's.
    dueDate: formatDottedDate(PARENT_CASE.statutoryDeadline),
    dueDateLabel: 'Group Case Deadline',
    // Only the Creator may progress the Parent Case (its primary actions) — everyone else
    // (Reviewer, Partner, Client) gets those omitted from the descriptor rather than
    // rendered-then-hidden. People-editing has its own, broader rule (assignedPeopleEditable).
    editable: isCreator,
    editTooltip: EDIT_TOOLTIP,
    actions,
  }

  // Segment 3/4 of the "review-flow rework" ticket — "Need Changes" confirmed from the reopen
  // modal (only reachable when its "Reopen child cases?" switcher is Yes): the Parent Case goes
  // back to Not Ready (In Preparation, Consolidation task Not Started via `allChildrenReady`
  // above), exactly the selected Child Cases return to In Preparation, everything else keeps its
  // state, and the written comment replaces the dummy placeholder on every relevant banner.
  const handleReopenChildCases = (
    comment: string,
    selectedChildIds: string[],
    childComments: Record<string, string>,
  ) => {
    setReviewComment(comment.trim() ? comment.trim() : null)
    setNeedsChangesSourcePhase(parentPhase === 'clientApproval' ? 'clientApproval' : 'inReview')
    setReopenedChildCaseIds(selectedChildIds)
    // Feature 6 — each selected Child Case's own optional comment, persisted in the store so its
    // own Child Case view (PlaygroundMain.tsx) can surface it verbatim later, keyed by whichever
    // specific Child Case is open at the time (see openChildCase's setOpenChildCaseId).
    if (Object.keys(childComments).length > 0) addChildCaseComments(childComments)
    setUploadedFiles([])
    setIsConsolidationDone(false)
    setPackageReviewOutcome('needChanges')
    setPhase('inPreparation')
    // Feature 3 of the "reopen-modal NO-state copy" ticket — the Reviewer/Client who just sent
    // the package back for changes hands the ball to the Creator next, so the Playground follows
    // that handoff and switches to the Creator role. Every other left-menu selection (process,
    // case type, phase already set above) is left exactly as it was.
    setRole('creator')
  }

  // "Approve" confirmed from the reopen modal (only reachable when "Reopen child cases?" is
  // No) — records the decision and carries the written comment onto the Creator's (and every
  // other role's) approved banner, same as handleReopenChildCases does for Need Changes.
  const handleApproveFromModal = (comment: string) => {
    setReviewComment(comment.trim() ? comment.trim() : null)
    setPackageReviewOutcome('approved')
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

      {/* Segment 3 — the Parent Case already snapped back to a real In Preparation the moment
          Need Changes was confirmed (unlike the sidebar-only preview reset below), so the
          "Changes requested" context has nowhere else to surface; shown above the Consolidation
          task as supporting context for why it reset, same ordering rule as every other banner
          on this page. Client doesn't see it, consistent with every other WTS-team-only element
          here (Consolidation task, Submission confirmation, etc.). */}
      {!isClient && needsChangesSourcePhase && reopenedChildCaseIds.length > 0 && parentPhase === 'inPreparation' && (
        <div className="border-b border-border bg-background px-6 py-6">
          <PackageBanner
            descriptor={applyReviewComment(resolveParentBanner(needsChangesSourcePhase, role, 'needChanges'), reviewComment)!}
            packageFileName={packageFileName}
            onVersionHistoryClick={() => setVersionHistoryOpen(true)}
          />
        </div>
      )}

      {/* Feature 5 of the "button states & child-case comments" ticket — moved ahead of the
          Consolidation task below: the ONLY page state where both render together is this exact
          scenario (a sidebar-only "Needs Changes" preview — real phase still inReview/
          clientApproval — with isNeedChangesReset && isCreator also making the Consolidation
          task visible), and per that ticket the banner belongs above the task it explains, not
          below it. In Review reuses the single case's own per-(role, package status) banner copy
          for every role including Reviewer now (no task-checklist body here anymore — Feature
          4); Client doesn't see this step at all (Feature 10 — same child list as In Preparation
          instead). Client Approval reuses the same banner system for Creator/Reviewer/Partner;
          Client gets its own dedicated banner further below. Submission stays a single static
          banner (no review-outcome branching at that terminal stage). */}
      {((parentPhase === 'inReview' && !isClient) || (parentPhase === 'clientApproval' && !isClient)) &&
        resolveParentBanner(parentPhase, role, packageReviewOutcome) && (
          <div className="border-b border-border bg-background px-6 py-6">
            <PackageBanner
              descriptor={applyReviewComment(resolveParentBanner(parentPhase, role, packageReviewOutcome), reviewComment)!}
              packageFileName={packageFileName}
              onVersionHistoryClick={() => setVersionHistoryOpen(true)}
            />
          </div>
        )}

      {/* Consolidation task — folded into In Preparation (see the "Merge Consolidation Step
          into In Preparation" ticket) instead of being its own step. Gated behind every Child
          Case being ready (Feature 4.4): the Creator can only upload once `allChildrenReady`,
          and the top-right "Send for review" button only enables once this task is Done
          (Feature 4.5). Reviewer/Partner get the same card read-only (no upload button); Client
          doesn't see it at all, consistent with every other WTS-team-only element on this page.
          Helper text under the title clarifies the gate before it's met ("Not started"),
          prompts the (re-)upload once it's actionable ("In Progress" — same copy whether this is
          the very first upload or a re-upload after a Need Changes / Client return reset, see the
          "Creator In Progress Task Element on Needs Changes / Client Return" ticket), and
          confirms the next step once the document is uploaded ("Done"). */}
      {/* Feature 2/3 of the "upload modal & data-package visuals" ticket — copied from the
          reference folder's own DataPackageBanner (case-management/data-package-banner.tsx): a
          single blue-bordered row, "Data Package" as the row's own heading (not a section label
          wrapping it), ordered above the Consolidation task once every Child Case is ready. */}
      {showConsolidationTask && allChildrenReady && (
        <div className="border-b border-border bg-background px-6 py-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-l-sky-600 bg-muted px-4 py-4 shadow-md">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="text-sm font-medium text-foreground">Data Package</h3>
              <span className="truncate text-sm text-muted-foreground">{packageFileName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-6">
              <Button variant="link" className="h-auto gap-1.5 p-0" onClick={() => setVersionHistoryOpen(true)}>
                <History className="h-4 w-4" aria-hidden />
                Version history
              </Button>
              <Button variant="outline" className="gap-1.5">
                <Download className="h-4 w-4" aria-hidden />
                Download package
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Segment 7 — one expandable card replaces both the old always-visible TaskRow and the
          separate purple "all children ready" banner (removed entirely; no purple state exists
          anywhere in this card). Collapsed shows just the status; expanding reveals every
          Creator-uploaded supporting document, download + remove per file. */}
      {showConsolidationTask && (
        <div className="flex flex-col gap-3 border-b border-border bg-background px-6 py-6">
          <SectionLabel>Tasks</SectionLabel>
          <ConsolidationTaskCard
            canAct={allChildrenReady}
            canUpload={isCreator && allChildrenReady && displayedParentPhase === 'inPreparation'}
            uploadedFiles={uploadedFiles}
            onUploadFiles={(files) => setUploadedFiles((prev) => [...prev, ...files])}
            onRemoveFile={(index) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
            isDone={isConsolidationDone}
            onDoneChange={setIsConsolidationDone}
          />
        </div>
      )}

      {parentPhase === 'clientApproval' && isClient && CLIENT_APPROVAL_BANNERS[clientClientApprovalState] && (
        <div className="border-b border-border bg-background px-6 py-6">
          <PackageBanner
            descriptor={applyReviewComment(CLIENT_APPROVAL_BANNERS[clientClientApprovalState], reviewComment)!}
            packageFileName={packageFileName}
            onVersionHistoryClick={() => setVersionHistoryOpen(true)}
          />
        </div>
      )}

      {parentPhase === 'submitted' && (
        <div className="border-b border-border bg-background px-6 py-6">
          <PackageBanner
            descriptor={PARENT_SUBMITTED_BANNER}
            packageFileName={packageFileName}
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

      {/* Segment 4 — how many of the group's Child Cases have reached Ready for Consolidation,
          which is what actually gates the Parent Case advancing (see the Consolidation task
          above). Shown to every role — it's aggregate, informational, not a workflow action.
          Sits directly above the list it's summarizing. Amber below the halfway mark, green
          once more than half are ready — same tones Badge's own orange/green use elsewhere on
          this page, never the neutral/black default.
          Segment 6 of the "review-flow rework" ticket — scoped to In Preparation only (`display
          edParentPhase` so the sidebar-only preview reset counts too, same as the Stepper and
          Consolidation task above); it's specifically what that step is waiting on; later steps
          (In Review, Client Approval, Submission) have their own banners for that. */}
      {displayedParentPhase === 'inPreparation' && (
      <div className="flex flex-col gap-2 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">Child cases ready for consolidation</span>
          <span className="text-muted-foreground text-sm">
            {readyChildrenCount} of {PARENT_CASE.children.length} ({childReadyPercent}%)
          </span>
        </div>
        <Progress
          value={childReadyPercent}
          indicatorClassName={childReadyPercent > 60 ? 'bg-green-600' : 'bg-amber-500'}
        />
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
            <div className="flex items-center gap-2">
              {/* Segment 5 — the Parent Case is only waiting on whichever Child Cases aren't
                  done yet, so hiding the ones already Ready for Consolidation is the useful
                  default view of a large group; unchecking reveals the full list again. */}
              <button
                type="button"
                aria-pressed={hideReadyChildren}
                onClick={() => {
                  setHideReadyChildren((v) => !v)
                  setChildPage(1)
                }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  hideReadyChildren
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {hideReadyChildren && <Check className="size-3.5" />}
                {hideReadyChildren ? 'Showing only cases in progress' : 'Hide completed cases'}
              </button>
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
          </div>

          {/* Click-triggered, not persistent: only appears after clicking a Child Case the
              current role can't open, at the top of the list — not shown by default, and not
              inline on the row itself. Same contact-names copy as before, just relocated. */}
          {deniedChild && (
            <Alert variant="warning" title="No access" onClose={() => setDeniedChild(null)}>
              You don't have access. For access, contact{' '}
              {CHILD_ASSIGNED_PEOPLE[deniedChild.id]?.reviewer?.[0]?.name},{' '}
              {CHILD_ASSIGNED_PEOPLE[deniedChild.id]?.creator?.[0]?.name}.
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
              const status: WorkflowStatus = statusForChild(child.id)
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
                  // Segment 2 — a full gray background fill read as too heavy on a bordered
                  // card (unlike the plain table rows elsewhere that use hover:bg-muted/50);
                  // just darkening the border + a faint shadow reads as "hoverable" without
                  // visually flattening the card.
                  className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-none transition-all hover:border-muted-foreground/30 hover:shadow-sm"
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

                  {/* Always visible regardless of whether the current role can open the case
                      (Part 1 of the ticket) — but only a Creator/Reviewer can expand it into an
                      editable view; everyone else can still expand to spectate, just view-only.
                      Stops propagation so clicking it doesn't also fire the card's own
                      onClick={handleOpen} (the card is itself a role="button" ancestor). */}
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <AssignedPeople
                      people={CHILD_ASSIGNED_PEOPLE[child.id]}
                      editable={isCreator || isReviewer}
                      className="border-t border-border pt-3"
                    />
                  </div>
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

      <NeedsChangesReopenModal
        open={reopenModalOpen}
        onOpenChange={setReopenModalOpen}
        parentCaseId={PARENT_CASE.id}
        childCases={PARENT_CASE.children.map((child) => ({ id: child.id, client: child.client }))}
        onConfirmNeedsChanges={handleReopenChildCases}
        onConfirmApprove={handleApproveFromModal}
      />

      <PackageVersionHistoryDrawer
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        packageFileName={packageFileName}
      />
    </div>
  )
}
