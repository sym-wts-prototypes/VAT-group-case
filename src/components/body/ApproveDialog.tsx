import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { FileDropzone } from './FileDropzone'

const NOTE_MAX = 500

interface ApproveDialogProps {
  open: boolean
  onClose: () => void
  /** Authority being approved (e.g. "Stadtverwaltung Berlin"). */
  authority: string
  onSubmit?: (payload: {
    flagged: boolean
    note: string
    cleanAssessment: string | null
  }) => void
}

/**
 * Approve dialog — confirm the assessment matches the working sheet, with an
 * optional "flag a minor issue" path that reveals a required note.
 */
export function ApproveDialog({
  open,
  onClose,
  authority,
  onSubmit,
}: ApproveDialogProps) {
  const [flagged, setFlagged] = useState(false)
  const [note, setNote] = useState('')
  const [cleanAssessment, setCleanAssessment] = useState<string | null>(null)
  const approveRef = useRef<HTMLButtonElement>(null)

  // Reset to the clean path each time the dialog opens, and focus Approve so
  // Enter confirms immediately.
  useEffect(() => {
    if (!open) return
    setFlagged(false)
    setNote('')
    setCleanAssessment(null)
    const id = requestAnimationFrame(() => approveRef.current?.focus())
    return () => cancelAnimationFrame(id)
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

  const canSubmit =
    cleanAssessment !== null && (!flagged || note.trim().length > 0)

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit?.({ flagged, note: flagged ? note.trim() : '', cleanAssessment })
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
        aria-labelledby="approve-dialog-title"
        className="relative my-6 flex w-[480px] max-w-full flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
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
            id="approve-dialog-title"
            className="text-xl font-semibold leading-7 text-foreground"
          >
            Approve assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Confirm that {authority} matches the working sheet.
          </p>
        </header>

        <FileDropzone
          id="approve-clean-assessment-upload"
          label="Upload assessment without yellow pages"
          onFileChange={setCleanAssessment}
        />

        <label className="flex cursor-pointer items-start gap-2 py-[9px]">
          <input
            type="checkbox"
            checked={flagged}
            onChange={(event) => setFlagged(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-sm text-foreground">
            Flag an issue to carry into next year.
          </span>
        </label>

        {flagged && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="approve-note"
              className="text-sm font-medium text-foreground"
            >
              Note
            </label>
            <textarea
              id="approve-note"
              value={note}
              maxLength={NOTE_MAX}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Describe the issue to carry into next year."
              className="min-h-[100px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-header-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-right text-sm text-muted-foreground">
              {note.length}/{NOTE_MAX}
            </p>
          </div>
        )}

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
            ref={approveRef}
            type="button"
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Propose approval
          </Button>
        </div>
      </div>
    </div>
  )
}
