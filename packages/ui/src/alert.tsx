import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Info, CircleCheck, TriangleAlert, CircleAlert, X } from 'lucide-react'

import { cn } from './cn'

const alertVariants = cva(
  'flex items-center gap-4 rounded-md border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        default: 'border-border bg-background',
        info: 'border-border bg-sky-50',
        success: 'border-green-200 bg-green-50',
        warning: 'border-amber-200 bg-amber-50',
        destructive: 'border-red-200 bg-red-50',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

const VARIANT_ICON = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
} as const

const VARIANT_COLORS = {
  default: {
    icon: 'text-foreground',
    title: 'text-foreground',
    body: 'text-muted-foreground',
  },
  info: {
    icon: 'text-sky-700',
    title: 'text-sky-700',
    body: 'text-sky-700 opacity-90',
  },
  success: {
    icon: 'text-green-700',
    title: 'text-green-700',
    body: 'text-green-700 opacity-90',
  },
  warning: {
    icon: 'text-amber-700',
    title: 'text-amber-700',
    body: 'text-amber-700 opacity-90',
  },
  destructive: {
    icon: 'text-red-700',
    title: 'text-red-700',
    body: 'text-red-700 opacity-90',
  },
} as const

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  /** Override the per-variant icon, or pass null to hide it. */
  icon?: React.ComponentType<{ className?: string }> | null
  title?: React.ReactNode
  /** Optional badge below the description. */
  badge?: React.ReactNode
  /** Optional action element (e.g. Button) shown on the right. */
  action?: React.ReactNode
  /** Show a close button. Called when the user clicks X. */
  onClose?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      icon,
      title,
      badge,
      action,
      onClose,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const v = variant ?? 'info'
    const Icon = icon === undefined ? VARIANT_ICON[v] : icon
    const colors = VARIANT_COLORS[v]
    const showIcon = Icon !== null

    return (
      <div
        ref={ref}
        role={v === 'destructive' || v === 'warning' ? 'alert' : 'status'}
        className={cn(alertVariants({ variant: v }), className)}
        {...props}
      >
        {/* Content column */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Title row */}
          {title && (
            <div className="flex items-center gap-3">
              {showIcon && (
                <Icon
                  aria-hidden
                  className={cn('h-4 w-4 shrink-0', colors.icon)}
                />
              )}
              <p className={cn('min-w-0 flex-1 text-sm font-medium leading-5', colors.title)}>
                {title}
              </p>
            </div>
          )}

          {/* Body/description row */}
          {children && (
            <div className="flex items-center gap-3">
              {showIcon && title && <div className="h-4 w-4 shrink-0" />}
              <div className={cn('min-w-0 flex-1 text-sm leading-5', colors.body)}>
                {children}
              </div>
            </div>
          )}

          {/* Badge slot */}
          {badge && (
            <div className="flex items-center gap-3 pt-2">
              {showIcon && title && <div className="h-4 w-4 shrink-0" />}
              {badge}
            </div>
          )}
        </div>

        {/* Action button */}
        {action}

        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 self-start pt-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
