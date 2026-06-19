import { cn } from '@wts/ui'

export type HeaderShellVariant = 'case' | 'slim'

interface HeaderShellProps {
  children: React.ReactNode
  className?: string
  /** Case header ~210px content; slim headers ~136px (requirements / bucket). */
  variant?: HeaderShellVariant
  /** Matrix view: tighter padding, smaller type via child props. */
  compact?: boolean
}

/**
 * Figma headers are full-width strips: bg #fafafa, bottom border only.
 * Not rounded cards with drop shadows.
 */
export function HeaderShell({
  children,
  className,
  variant = 'case',
  compact,
}: HeaderShellProps) {
  return (
    <div
      className={cn(
        'w-full border-b border-border bg-primary-foreground text-foreground',
        compact ? 'px-4 py-3' : 'px-6 py-6',
        variant === 'case' && !compact && 'min-h-[210px]',
        variant === 'slim' && !compact && 'min-h-[136px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
