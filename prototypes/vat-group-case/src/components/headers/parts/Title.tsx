import { Layers } from 'lucide-react'

import { cn } from '@wts/ui'
import type { HeaderTitle } from '@/types'

interface TitleProps {
  title: HeaderTitle
  size?: 'case' | 'slim'
  className?: string
}

const SIZE_CLASSES = {
  case: 'text-[30px] leading-9',
  slim: 'text-2xl leading-none',
} as const

/**
 * Case title: "CIT · Return · FY2026" — only the service (first segment) is muted.
 * Slim title: single line, 24px (Requirements, Requirement Category, etc.).
 */
export function Title({ title, size = 'case', className }: TitleProps) {
  if (title.parts && title.parts.length > 0) {
    return (
      <h1
        className={cn(
          'flex flex-wrap items-center gap-2 font-display font-medium tracking-tight',
          SIZE_CLASSES[size],
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
        SIZE_CLASSES[size],
        className,
      )}
    >
      {title.plain}
    </h1>
  )
}

/** Feature 1 of the "requirements header enrichment" ticket — the underlying case's own name +
 * company/VAT tags (+ "Part of {parent}" for a Child Case), shown under the Requirement List/
 * Bucket headers' "Back" link so the case stays identifiable there. Same building blocks, same
 * "case" size, CaseHeader itself uses for its own title — matched on request rather than
 * shrunk to fit, so the case name reads with the same weight it has on the Case page. */
export function CaseIdentity({ title, parentCaseName }: { title: HeaderTitle; parentCaseName?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Title title={title} size="case" />
      <div className="flex flex-wrap items-center gap-1.5">
        <TitleSubtitle title={title} />
        {parentCaseName && <ParentCaseIndicator name={parentCaseName} />}
      </div>
    </div>
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

/** Group Case Child Case only — distinguishes it from a regular Single Case. Plain, non-
 * interactive: no href/onClick, so it never reads as a link back to the parent case. */
export function ParentCaseIndicator({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-1.5 py-[3px] text-xs font-medium leading-none text-foreground">
      <Layers className="h-3 w-3 shrink-0 text-blue-600" aria-hidden />
      Part of {name}
    </span>
  )
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-[3px] text-xs font-medium leading-none text-foreground">
      {children}
    </span>
  )
}
