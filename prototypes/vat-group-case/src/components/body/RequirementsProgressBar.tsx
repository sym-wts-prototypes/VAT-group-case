import { ChevronDown, ChevronUp, Download } from 'lucide-react'

import { Button, Progress, cn } from '@wts/ui'

interface RequirementsProgressBarProps {
  done: number
  total: number
  /** Omit to hide the "Expand all" button entirely — the Client view doesn't get one. */
  onExpandAll?: () => void
  allExpanded?: boolean
  onDownloadAll: () => void
  className?: string
}

/** The Requirements List (WTS) and Requirement Bucket (Client) landing views share this exact
 *  summary row — same underlying data (see useRequirementsStore's useRequirementCategories),
 *  just with "Expand all" present only on the WTS side. */
export function RequirementsProgressBar({
  done,
  total,
  onExpandAll,
  allExpanded = false,
  onDownloadAll,
  className,
}: RequirementsProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3',
        className,
      )}
    >
      {onExpandAll && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-2"
          onClick={onExpandAll}
        >
          {allExpanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden />
          )}
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </Button>
      )}

      <Progress value={percent} className="h-2 flex-1" indicatorClassName="bg-green-600" />

      <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
        {done} of {total} items complete
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 gap-2"
        onClick={onDownloadAll}
      >
        <Download className="h-4 w-4" aria-hidden />
        Download all
      </Button>
    </div>
  )
}
