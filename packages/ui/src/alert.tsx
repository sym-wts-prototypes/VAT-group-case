import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react'

import { cn } from './cn'

const alertVariants = cva(
  'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-5 [&>svg]:mt-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        // info matches the project's CitInReviewReconfirmBanner exactly.
        info: 'border-sky-200 bg-sky-50 text-sky-950 [&>svg]:text-sky-800',
        success: 'border-green-200 bg-green-50 text-green-950 [&>svg]:text-green-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-950 [&>svg]:text-amber-700',
        destructive: 'border-red-200 bg-red-50 text-red-950 [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

const DEFAULT_ICON = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleX,
} as const

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  /** Override the per-variant icon, or pass null to hide it. */
  icon?: React.ComponentType<{ className?: string }> | null
  title?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', icon, title, children, className, ...props }, ref) => {
    const v = variant ?? 'info'
    const Icon = icon === undefined ? DEFAULT_ICON[v] : icon
    return (
      <div
        ref={ref}
        role={v === 'destructive' || v === 'warning' ? 'alert' : 'status'}
        className={cn(alertVariants({ variant: v }), className)}
        {...props}
      >
        {Icon ? <Icon aria-hidden /> : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="font-medium">{title}</p> : null}
          {children}
        </div>
      </div>
    )
  },
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
