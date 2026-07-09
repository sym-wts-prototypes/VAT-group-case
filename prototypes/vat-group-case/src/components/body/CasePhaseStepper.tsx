import { caseStepperSteps, stepStatesForWorkflowPhase } from '@/lib/casePhaseStepper'
import { Stepper, cn } from '@wts/ui'
import type { Phase, Process } from '@/types'

interface CasePhaseStepperProps {
  currentPhase: Phase
  process: Process
  /** Drops the Client Approval stage entirely — see caseStepperSteps. */
  skipClientApproval?: boolean
  /** Overrides the final ("Submission") step's label — e.g. Child Cases show "Ready for
   * Consolidation" there instead. Scoped to this one call site; every other caller keeps the
   * default "Submission" from PHASE_LABELS. */
  finalStepLabel?: string
  className?: string
}

/**
 * Horizontal case workflow stepper (Figma Progress / Stepper 15154:21839).
 * Reflects the phase selected in controls. The presentation lives in the shared
 * `Stepper` (@wts/ui); the phase→state machine stays here.
 */
export function CasePhaseStepper({
  currentPhase,
  process,
  skipClientApproval,
  finalStepLabel,
  className,
}: CasePhaseStepperProps) {
  const steps = caseStepperSteps(process, skipClientApproval)
  const states = stepStatesForWorkflowPhase(currentPhase, steps)

  return (
    <div className={cn('border-b border-border bg-background px-6 py-6', className)}>
      <Stepper
        steps={steps.map((step, index) => ({
          label: finalStepLabel && step.id === 'submitted' ? finalStepLabel : step.label,
          state: states[index] ?? 'disabled',
        }))}
      />
    </div>
  )
}
