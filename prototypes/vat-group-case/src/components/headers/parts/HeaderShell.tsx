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
        // flex flex-col so a `flex-1` child (see CaseHeader.tsx) grows/shrinks against this
        // shell's actual resolved height — a `h-full` (percentage) child would instead resolve
        // against `auto` here (this shell has no explicit `height`, only `min-height`), which
        // is what caused content to intermittently overflow past the shell's bottom border.
        // `shrink-0` — this shell is a flex item of the page's own `flex-col overflow-y-auto`
        // wrapper; without it, that ancestor's flex-shrink pressure squeezes the shell down to
        // exactly its `min-height` floor whenever the page's total content is tall, clipping
        // the shell's own content instead of just letting the page scroll (what overflow-y-auto
        // is there for). The shell should always be exactly as tall as its content needs.
        'flex w-full shrink-0 flex-col border-b border-border bg-primary-foreground text-foreground',
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
