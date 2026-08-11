import { Send } from 'lucide-react'

import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Textarea } from '@wts/ui'

interface CommentsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Placeholder shell only — no real comment communication wired up yet (no persisted thread,
 *  Send is always inert). Shared by every "Comments" trigger in this prototype: the Requirements
 *  List (WTS) category dropdown, and the Client's Requirement Bucket header/case bucket cards/
 *  opened category. */
export function CommentsDrawer({ open, onOpenChange }: CommentsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>General</SheetTitle>
          <SheetDescription>Comment thread</SheetDescription>
        </SheetHeader>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Textarea placeholder="Write a comment..." rows={3} maxLength={500} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">0/500</span>
            <Button type="button" disabled className="gap-2">
              Send
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
