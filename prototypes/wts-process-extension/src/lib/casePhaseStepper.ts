import { PHASE_LABELS } from '@/config/phases'
import type { Phase, Process } from '@/types'

export type StepperStepState =
  | 'notStarted'
  | 'inProgress'
  | 'finished'
  | 'disabled'

export interface StepperStep {
  id: Phase
  label: string
}

/** Post-draft workflow steps shown below the case header (Figma Stepper Number=4). */
export const CASE_STEPPER_STEPS: StepperStep[] = [
  { id: 'inPreparation', label: PHASE_LABELS.inPreparation },
  { id: 'inReview', label: PHASE_LABELS.inReview },
  { id: 'clientApproval', label: PHASE_LABELS.clientApproval },
  { id: 'submitted', label: PHASE_LABELS.submitted },
]

/** CIT adds the post-submission Assessment & Closure stage. */
const ASSESSMENT_CLOSURE_STEP: StepperStep = {
  id: 'assessmentClosure',
  label: PHASE_LABELS.assessmentClosure,
}

/**
 * `skipClientApproval` drops the Client Approval stage entirely (not shown disabled) — for VAT
 * Child Cases whose Legal Entity doesn't require that step (see the Parent VAT Group Case
 * page's per-child config). Only meaningful for `process === 'vat'`; CIT/HR are unaffected.
 */
export function caseStepperSteps(process: Process, skipClientApproval?: boolean): StepperStep[] {
  if (process === 'cit') return [...CASE_STEPPER_STEPS, ASSESSMENT_CLOSURE_STEP]
  if (process === 'vat' && skipClientApproval) {
    return CASE_STEPPER_STEPS.filter((step) => step.id !== 'clientApproval')
  }
  return CASE_STEPPER_STEPS
}

export function stepStatesForWorkflowPhase(
  currentPhase: Phase,
  steps: StepperStep[] = CASE_STEPPER_STEPS,
): StepperStepState[] {
  const order = steps.map((s) => s.id)

  if (currentPhase === 'draft') {
    return steps.map(() => 'disabled')
  }

  const activeIndex = order.indexOf(currentPhase)
  if (activeIndex === -1) {
    return steps.map(() => 'disabled')
  }

  return order.map((_, index) => {
    if (index < activeIndex) return 'finished'
    if (index === activeIndex) {
      const isLast = index === order.length - 1
      // Submission is terminal when it is the last stage (non-CIT); otherwise
      // the active stage is shown as in progress.
      return currentPhase === 'submitted' && isLast ? 'finished' : 'inProgress'
    }
    return 'disabled'
  })
}
