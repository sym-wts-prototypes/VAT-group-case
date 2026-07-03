import * as React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'
import { buttonVariants } from './button'
import { cn } from './cn'

export interface ConfirmDialogProps {
  /** Controls visibility. */
  open: boolean
  /** Fired when the dialog requests to close (overlay click, Esc, Cancel). */
  onOpenChange: (open: boolean) => void
  /** Fired when the confirm action is clicked. The dialog closes automatically. */
  onConfirm: () => void
  /** Title, e.g. "Remove user?". */
  title: React.ReactNode
  /** Supporting copy describing the consequence of the action. */
  description?: React.ReactNode
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string
  /** Renders the confirm button in the destructive (red) style. Defaults to true. */
  destructive?: boolean
  /** Optional content rendered between the description and the footer. */
  children?: React.ReactNode
}

/**
 * Shared confirmation dialog used for every removal / dismissal / disable action.
 * Mirrors the WTS "Alert Dialog" component in Figma: 20px semibold title, muted
 * description, and a right-aligned outline Cancel + destructive Confirm footer.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl leading-7">{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="flex-row gap-2 space-x-0 sm:space-x-0">
          <AlertDialogCancel className="mt-0 flex-1">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn('flex-1', destructive && buttonVariants({ variant: 'destructive' }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
