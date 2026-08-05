import * as React from 'react'
import { CircleCheck, X } from 'lucide-react'

import { cn } from './cn'

export interface ToastProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}

// Fixed-position, single-toast notification — no queue/stacking (nothing in this design system
// needs more than one at a time yet). Deliberately not built on a toast library: this is the
// first place a toast is needed at all, and a single self-contained component is simpler than
// wiring up a new dependency for one call site. If a second, unrelated toast need shows up,
// promote this to a real queue then.
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ open, onOpenChange, title, description, className }, ref) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          'fixed right-6 top-6 z-[100] flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-lg',
          'animate-in fade-in slide-in-from-top-2 duration-300',
          className,
        )}
      >
        <CircleCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  },
)
Toast.displayName = 'Toast'

export { Toast }
