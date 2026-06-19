import { useEffect } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface RemoveItemDialogProps {
  open: boolean
  onClose: () => void
  /** Assessment item name shown in the title. */
  itemName: string
  onConfirm?: () => void
}

/** Confirmation dialog for removing an assessment item from the case. */
export function RemoveItemDialog({
  open,
  onClose,
  itemName,
  onConfirm,
}: RemoveItemDialogProps) {
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
        aria-labelledby="remove-item-dialog-title"
        className="relative my-6 flex w-[440px] max-w-full flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
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
            id="remove-item-dialog-title"
            className="text-xl font-semibold leading-7 text-foreground"
          >
            Remove {itemName}?
          </h2>
          <p className="text-sm text-muted-foreground">
            This removes the assessment item from the case. You can add it again
            later.
          </p>
        </header>

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
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
          >
            Remove item
          </Button>
        </div>
      </div>
    </div>
  )
}
