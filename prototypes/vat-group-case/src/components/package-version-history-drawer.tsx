import { Download } from 'lucide-react'

import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@wts/ui'

import { SAMPLE_PEOPLE } from '@/config/sampleData'

export interface PackageVersionHistoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageFileName: string
}

// Feature 4 of the "VAT-registration alignment" ticket — a single static v1.0 entry is
// realistic enough for a prototype (this is the first submission of the package; there's
// nothing earlier to show yet) and keeps this in step with the same demo-timestamp convention
// used across every other banner on this page, rather than inventing a parallel date format.
const VERSION_DATE = '12.03.2026'
const VERSION_UPLOADER = SAMPLE_PEOPLE.creator ?? 'Emma Fischer'

/** Reused wherever a "Version history" action exists on this page (the Data Package element and
 * every yellow/purple review banner) — same drawer, same content, since they all describe the
 * same package. */
export function PackageVersionHistoryDrawer({
  open,
  onOpenChange,
  packageFileName,
}: PackageVersionHistoryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Package version history</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{VERSION_DATE}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3.5">
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">
              v1.0 · {VERSION_UPLOADER}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={`Download ${packageFileName}`}
            >
              <Download className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
