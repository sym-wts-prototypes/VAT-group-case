/**
 * Demo controls store with two-way URL hash sync.
 *
 * Hash format: `#{process}/{role}/{headerType}/{phase}`
 *   e.g. `#cit/creator/case/inPreparation`
 *
 * Platform is derived from role.
 */

import { useEffect } from 'react'
import { create } from 'zustand'

import { ALL_WORKFLOW_PHASES } from '@/config/phases'
import {
  defaultPackageReviewOutcome,
  isPackageBannerPhase,
  type PackageReviewOutcome,
} from '@/config/packageBanners'
import { DEFAULT_REQUIREMENT_CATEGORY_ID } from '@/config/requirements'
import {
  defaultHeaderTypeForControls,
  defaultPhaseForControls,
  isHeaderTypeAllowedInControls,
  isPhaseDisabledInControls,
} from '@/lib/controlHeaderTypes'
import { reconcileAssessmentStateForRole } from '@/lib/caseTasks'
import {
  headerTypesFor,
  headerTypesForRole,
  platformForRole,
} from '@/lib/resolveHeader'
import type { HeaderType, Phase, Platform, Process, Role } from '@/types'

/** CIT Assessment & Closure demo: how the assessment items resolve. */
export type AssessmentsState = 'empty' | 'arrived' | 'mixed' | 'done'

/** Playground case-type hierarchy — see `caseKind`/`groupCaseView` below. */
export type CaseKind = 'single' | 'group'
export type GroupCaseView = 'parent' | 'child'

interface DemoState {
  process: Process
  platform: Platform
  role: Role
  headerType: HeaderType
  phase: Phase
  /** Demo: all WTS case tasks marked done (In Preparation only). */
  tasksDoneChecked: boolean
  /** Demo: approval checkbox (In Review / Client Approval). */
  approvedChecked: boolean
  /** CIT In Review + Approved: tasks reconfirmed (Done under Approved). */
  tasksReconfirmedDone: boolean
  /** CIT Assessment & Closure: how items resolve (done enables Close case). */
  assessmentsState: AssessmentsState
  /** CIT Submission: protocol confirmation received (enables Tax assessment CTA). */
  protocolConfirmationChecked: boolean
  /** Data-package review outcome — drives banner + Approved (In Review / Client Approval). */
  packageReviewOutcome: PackageReviewOutcome
  /** Client requirement bucket: Mark as done checkbox. */
  bucketMarkAsDoneChecked: boolean
  /** Client bucket ↔ WTS category (Category 1 / Category 2). */
  selectedRequirementCategoryId: string
  // Playground-only toggle — swaps PlaygroundMain over to the Case Management page.
  // Deliberately not synced to the URL hash: the hash format above only carries
  // process/role/headerType/phase, and this is a demo toggle, not worth deep-linking yet.
  showCaseManagement: boolean
  // Feature 4 of the "upload modal & data-package visuals" ticket — same pattern as
  // showCaseManagement: swaps PlaygroundMain over to the in-prototype Organisations page
  // instead of navigating out to the separate Organisations prototype. Mutually exclusive
  // with showCaseManagement (the sidebar's onNavigate sets exactly one true at a time).
  showOrganisations: boolean
  // Playground-only case-type hierarchy: Single vs Group Case, then (only for Group) Parent vs
  // Child Case. Group forces process to vat (see setters below); Group+Parent additionally
  // forces phase to inPreparation, since that's the only workflow state the Parent Case page
  // covers so far. Group+Child is just the normal case dispatch with process locked to vat —
  // no separate rendering path needed for it.
  caseKind: CaseKind
  groupCaseView: GroupCaseView
  // Whether the Child Case currently being viewed (Group + Child) requires a Client Approval
  // step — set by the Parent Case page when a specific Child Case is opened (see
  // parent-vat-group-case-page.tsx's openChildCase). Defaults to true (today's behaviour, full
  // 4-phase workflow) whenever no specific child has been opened, or when Case Type/Group Case
  // View is changed manually via the controls.
  childCaseRequiresClientApproval: boolean
  /** VAT Group Parent Case: Child Case ids most recently reopened via a Reviewer/Client "Need
   * Changes" decision (see needs-changes-reopen-modal.tsx) — drives those Child Cases' status
   * back to In Preparation (see parent-vat-group-case-page.tsx's statusForChild) and is what the
   * Playground's "Reopened Child Cases" panel lists (ControlPanel.tsx). Cleared when "Ready for
   * Consolidation" is (re)checked, matching that toggle's own "marks every Child Case ready"
   * semantics — re-marking everyone ready supersedes any earlier reopen. */
  reopenedChildCaseIds: string[]
  /** VAT Group Case: which specific Child Case is currently open (by id) — set whenever a
   * Child Case row is opened, whether from the Parent Case page's own list (see
   * parent-vat-group-case-page.tsx's openChildCase) or the Case Management page's expanded
   * group accordion (see case-management-page.tsx's openChildCaseFromManagement). Lets the
   * Child Case view (PlaygroundMain.tsx) know whose per-entity reopen comment to surface —
   * see childCaseComments below. Null until a specific Child Case has ever been opened. */
  openChildCaseId: string | null
  /** VAT Group Case: the exact per-entity comment written in the Reviewer/Client reopen modal
   * (needs-changes-reopen-modal.tsx), keyed by Child Case id — surfaced verbatim on that
   * specific Child Case's own Needs Changes banner (see PlaygroundMain.tsx) in place of the
   * generic single-case dummy comment. Merged (not replaced) on each reopen, so an earlier
   * round's comment for a Child Case not part of the current one still survives. */
  childCaseComments: Record<string, string>
  setProcess: (p: Process) => void
  setRole: (r: Role) => void
  setHeaderType: (h: HeaderType) => void
  setPhase: (p: Phase) => void
  setTasksDoneChecked: (checked: boolean) => void
  setApprovedChecked: (checked: boolean) => void
  setTasksReconfirmedDone: (checked: boolean) => void
  setAssessmentsState: (state: AssessmentsState) => void
  setProtocolConfirmationChecked: (checked: boolean) => void
  setPackageReviewOutcome: (outcome: PackageReviewOutcome) => void
  setBucketMarkAsDoneChecked: (checked: boolean) => void
  setSelectedRequirementCategoryId: (id: string) => void
  setShowCaseManagement: (show: boolean) => void
  setShowOrganisations: (show: boolean) => void
  setCaseKind: (kind: CaseKind) => void
  setGroupCaseView: (view: GroupCaseView) => void
  setChildCaseRequiresClientApproval: (requires: boolean) => void
  setReopenedChildCaseIds: (ids: string[]) => void
  setOpenChildCaseId: (id: string | null) => void
  addChildCaseComments: (comments: Record<string, string>) => void
}

