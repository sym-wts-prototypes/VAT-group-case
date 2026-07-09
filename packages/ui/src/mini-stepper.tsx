import * as React from 'react'
import { Fragment } from 'react'

import { cn } from './cn'

export type MiniStepperStepState = 'finished' | 'inProgress' | 'notStarted'

export interface MiniStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** One state per step, in order — no labels, just dots + connecting lines. */
  states: MiniStepperStepState[]
}

const DOT_COLOR: Record<MiniStepperStepState, string> = {
  finished: 'bg-emerald-600',
  inProgress: 'bg-sky-700',
  notStarted: 'bg-border',
}

/**
 * Compact dot-and-line progress indicator for a single row/card — same
 * finished/inProgress/notStarted vocabulary and emerald/sky/muted color
 * language as the full-width `Stepper`, just sized for inline use (e.g. one
 * step-progress per row in a list of child cases) where the labeled Stepper
 * would be too wide. The number of steps is caller-controlled, so rows whose
 * workflow skips a stage naturally render with fewer dots.
 */
const MiniStepper = React.forwardRef<HTMLDivElement, MiniStepperProps>(
  ({ states, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center', className)} role="presentation" {...props}>
      {states.map((state, i) => (
        <Fragment key={i}>
          {i > 0 && <span className={cn('h-px w-3.5 shrink-0', DOT_COLOR[states[i - 1]])} aria-hidden />}
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              DOT_COLOR[state],
              state === 'inProgress' && 'ring-2 ring-sky-200',
            )}
            aria-hidden
          />
        </Fragment>
      ))}
    </div>
  ),
)
MiniStepper.displayName = 'MiniStepper'

export { MiniStepper }
