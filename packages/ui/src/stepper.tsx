import * as React from 'react'
import { Check } from 'lucide-react'

import { cn } from './cn'

export interface StepperStep {
  label: string
  description?: string
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: StepperStep[]
  /** Index of the active step. Steps before it render as completed. */
  current: number
}

const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  ({ steps, current, className, ...props }, ref) => (
    <ol ref={ref} className={cn('flex w-full items-start', className)} {...props}>
      {steps.map((step, i) => {
        const completed = i < current
        const active = i === current
        const last = i === steps.length - 1
        return (
          <li key={i} className={cn('flex items-center', !last && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium',
                  completed && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !completed && !active && 'border-border text-muted-foreground',
                )}
              >
                {completed ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {!last && <span className={cn('mx-2 mt-4 h-px flex-1', completed ? 'bg-primary' : 'bg-border')} />}
          </li>
        )
      })}
    </ol>
  ),
)
Stepper.displayName = 'Stepper'

export { Stepper }
