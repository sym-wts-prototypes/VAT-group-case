import { useEffect, useState } from 'react'
import { CheckCheck, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface CloseCaseDialogProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
}

/** Creator confirms all assessments are resolved before closing the case. */
export function CloseCaseDialog({
  open,
  onClose,
  onConfirm,
}: CloseCaseDialogProps) {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) setConfirmed(false)
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

  const handleConfirm = () => {
    if (!confirmed) return
    onConfirm?.()
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="close-case-dialog-title"
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
            id="close-case-dialog-title"
            className="text-xl font-semibold leading-7 text-foreground"
          >
            Close case?
          </h2>
          <p className="text-sm text-muted-foreground">
            All assessments are resolved. Closing archives the submission
            package, receipt, and tax assessment documents for reference.
          </p>
        </header>

        <label className="flex cursor-pointer items-start gap-2 py-[9px]">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-sm text-foreground">
            I confirm all assessments are resolved and the case can be closed.
          </span>
        </label>

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
            disabled={!confirmed}
            onClick={handleConfirm}
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Close case
          </Button>
        </div>
      </div>
    </div>
  )
}
