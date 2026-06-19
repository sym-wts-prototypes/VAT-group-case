import { Circle, CircleCheck, CircleDashed } from 'lucide-react'

import {
  caseStepperSteps,
  stepStatesForWorkflowPhase,
  type StepperStepState,
} from '@/lib/casePhaseStepper'
import { cn } from '@wts/ui'
import type { Phase, Process } from '@/types'

interface CasePhaseStepperProps {
  currentPhase: Phase
  process: Process
  className?: string
}

/**
 * Horizontal case workflow stepper (Figma Progress / Stepper 15154:21839).
 * Reflects the phase selected in controls.
 */
export function CasePhaseStepper({
  currentPhase,
  process,
  className,
}: CasePhaseStepperProps) {
  const steps = caseStepperSteps(process)
  const states = stepStatesForWorkflowPhase(currentPhase, steps)

  return (
    <div
      className={cn(
        'border-b border-border bg-background px-6 py-6',
        className,
      )}
    >
      <div className="flex w-full items-start">
        {steps.map((step, index) => (
          <ProgressStep
            key={step.id}
            label={step.label}
            state={states[index] ?? 'disabled'}
          />
        ))}
      </div>
    </div>
  )
}

function ProgressStep({
  label,
  state,
}: {
  label: string
  state: StepperStepState
}) {
  const isDimmed = state === 'disabled' || state === 'notStarted'

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-2 p-1',
        isDimmed && 'opacity-25',
      )}
    >
      <div
        className={cn(
          'h-0 w-full',
          state === 'inProgress' && 'border-t-2 border-sky-700',
          state === 'finished' && 'border-t-2 border-emerald-600',
          (state === 'disabled' ||
            state === 'notStarted') &&
            'border-t border-border',
        )}
        aria-hidden
      />
      <div className="flex items-center gap-1.5">
        <StepIcon state={state} />
        <span className="text-sm font-medium leading-5 text-foreground">
          {label}
        </span>
      </div>
    </div>
  )
}

function StepIcon({ state }: { state: StepperStepState }) {
  const className = 'size-[15px] shrink-0'

  if (state === 'finished') {
    return (
      <CircleCheck
        className={cn(className, 'text-emerald-600')}
        aria-hidden
      />
    )
  }

  if (state === 'inProgress') {
    return (
      <Circle
        className={cn(className, 'text-sky-700')}
        strokeWidth={2}
        aria-hidden
      />
    )
  }

  return (
    <CircleDashed
      className={cn(className, 'text-muted-foreground')}
      aria-hidden
    />
  )
}
