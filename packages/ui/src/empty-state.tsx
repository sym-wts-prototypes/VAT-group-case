import type { ReactNode } from 'react'

import { cn } from './cn'

export interface EmptyStateProps {
  /** Icon shown inside the rounded tile. Size it `size-6 text-muted-foreground` to match the design. */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Optional action row (e.g. one or two Buttons). Omit for a prompt-only empty state. */
  action?: ReactNode
  /** Draw the dashed container border. Defaults to true. */
  bordered?: boolean
  className?: string
}

/**
 * Shared empty-state prompt (Figma 5321:135513). A centered icon tile, title and
 * description inside an optional dashed container, with an optional action row.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  bordered = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[320px] w-full flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6',
        bordered && 'border border-dashed border-border',
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-md border border-border bg-card shadow-header-sm">
          {icon}
        </div>
      )}
      <div className="max-w-md text-center">
        <p className="text-xl font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
        </div>
      )}
    </div>
  )
}
