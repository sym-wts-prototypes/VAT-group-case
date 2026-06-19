import { cn } from '@/lib/cn'
import type { HeaderTitle } from '@/types'

interface TitleProps {
  title: HeaderTitle
  size?: 'case' | 'slim'
  className?: string
}

/**
 * Case title: "CIT · Return · FY2026" — only the service (first segment) is muted.
 * Slim title: single line, 24px (Requirements, Requirement Category, etc.).
 */
export function Title({ title, size = 'case', className }: TitleProps) {
  if (title.parts && title.parts.length > 0) {
    return (
      <h1
        className={cn(
          'flex flex-wrap items-center gap-2 font-display font-medium leading-9 tracking-tight',
          size === 'case' ? 'text-[30px]' : 'text-2xl leading-none',
          className,
        )}
      >
        {title.parts.map((part, i) => (
          <span key={`${part}-${i}`} className="inline-flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-foreground">
                ·
              </span>
            )}
            <span
              className={cn(
                i === 0 ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {part}
            </span>
          </span>
        ))}
      </h1>
    )
  }

  return (
    <h1
      className={cn(
        'font-display font-medium text-foreground tracking-tight',
        size === 'case' ? 'text-[30px] leading-9' : 'text-2xl leading-none',
        className,
      )}
    >
      {title.plain}
    </h1>
  )
}

/** Company + VAT code pills below the case title. */
export function TitleSubtitle({ title }: { title: HeaderTitle }) {
  if (!title.subtitle && !title.subCode) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {title.subtitle && <InfoPill>{title.subtitle}</InfoPill>}
      {title.subCode && <InfoPill>{title.subCode}</InfoPill>}
    </div>
  )
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-[3px] text-xs font-medium leading-none text-foreground">
      {children}
    </span>
  )
}