const DEFAULTS = {
  process: 'cit' as Process,
  platform: 'wts' as Platform,
  role: 'creator' as Role,
  headerType: 'case' as HeaderType,
  phase: 'inPreparation' as Phase,
  tasksDoneChecked: false,
  approvedChecked: false,
  tasksReconfirmedDone: false,
  assessmentsState: 'mixed' as AssessmentsState,
  protocolConfirmationChecked: false,
  packageReviewOutcome: 'default' as PackageReviewOutcome,
  bucketMarkAsDoneChecked: false,
  selectedRequirementCategoryId: DEFAULT_REQUIREMENT_CATEGORY_ID,
  showCaseManagement: true,
  showOrganisations: false,
  caseKind: 'single' as CaseKind,
  groupCaseView: 'parent' as GroupCaseView,
  // Defaults to the Child Case that skips Client Approval (3 steps) — see the "Child-Case
  // Default Opening & Step-Dependent Behaviour" ticket: opening Group + Child by default, or
  // toggling into it from the Playground controls, should land on the simpler workflow variant
  // rather than always assuming Client Approval applies.
  childCaseRequiresClientApproval: false,
  reopenedChildCaseIds: [] as string[],
  openChildCaseId: null as string | null,
  childCaseComments: {} as Record<string, string>,
}

const WORKFLOW_PHASE_SET = new Set<Phase>(ALL_WORKFLOW_PHASES)

function normalizePhase(phase: Phase | undefined): Phase {
  if (phase && WORKFLOW_PHASE_SET.has(phase)) return phase
  return DEFAULTS.phase
}

