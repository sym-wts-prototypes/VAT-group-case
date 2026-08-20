import { useState } from 'react'
import { Download, Eye } from 'lucide-react'

import { Button, cn, Popover, PopoverContent, PopoverTrigger } from '@wts/ui'
import type { FileConfidence } from '@/config/requirements'

interface FileChipProps {
  name: string
  /** Present once a CIT AI-matcher result is known — renders the confidence dot: green/yellow
   *  for an actual match, gray while the file is still sitting unmatched. Absent entirely for a
   *  file that's simply attached to a requirement outside of matching (e.g. VAT/HR). */
  dot?: FileConfidence | 'unmatched'
  onDownload: (name: string) => void
  onPreview: (name: string) => void
  className?: string
}

const DOT_CLASS: Record<FileConfidence | 'unmatched', string> = {
  high: 'bg-green-600',
  medium: 'bg-yellow-400',
  unmatched: 'bg-muted-foreground/40',
}

/** CIT AI file-matcher simulation ticket — one clickable file chip, shared by the per-item "Ai
 *  matched files" rows, a plain preset-file attachment (VAT/HR), and every category's "All
 *  files" section. Clicking it opens a small popup offering Download (always) and Preview
 *  (.pdf only — opens the shared in-app preview Dialog owned by RequirementListAccordion.tsx). */
export function FileChip({ name, dot, onDownload, onPreview, className }: FileChipProps) {
  const [open, setOpen] = useState(false)
  const isPdf = name.toLowerCase().endsWith('.pdf')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-7 gap-1.5 rounded-full px-3 font-normal', className)}
        >
          {dot && (
            <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT_CLASS[dot])} aria-hidden />
          )}
          <span className="max-w-[220px] truncate">{name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 overflow-hidden rounded-xl p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="truncate border-b border-border px-4 py-3 text-sm font-medium text-foreground">
          {name}
        </p>
        {isPdf ? (
          <div className="flex gap-1 p-1">
            <Button
              type="button"
              variant="ghost"
              className="h-10 flex-1 justify-center gap-2 rounded-lg font-normal"
              onClick={() => {
                setOpen(false)
                onPreview(name)
              }}
            >
              <Eye className="h-4 w-4" aria-hidden />
              Preview
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 flex-1 justify-center gap-2 rounded-lg font-normal"
              onClick={() => {
                setOpen(false)
                onDownload(name)
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download
            </Button>
          </div>
        ) : (
          <div className="p-1">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-center gap-2 rounded-lg font-normal"
              onClick={() => {
                setOpen(false)
                onDownload(name)
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
