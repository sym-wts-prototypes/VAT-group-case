import { useEffect, useRef, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/cn'

import { FileDropzone } from './FileDropzone'

export type AssessmentLevel = 'Federal' | 'Municipal'

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
  const [dateReceived, setDateReceived] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setLevel('')
      setAuthority('')
      setDateReceived('')
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
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const canSubmit =
    level !== '' &&
    authority.trim() !== '' &&
    dateReceived !== '' &&
    fileName !== null

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit?.({
      level: level as AssessmentLevel,
      authority: authority.trim(),
      dateReceived,
      fileNames: fileName ? [fileName] : [],
    })
    onClose()
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6"
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
          <div
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-header-sm focus-within:ring-2 focus-within:ring-ring"
            onClick={() => dateInputRef.current?.showPicker?.()}
          >
            <CalendarDays
              className="h-4 w-4 shrink-0 text-foreground"
              aria-hidden
            />
            <input
              ref={dateInputRef}
              id="add-item-date"
              type="date"
              value={dateReceived}
              max={todayIso}
              onChange={(event) => {
                const value = event.target.value
                setDateReceived(value && value > todayIso ? todayIso : value)
              }}
              className="w-full bg-transparent text-foreground focus-visible:outline-none"
            />
          </div>
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
