import * as React from 'react'

import { cn } from './cn'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0-100. Values outside that range are clamped. */
  value: number
  /** Overrides the fill's color classes (defaults to `bg-foreground`) — e.g. a status-driven
   * bar can pass the same `bg-amber-500`/`bg-green-600` tones Badge's orange/green tones use. */
  indicatorClassName?: string
}

/** Same track/fill treatment as FileDropzone's upload progress bar (h-2, rounded-full,
 * bg-border track, bg-foreground fill) — kept as a standalone primitive so any page that
 * tracks a percentage (not just a file upload) can reuse the same visual language. */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className, indicatorClassName, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value))
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('h-2 w-full overflow-hidden rounded-full bg-border', className)}
        {...props}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-150', indicatorClassName ?? 'bg-foreground')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    )
  },
)
Progress.displayName = 'Progress'

export { Progress }
