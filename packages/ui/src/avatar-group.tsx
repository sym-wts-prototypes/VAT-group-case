import * as React from 'react'

import { cn } from './cn'

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Overlapping avatar stack — wrap `Avatar` (or `AvatarGroupCount`) children in this to get the
 * negative-margin overlap + background-colored ring that separates each disc from the next.
 */
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center -space-x-2 [&>*]:ring-2 [&>*]:ring-background', className)}
      {...props}
    >
      {children}
    </div>
  ),
)
AvatarGroup.displayName = 'AvatarGroup'

export interface AvatarGroupCountProps extends React.HTMLAttributes<HTMLDivElement> {
  count: number
}

/** The "+N" overflow disc appended to an `AvatarGroup` past its visible-avatar limit. */
const AvatarGroupCount = React.forwardRef<HTMLDivElement, AvatarGroupCountProps>(
  ({ count, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    >
      +{count}
    </div>
  ),
)
AvatarGroupCount.displayName = 'AvatarGroupCount'

export { AvatarGroup, AvatarGroupCount }