function reconcile(
  next: Partial<DemoState>,
  prev: DemoState,
): DemoState {
  const proposed = { ...prev, ...next }

  proposed.platform = platformForRole(proposed.role)
  proposed.phase = normalizePhase(proposed.phase)

  // Assessment & Closure is a CIT-only stage.
  if (proposed.phase === 'assessmentClosure' && proposed.process !== 'cit') {
    proposed.phase = defaultPhaseForControls(proposed.role)
  }
  if (proposed.phase === 'summary' && proposed.process !== 'cit') {
    proposed.phase = defaultPhaseForControls(proposed.role)
  }

  if (isPhaseDisabledInControls(proposed.phase, proposed.role)) {
    proposed.phase = defaultPhaseForControls(proposed.role)
  }

  if (proposed.headerType === 'caseWrapper' && proposed.process !== 'hr') {
    proposed.headerType = 'case'
  }

  // Client has no requirement list — case shows bucket cards; bucket is a drill-in.
  if (next.role === 'client' && proposed.headerType === 'requirementList') {
    proposed.headerType = 'case'
  }
  if (
    next.role !== undefined &&
    next.role !== 'client' &&
    proposed.headerType === 'requirementBucket'
  ) {
    proposed.headerType = 'case'
  }
  // CIT/HR: requirement list is not reachable in Draft.
  if (
    (proposed.process === 'cit' || proposed.process === 'hr') &&
    proposed.phase === 'draft' &&
    proposed.headerType === 'requirementList'
  ) {
    proposed.headerType = 'case'
  }

  const validHeaders = headerTypesFor(proposed.process, proposed.platform)
  if (!validHeaders.includes(proposed.headerType)) {
    proposed.headerType = validHeaders.includes('case')
      ? 'case'
      : (validHeaders[validHeaders.length - 1] ?? proposed.headerType)
  }

  if (
    !isHeaderTypeAllowedInControls(
      proposed.headerType,
      proposed.process,
      proposed.role,
      proposed.phase,
    )
  ) {
    proposed.headerType = defaultHeaderTypeForControls(
      proposed.process,
      proposed.role,
      proposed.phase,
    )
  }

  proposed.platform = platformForRole(proposed.role)

  // VAT Group Parent Case: "Tasks Done" is repurposed as "every Child Case is Ready for
  // Consolidation" (see parent-vat-group-case-page.tsx) — a fact about the world, not a
  // per-visit gate, so it must survive navigating away from and back to In Preparation (e.g.
  // Send for review, or a Reviewer/Client "Need Changes" reset — see the "In Progress Label &
  // Return-State" ticket's Segments 3-4). Every other case type keeps the original per-phase
  // reset below.
  const isGroupParentCase = proposed.caseKind === 'group' && proposed.groupCaseView === 'parent'

  if (next.phase !== undefined) {
    if (proposed.phase !== 'inPreparation' && !isGroupParentCase) {
      proposed.tasksDoneChecked = false
    }
    if (
      proposed.phase !== 'inReview' &&
      proposed.phase !== 'clientApproval'
    ) {
      proposed.approvedChecked = false
    }
    if (proposed.phase !== 'inReview') {
      proposed.tasksReconfirmedDone = false
    }
    if (
      proposed.phase !== 'assessmentClosure' &&
      proposed.phase !== 'summary'
    ) {
      proposed.assessmentsState = 'mixed'
    }
    if (proposed.phase === 'summary') {
      proposed.assessmentsState = 'done'
    }
    if (proposed.phase !== 'submitted') {
      proposed.protocolConfirmationChecked = false
    }
  }

  if (next.approvedChecked !== undefined && !proposed.approvedChecked) {
    proposed.tasksReconfirmedDone = false
  }

  if (next.packageReviewOutcome !== undefined) {
    proposed.packageReviewOutcome = next.packageReviewOutcome
    proposed.approvedChecked = next.packageReviewOutcome === 'approved'
    if (next.packageReviewOutcome !== 'approved') {
      proposed.tasksReconfirmedDone = false
    }
    if (next.packageReviewOutcome === 'needChanges' && !isGroupParentCase) {
      proposed.tasksDoneChecked = false
    }
  } else if (next.phase !== undefined || next.role !== undefined) {
    // VAT Group Parent Case: the Reviewer/Client's review decision is a fact about the case,
    // not a per-role demo preview — it must survive switching role back to Creator so the
    // "Need Changes" reset (Segment 4 of the "In Progress Label & Return-State" ticket) is
    // actually visible to them, instead of silently reverting to "sent" the moment they switch.
    if (isPackageBannerPhase(proposed.phase) && proposed.phase !== 'submitted' && !isGroupParentCase) {
      proposed.packageReviewOutcome = defaultPackageReviewOutcome()
      proposed.approvedChecked = false
      proposed.tasksReconfirmedDone = false
    }
  }

  if (
    next.headerType !== undefined &&
    proposed.headerType !== 'requirementBucket'
  ) {
    proposed.bucketMarkAsDoneChecked = false
  }

  proposed.assessmentsState = reconcileAssessmentStateForRole(
    proposed.assessmentsState,
    proposed.role,
  )

  return proposed
}

