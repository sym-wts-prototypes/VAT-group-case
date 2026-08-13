import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

import { Button, DatePicker } from '@wts/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@wts/ui'
import { cn } from '@wts/ui'

import { FileDropzone } from './FileDropzone'

export type AssessmentLevel = 'Federal' | 'Municipal'

function dateToIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

interface AddItemDialogProps {
  open: boolean
  onClose: () => void
  onSubmit?: (payload: {
    level: AssessmentLevel
    authority: string
    dateReceived: string
    fileNames: string[]
  }) => void
}

/** "Add assessment item" form — create an item when a new document arrives. */
export function AddItemDialog({ open, onClose, onSubmit }: AddItemDialogProps) {
  const [level, setLevel] = useState<AssessmentLevel | ''>('')
  const [authority, setAuthority] = useState('')
  const [dateReceived, setDateReceived] = useState<Date | undefined>(undefined)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLevel('')
      setAuthority('')
      setDateReceived(undefined)
      setFileName(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const canSubmit =
    level !== '' &&
    authority.trim() !== '' &&
    dateReceived !== undefined &&
    fileName !== null

  const handleSubmit = () => {
    if (!canSubmit || !dateReceived) return
    onSubmit?.({
      level: level as AssessmentLevel,
      authority: authority.trim(),
      dateReceived: dateToIso(dateReceived),
      fileNames: fileName ? [fileName] : [],
    })
    onClose()
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/40 backdrop-blur-sm p-4 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-dialog-title"
        className="relative my-6 flex w-[560px] max-w-full flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="flex flex-col gap-1.5 pr-6">
          <h2
            id="add-item-dialog-title"
            className="text-xl font-semibold leading-7 text-foreground"
          >
            Add assessment item
          </h2>
          <p className="text-sm text-muted-foreground">
            Create an item when a new assessment document arrives. Cities can be
            added at any point during the filing period.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Level</label>
          <Select
            value={level}
            onValueChange={(value) => setLevel(value as AssessmentLevel)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Federal">Federal</SelectItem>
              <SelectItem value="Municipal">Municipal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="add-item-authority"
            className="text-sm font-medium text-foreground"
          >
            Authority / municipality
          </label>
          <input
            id="add-item-authority"
            type="text"
            value={authority}
            onChange={(event) => setAuthority(event.target.value)}
            placeholder="e.g. Stadt Frankfurt"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-header-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="add-item-date"
            className="text-sm font-medium text-foreground"
          >
            Date received
          </label>
          <DatePicker
            id="add-item-date"
            value={dateReceived}
            onChange={(date) => setDateReceived(date && date > today ? today : date)}
            placeholder="dd mm yyyy"
            className="w-full text-foreground"
          />
        </div>

        <FileDropzone
          id="add-item-upload"
          label="Upload assessment document"
          onFileChange={setFileName}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={cn('flex-1', !canSubmit && 'opacity-50')}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Add item
          </Button>
        </div>
      </div>
    </div>
  )
}
