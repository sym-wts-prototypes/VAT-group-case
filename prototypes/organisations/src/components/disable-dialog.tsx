import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@wts/ui'

import { Organization } from './organizations-data'

export function DisableDialog({
  org,
  onCancel,
  onConfirm,
}: {
  org: Organization
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <AlertDialogTitle className="font-display text-lg font-bold tracking-tight">
                Disable this organization?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Disabling {org.name} removes it from active operational use while preserving all
                historical data, legal entities, engagements, and users. It can be re-enabled later.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>No, keep active</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, disable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
