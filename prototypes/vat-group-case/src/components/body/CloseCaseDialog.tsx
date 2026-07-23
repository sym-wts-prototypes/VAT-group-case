import { useEffect, useState } from 'react'
import { CheckCheck } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@wts/ui'

const COMMENT_MAX_LENGTH = 1000

export interface CloseCaseComments {
  internalComment: string
  clientComment: string
}

interface CloseCaseDialogProps {
  open: boolean
  onClose: () => void
  /** Both comments are captured only here, once, at close time — there's no UI to add, edit,
   * or remove either afterwards (see the "Split closing comment" ticket, Segment 5). */
  onConfirm?: (comments: CloseCaseComments) => void
}

/** Creator reviews the close-out before archiving the case — matches the reference platform's
 * "View summary" dialog (reference/WTS%20Platform's assessment-closure feature) verbatim for
 * title/description/field copy, rebuilt here on this library's own Dialog/Textarea primitives
 * instead of the raw button/input markup this component used before. */
export function CloseCaseDialog({ open, onClose, onConfirm }: CloseCaseDialogProps) {
  const [internalComment, setInternalComment] = useState('')
  const [clientComment, setClientComment] = useState('')

  useEffect(() => {
    if (open) {
      setInternalComment('')
      setClientComment('')
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm?.({ internalComment: internalComment.trim(), clientComment: clientComment.trim() })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent overlayClassName="bg-background/40 backdrop-blur-sm" className="flex max-w-[480px] flex-col gap-4">
        <DialogHeader className="gap-1.5">
          <DialogTitle>View summary</DialogTitle>
          <DialogDescription>
            All assessments are resolved. Closing the case finalises it and moves it to the
            summary view.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="internal-closing-comment">Internal closing comment (optional)</Label>
          <Textarea
            id="internal-closing-comment"
            rows={3}
            maxLength={COMMENT_MAX_LENGTH}
            value={internalComment}
            placeholder="Add a note about this closure."
            onChange={(e) => setInternalComment(e.target.value)}
          />
          <span className="self-end text-muted-foreground text-xs">
            {internalComment.length}/{COMMENT_MAX_LENGTH}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-comment">Client comment (optional)</Label>
          <Textarea
            id="client-comment"
            rows={3}
            maxLength={COMMENT_MAX_LENGTH}
            value={clientComment}
            placeholder="Add a note for the client about this closure."
            onChange={(e) => setClientComment(e.target.value)}
          />
          <span className="self-end text-muted-foreground text-xs">
            {clientComment.length}/{COMMENT_MAX_LENGTH}
          </span>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="gap-2" onClick={handleConfirm}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            View summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
