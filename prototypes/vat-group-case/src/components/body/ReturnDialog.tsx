import { useEffect, useState } from 'react'
import { Undo2, X } from 'lucide-react'

import { Button } from '@wts/ui'

const REASON_MAX = 500

interface ReturnDialogProps {
  open: boolean
  onClose: () => void
  /** Authority being returned (e.g. "Stadtverwaltung Berlin"). */
  authority: string
  /** Creator the item is returned to, for the prompt copy. */
  creatorName: string
  onSubmit?: (payload: { reason: string }) => void
}

/** Return-for-changes dialog — a reason is required and starts the thread. */
export function ReturnDialog({
  open,
  onClose,
  authority,
  creatorName,
  onSubmit,
}: ReturnDialogProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
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

  const canSubmit = reason.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit?.({ reason: reason.trim() })
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
        aria-labelledby="return-dialog-title"
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
            id="return-dialog-title"
            className="text-xl font-semibold leading-7 text-foreground"
          >
            Return for changes
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell {creatorName} what needs to change on {authority}. They&apos;ll
            see your note and can re-submit.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="return-reason"
            className="text-sm font-medium text-foreground"
          >
            Reason
          </label>
          <textarea
            id="return-reason"
            value={reason}
            maxLength={REASON_MAX}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain what needs to change before this can be approved."
            className="min-h-[100px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-header-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-right text-sm text-muted-foreground">
            {reason.length}/{REASON_MAX}
          </p>
        </div>

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
            className="flex-1 gap-2"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Undo2 className="h-4 w-4" />
            Return to creator
          </Button>
        </div>
      </div>
    </div>
  )
}
