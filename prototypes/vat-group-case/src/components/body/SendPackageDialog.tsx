import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@wts/ui'

const COMMENT_MAX_LENGTH = 1000

export interface SendPackageDetails {
  deadline: string
  comment: string
}

interface SendPackageDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  /** CIT has no deadline concept on this dialog — only VAT does. Defaults to shown. */
  showDeadline?: boolean
  onClose: () => void
  onConfirm: (details: SendPackageDetails) => void
}

/** Confirmation step for sending a tax package to the client or the tax authorities — reuses
 * CloseCaseDialog's Dialog/Label/Textarea layout, plus a required Checkbox (the
 * needs-changes-reopen-modal's own pattern) so the primary action can no longer fire on a
 * single accidental click. */
export function SendPackageDialog({
  open,
  title,
  description,
  confirmLabel,
  showDeadline = true,
  onClose,
  onConfirm,
}: SendPackageDialogProps) {
  const [deadline, setDeadline] = useState('')
  const [comment, setComment] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) {
      setDeadline('')
      setComment('')
      setConfirmed(false)
    }
  }, [open])

  const handleConfirm = () => {
    if (!confirmed) return
    onConfirm({ deadline, comment: comment.trim() })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent overlayClassName="bg-background/40 backdrop-blur-sm" className="flex max-w-[480px] flex-col gap-4">
        <DialogHeader className="gap-1.5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {showDeadline && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="send-package-deadline">Deadline (optional)</Label>
            <Input
              id="send-package-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="send-package-comment">Comment (optional)</Label>
          <Textarea
            id="send-package-comment"
            rows={3}
            maxLength={COMMENT_MAX_LENGTH}
            value={comment}
            placeholder="Add a message for the recipient."
            onChange={(e) => setComment(e.target.value)}
          />
          <span className="self-end text-muted-foreground text-xs">
            {comment.length}/{COMMENT_MAX_LENGTH}
          </span>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border px-3 py-2.5">
          <Checkbox
            className="mt-0.5"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
          />
          <span className="text-sm text-foreground">I confirm I want to send this package now.</span>
        </label>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="gap-2" disabled={!confirmed} onClick={handleConfirm}>
            <Send className="h-4 w-4" aria-hidden />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
