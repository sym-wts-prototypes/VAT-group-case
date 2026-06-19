import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border p-1 text-xs font-medium leading-none',
  {
    variants: {
      tone: {
        gray: 'border-[hsl(var(--badge-gray-border))] bg-[hsl(var(--badge-gray-bg))] text-[hsl(var(--badge-gray-fg))]',
        blue: 'border-[hsl(var(--badge-blue-border))] bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--badge-blue-fg))]',
        green:
          'border-[hsl(var(--badge-green-border))] bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--badge-green-fg))]',
        amber:
          'bg-[hsl(var(--badge-amber-bg))] text-[hsl(var(--badge-amber-fg))] border-transparent',
        red: 'bg-[hsl(var(--badge-red-bg))] text-[hsl(var(--badge-red-fg))] border-transparent',
        outline: 'border-border bg-background text-foreground',
      },
    },
    defaultVariants: {
      tone: 'gray',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