const PROCESSES: Process[] = ['cit', 'hr', 'vat']
const ROLES: Role[] = ['creator', 'reviewer', 'partner', 'client']
const HEADER_TYPES: HeaderType[] = [
  'caseWrapper',
  'case',
  'requirementList',
  'requirementBucket',
]

function parseHash(): Partial<DemoState> {
  if (typeof window === 'undefined') return {}
  const raw = window.location.hash.replace(/^#\/?/, '')
  if (!raw) return {}

  let parts = raw.split('/')
  if (parts[0] === 'playground' || parts[0] === 'matrix') {
    parts = parts.slice(1)
  }

  const out: Partial<DemoState> = {}

  if (parts.length >= 4) {
    const [process, role, headerType, phase] = parts
    if (PROCESSES.includes(process as Process)) out.process = process as Process
    if (ROLES.includes(role as Role)) out.role = role as Role
    if (HEADER_TYPES.includes(headerType as HeaderType))
      out.headerType = headerType as HeaderType
    if (WORKFLOW_PHASE_SET.has(phase as Phase)) out.phase = phase as Phase
    return out
  }

  if (parts.length === 3) {
    const [process, role, headerType] = parts
    if (PROCESSES.includes(process as Process)) out.process = process as Process
    if (ROLES.includes(role as Role)) out.role = role as Role
    if (HEADER_TYPES.includes(headerType as HeaderType))
      out.headerType = headerType as HeaderType
    return out
  }

  // Legacy: process / platform / role / headerType / phase
  if (parts.length >= 5) {
    const [process, , role, headerType, phase] = parts
    if (PROCESSES.includes(process as Process)) out.process = process as Process
    if (ROLES.includes(role as Role)) out.role = role as Role
    if (HEADER_TYPES.includes(headerType as HeaderType))
      out.headerType = headerType as HeaderType
    if (WORKFLOW_PHASE_SET.has(phase as Phase)) out.phase = phase as Phase
  }

  return out
}

function toHash(s: DemoState): string {
  return `#${s.process}/${s.role}/${s.headerType}/${s.phase}`
}

const initialState = reconcile(parseHash(), {
  ...DEFAULTS,
  setProcess: () => {},
  setRole: () => {},
  setHeaderType: () => {},
  setPhase: () => {},
  setTasksDoneChecked: () => {},
  setApprovedChecked: () => {},
  setTasksReconfirmedDone: () => {},
  setAssessmentsState: () => {},
  setProtocolConfirmationChecked: () => {},
  setPackageReviewOutcome: () => {},
  setBucketMarkAsDoneChecked: () => {},
  setSelectedRequirementCategoryId: () => {},
  setShowCaseManagement: () => {},
  setShowOrganisations: () => {},
  setCaseKind: () => {},
  setGroupCaseView: () => {},
  setChildCaseRequiresClientApproval: () => {},
  setReopenedChildCaseIds: () => {},
  setOpenChildCaseId: () => {},
  addChildCaseComments: () => {},
})

export const useDemoStore = create<DemoState>((set) => ({
  ...initialState,
  setProcess: (process) => set((prev) => reconcile({ process }, prev)),
  setRole: (role) => set((prev) => reconcile({ role }, prev)),
  setHeaderType: (headerType) =>
    set((prev) => reconcile({ headerType }, prev)),
  setPhase: (phase) => set((prev) => reconcile({ phase }, prev)),
  setTasksDoneChecked: (tasksDoneChecked) =>
    set((prev) => ({
      ...prev,
      tasksDoneChecked,
      // Re-checking "Ready for Consolidation" marks every Child Case ready again (its own
      // established label/description), superseding any earlier reopen.
      reopenedChildCaseIds: tasksDoneChecked ? [] : prev.reopenedChildCaseIds,
    })),
  setApprovedChecked: (approvedChecked) =>
    set((prev) =>
      reconcile(
        {
          approvedChecked,
          packageReviewOutcome: approvedChecked
            ? 'approved'
            : prev.packageReviewOutcome === 'approved'
              ? 'default'
              : prev.packageReviewOutcome,
        },
        prev,
      ),
    ),
  setTasksReconfirmedDone: (tasksReconfirmedDone) =>
    set((prev) => ({ ...prev, tasksReconfirmedDone })),
  setAssessmentsState: (assessmentsState) =>
    set((prev) => ({ ...prev, assessmentsState })),
  setProtocolConfirmationChecked: (protocolConfirmationChecked) =>
    set((prev) => ({ ...prev, protocolConfirmationChecked })),
  setPackageReviewOutcome: (packageReviewOutcome) =>
    set((prev) => reconcile({ packageReviewOutcome }, prev)),
  setBucketMarkAsDoneChecked: (bucketMarkAsDoneChecked) =>
    set((prev) => ({ ...prev, bucketMarkAsDoneChecked })),
  setSelectedRequirementCategoryId: (selectedRequirementCategoryId) =>
    set((prev) => ({ ...prev, selectedRequirementCategoryId })),
  setShowCaseManagement: (showCaseManagement) =>
    set((prev) => ({ ...prev, showCaseManagement, showOrganisations: false })),
  setShowOrganisations: (showOrganisations) =>
    set((prev) => ({ ...prev, showOrganisations, showCaseManagement: false })),
  setCaseKind: (caseKind) =>
    set((prev) =>
      reconcile(
        caseKind === 'group'
          ? {
              caseKind,
              process: 'vat',
              // Features 3/4 of the "review-flow update batch" ticket: the Group Case flow only
              // ever works with the plain Case page — Case Wrapper doesn't apply (non-HR),
              // Requirement List/Bucket have no distinct content here. Forcing this on entry
              // keeps that true even if a stale non-'case' value was selected before switching.
              headerType: 'case',
              phase: prev.groupCaseView === 'parent' ? 'inPreparation' : prev.phase,
              showCaseManagement: false,
              childCaseRequiresClientApproval: false,
            }
          : { caseKind, childCaseRequiresClientApproval: false },
        prev,
      ),
    ),
  setGroupCaseView: (groupCaseView) =>
    set((prev) =>
      reconcile(
        {
          groupCaseView,
          phase: groupCaseView === 'parent' ? 'inPreparation' : prev.phase,
          childCaseRequiresClientApproval: false,
        },
        prev,
      ),
    ),
  // Feature 3 of the "button states & child-case comments" ticket — switching to the
  // no-Client-Approval (3-step) variant while already sitting on the Client Approval phase
  // would otherwise leave `phase` pointing at a step this variant doesn't have (the Phase
  // radios below already disable that option — see ControlPanel.tsx — but disabling the radio
  // doesn't move the case off a phase it's already on). Resets to In Preparation, the one phase
  // valid for both variants that also makes the most sense to land back on.
  setChildCaseRequiresClientApproval: (childCaseRequiresClientApproval) =>
    set((prev) =>
      reconcile(
        {
          childCaseRequiresClientApproval,
          phase: !childCaseRequiresClientApproval && prev.phase === 'clientApproval' ? 'inPreparation' : prev.phase,
        },
        prev,
      ),
    ),
  setReopenedChildCaseIds: (reopenedChildCaseIds) =>
    set((prev) => ({ ...prev, reopenedChildCaseIds })),
  setOpenChildCaseId: (openChildCaseId) =>
    set((prev) => ({ ...prev, openChildCaseId })),
  addChildCaseComments: (comments) =>
    set((prev) => ({
      ...prev,
      childCaseComments: { ...prev.childCaseComments, ...comments },
    })),
}))

export function useHashSync() {
  useEffect(() => {
    const sync = () => {
      const parsed = parseHash()
      if (Object.keys(parsed).length === 0) return
      const current = useDemoStore.getState()
      useDemoStore.setState(reconcile(parsed, current))
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    return useDemoStore.subscribe((state) => {
      const next = toHash(state)
      if (window.location.hash !== next) {
        window.history.replaceState(null, '', next)
      }
    })
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', toHash(useDemoStore.getState()))
    }
  }, [])
}

export { headerTypesForRole }
