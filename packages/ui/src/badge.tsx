import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium leading-none whitespace-nowrap transition-opacity [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        fill: '',
        soft: 'border',
      },
      tone: {
        default: '',
        gray: '',
        red: '',
        sky: '',
        orange: '',
        green: '',
        violet: '',
        blue: '',
      },
      size: {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-3.5 py-2 text-xs',
      },
    },
    compoundVariants: [
      // Fill style — solid bg, light text
      { variant: 'fill', tone: 'default', className: 'bg-accent-foreground text-primary-foreground' },
      { variant: 'fill', tone: 'gray', className: 'bg-neutral-300 text-foreground' },
      { variant: 'fill', tone: 'red', className: 'bg-red-600 text-white' },
      { variant: 'fill', tone: 'sky', className: 'bg-sky-500 text-white' },
      { variant: 'fill', tone: 'orange', className: 'bg-amber-500 text-white' },
      { variant: 'fill', tone: 'green', className: 'bg-green-600 text-white' },
      { variant: 'fill', tone: 'violet', className: 'bg-violet-600 text-white' },
      { variant: 'fill', tone: 'blue', className: 'bg-blue-600 text-white' },

      // Soft style — tinted bg, border, dark text
      { variant: 'soft', tone: 'default', className: 'bg-background border-border text-accent-foreground' },
      { variant: 'soft', tone: 'gray', className: 'bg-muted border-border text-accent-foreground' },
      { variant: 'soft', tone: 'red', className: 'bg-red-100 border-red-200 text-red-950' },
      { variant: 'soft', tone: 'sky', className: 'bg-sky-100 border-sky-200 text-sky-950' },
      { variant: 'soft', tone: 'orange', className: 'bg-amber-100 border-amber-200 text-amber-950' },
      { variant: 'soft', tone: 'green', className: 'bg-green-100 border-green-200 text-green-950' },
      { variant: 'soft', tone: 'violet', className: 'bg-violet-100 border-violet-200 text-violet-950' },
      { variant: 'soft', tone: 'blue', className: 'bg-blue-100 border-blue-200 text-blue-950' },
    ],
    defaultVariants: {
      variant: 'soft',
      tone: 'gray',
      size: 'sm',
    },
  },
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  disabled?: boolean
}

function Badge({ className, variant, tone, size, disabled, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({ variant, tone, size }),
        !disabled && 'hover:opacity-80',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
      aria-disabled={disabled || undefined}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
