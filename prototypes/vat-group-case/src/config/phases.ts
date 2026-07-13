/**
 * Which phases exist for a given (process, headerType).
 *
 * The whole point of this file is that it is *exhaustive* - any phase you
 * want to render must be listed here. The control panel reads this so
 * users only see valid options.
 */

import type { HeaderType, Phase, Process } from '@/types'

type PhaseMatrix = Record<Process, Record<HeaderType, Phase[]>>

/** Fixed stages shown in controls — same list for every header type. */
export const WORKFLOW_PHASES = [
  'draft',
  'inPreparation',
  'inReview',
  'clientApproval',
  'submitted',
] as const satisfies readonly Phase[]

export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number]

/**
 * Full set of selectable workflow phases including CIT-only stages.
 * Used for hash parsing / validation so the phase can persist.
 */
export const ALL_WORKFLOW_PHASES = [
  ...WORKFLOW_PHASES,
  'assessmentClosure',
  'summary',
] as const satisfies readonly Phase[]

/**
 * Phases shown in the control panel for a given process. CIT gains the
 * post-submission "Assessment & Closure" stage; other processes do not.
 */
export function workflowPhasesForControls(process: Process): Phase[] {
  return process === 'cit'
    ? [...ALL_WORKFLOW_PHASES]
    : [...WORKFLOW_PHASES]
}

export const PHASE_LABELS: Record<Phase, string> = {
  draft: 'Draft',
  inPreparation: 'In Preparation',
  inReview: 'In Review',
  clientApproval: 'Client Approval',
  submitted: 'Submission',
  assessmentClosure: 'Assessment & Closure',
  summary: 'Summary',
  done: 'Done',
  archived: 'Archived',
  open: 'Open',
  inProgress: 'In Progress',
  completed: 'Completed',
}

/** Parent (Group) Case's own phase list for the Playground controls — a separate list from
 * workflowPhasesForControls() since single/child cases don't have this exact set (though as of
 * the "Merge Consolidation Step into In Preparation" ticket the two lists happen to match:
 * Consolidation is no longer a step of its own — its functionality now lives as a task inside
 * In Preparation, see parent-vat-group-case-page.tsx). */
export const PARENT_CASE_PHASES: Phase[] = [
  'inPreparation',
  'inReview',
  'clientApproval',
  'submitted',
]

const CASE_PHASES_CIT: Phase[] = [
  'draft',
  'inPreparation',
  'inReview',
  'clientApproval',
  'submitted',
  'assessmentClosure',
  'summary',
]

// HR adds the Case Wrapper layer on top, but the case-level phases mostly mirror CIT.
const CASE_PHASES_HR: Phase[] = [
  'draft',
  'inPreparation',
  'inReview',
  'clientApproval',
  'submitted',
]

// VAT is similar to CIT for now - diverge here once we know more.
const CASE_PHASES_VAT: Phase[] = [
  'draft',
  'inPreparation',
  'inReview',
  'clientApproval',
  'submitted',
]

const REQ_LIST_PHASES: Phase[] = ['open', 'inProgress', 'completed']
const REQ_BUCKET_PHASES: Phase[] = ['open', 'inProgress', 'completed']
const CASE_WRAPPER_PHASES: Phase[] = ['draft', 'inProgress', 'completed']

export const PHASES: PhaseMatrix = {
  cit: {
    caseWrapper: [], // CIT has no case wrapper
    case: CASE_PHASES_CIT,
    requirementList: REQ_LIST_PHASES,
    requirementBucket: REQ_BUCKET_PHASES,
  },
  hr: {
    caseWrapper: CASE_WRAPPER_PHASES,
    case: CASE_PHASES_HR,
    requirementList: REQ_LIST_PHASES,
    requirementBucket: REQ_BUCKET_PHASES,
  },
  vat: {
    caseWrapper: [], // VAT has no case wrapper
    case: CASE_PHASES_VAT,
    requirementList: REQ_LIST_PHASES,
    requirementBucket: REQ_BUCKET_PHASES,
  },
}

export function getPhasesFor(
  process: Process,
  headerType: HeaderType,
): Phase[] {
  return PHASES[process][headerType]
}

/**
 * Default phase to pick when (process, headerType) changes and the
 * current phase is no longer valid.
 */
export function defaultPhaseFor(
  process: Process,
  headerType: HeaderType,
): Phase | undefined {
  return PHASES[process][headerType][0]
}

/**
 * Maps workflow stages from the control panel to config keys for
 * requirement list / bucket headers (which use open / inProgress / completed).
 */
export function phaseForConfig(
  phase: Phase,
  headerType: HeaderType,
): Phase {
  if (headerType === 'case' || headerType === 'caseWrapper') {
    return phase
  }
  const map: Partial<Record<Phase, Phase>> = {
    draft: 'open',
    inPreparation: 'inProgress',
    inReview: 'inProgress',
    clientApproval: 'inProgress',
    submitted: 'completed',
  }
  return map[phase] ?? phase
}
