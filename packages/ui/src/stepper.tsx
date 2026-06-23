import * as React from 'react'
import { Circle, CircleCheck, CircleDashed } from 'lucide-react'

import { cn } from './cn'

export type StepperStepState = 'finished' | 'inProgress' | 'notStarted' | 'disabled'

export interface StepperStep {
  label: string
  state: StepperStepState
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepperStep[]
}

/**
 * Horizontal workflow stepper — the connector line sits ABOVE each step's
 * icon+label. Matches the WTS case-phase stepper (Figma Progress / Stepper):
 * finished = emerald CircleCheck, in-progress = sky Circle, upcoming = dashed.
 * The state machine lives in the consumer; this only renders the given states.
 */
const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ steps, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex w-full items-start', className)} {...props}>
      {steps.map((step, i) => (
        <ProgressStep key={i} label={step.label} state={step.state} />
      ))}
    </div>
  ),
)
Stepper.displayName = 'Stepper'

function ProgressStep({ label, state }: StepperStep) {
  const isDimmed = state === 'disabled' || state === 'notStarted'
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-2 p-1', isDimmed && 'opacity-25')}>
      <div
        className={cn(
          'h-0 w-full',
          state === 'inProgress' && 'border-t-2 border-sky-700',
          state === 'finished' && 'border-t-2 border-emerald-600',
          (state === 'disabled' || state === 'notStarted') && 'border-t border-border',
        )}
        aria-hidden
      />
      <div className="flex items-center gap-1.5">
        <StepIcon state={state} />
        <span className="text-sm font-medium leading-5 text-foreground">{label}</span>
      </div>
    </div>
  )
}

function StepIcon({ state }: { state: StepperStepState }) {
  const className = 'size-[15px] shrink-0'
  if (state === 'finished') return <CircleCheck className={cn(className, 'text-emerald-600')} aria-hidden />
  if (state === 'inProgress')
    return <Circle className={cn(className, 'text-sky-700')} strokeWidth={2} aria-hidden />
  return <CircleDashed className={cn(className, 'text-muted-foreground')} aria-hidden />
}

export { Stepper }
