import { Inbox, ListChecks, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface VatDraftEmptyStateProps {
  onOpenRequirements: () => void
  className?: string
}

/** Figma 5321:135513 — requirements not sent yet (VAT case draft). */
export function VatDraftEmptyState({
  onOpenRequirements,
  className,
}: VatDraftEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-border p-6',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-md border border-border bg-card shadow-header-sm">
        <Inbox className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="max-w-md text-center">
        <p className="text-xl font-semibold text-foreground">
          Requirements not sent yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sent automatically on the period close date. You can review and edit
          the requirements in the meantime.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="default" className="h-9 gap-2" onClick={onOpenRequirements}>
          <ListChecks className="h-4 w-4" />
          Open requirements
        </Button>
        <Button variant="outline" size="default" className="h-9 gap-2">
          <Plus className="h-4 w-4" />
          New requirement
        </Button>
      </div>
    </div>
  )
}
