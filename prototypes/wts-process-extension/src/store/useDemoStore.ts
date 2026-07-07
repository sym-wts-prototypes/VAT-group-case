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

  if (next.phase !== undefined) {
    if (proposed.phase !== 'inPreparation') {
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
    if (next.packageReviewOutcome === 'needChanges') {
      proposed.tasksDoneChecked = false
    }
  } else if (next.phase !== undefined || next.role !== undefined) {
    if (isPackageBannerPhase(proposed.phase) && proposed.phase !== 'submitted') {
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
})

export const useDemoStore = create<DemoState>((set) => ({
  ...initialState,
  setProcess: (process) => set((prev) => reconcile({ process }, prev)),
  setRole: (role) => set((prev) => reconcile({ role }, prev)),
  setHeaderType: (headerType) =>
    set((prev) => reconcile({ headerType }, prev)),
  setPhase: (phase) => set((prev) => reconcile({ phase }, prev)),
  setTasksDoneChecked: (tasksDoneChecked) =>
    set((prev) => ({ ...prev, tasksDoneChecked })),
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
    set((prev) => ({ ...prev, showCaseManagement })),
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
