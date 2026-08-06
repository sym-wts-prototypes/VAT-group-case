import { Calendar, ChevronDown } from 'lucide-react'

import { Badge, cn } from '@wts/ui'

interface NextDeadlineProps {
  label: string
  date: string
  className?: string
}

/**
 * Case-header "Next Deadline" chip — replaces the plain Due Date badge on the case-level
 * header (Single Case, and the VAT Group Case's Parent/Child headers). Not wired to anything
 * yet: a static, non-interactive placeholder (no popover, no urgency colour-coding) — the
 * chevron just previews that this will expand into a full deadline list later.
 */
export function NextDeadline({ label, date, className }: NextDeadlineProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground',
        className,
      )}
    >
      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span>Next Deadline:</span>
      <Badge tone="blue">
        {label} - {date}
      </Badge>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </div>
  )
}
