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

/** Requirement List chips per case type ticket — the case's own identity, shown under the
 *  Requirements/Due Date row on the Requirement List/Bucket headers, for every role except
 *  Client. Fixed pill order: parent's full case name (VAT Group Child Case only, via
 *  `ParentCaseIndicator`'s blue-layers icon) · legal entity name · case name · VAT reg. number.
 *  See `HeaderDescriptor.caseIdentity`'s own doc for the exact composition per process/case
 *  type. */
export function CaseIdentityPills({
  parentCaseName,
  legalEntityName,
  caseName,
  vatRegNumber,
}: {
  parentCaseName?: string
  legalEntityName?: string
  caseName?: string
  vatRegNumber?: string
}) {
  if (!parentCaseName && !legalEntityName && !caseName && !vatRegNumber) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {parentCaseName && <ParentCaseIndicator name={parentCaseName} />}
      {legalEntityName && <InfoPill>{legalEntityName}</InfoPill>}
      {caseName && <InfoPill>{caseName}</InfoPill>}
      {vatRegNumber && <InfoPill>{vatRegNumber}</InfoPill>}
    </div>
  )
}

/** Group Case Child Case only — distinguishes it from a regular Single Case. Plain, non-
 * interactive: no href/onClick, so it never reads as a link back to the parent case. Shared by
 * the Case header and the Requirement List/Bucket headers' `CaseIdentityPills` above. */
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
