import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border font-medium leading-none [&>svg]:size-3',
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
      size: {
        // sm == the original Badge look (default) so existing usages are unchanged.
        sm: 'p-1 text-xs',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      tone: 'gray',
      size: 'sm',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />
}

export { Badge, badgeVariants }
