import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

import { Button, cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Textarea } from '@wts/ui'

import type { RequirementComment } from '@/config/requirements'

const MAX_COMMENT_LENGTH = 500

interface CommentsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  comments?: RequirementComment[]
  /** Requirements List comment notifications ticket — whether this thread currently has an
   * unseen new comment. No badge of its own here (that lives on the category's Comments button
   * — see RequirementListAccordion.tsx) — this only drives the `onRead` effect below. */
  hasUnseen?: boolean
  /** Fired once, right after the drawer is shown with `hasUnseen` true — marks the comment read
   * so the caller's own new-comment indicator and this badge both clear. */
  onRead?: () => void
  /** Fired with the trimmed text when the composer's Send is used — the caller appends it to
   * that category's in-memory comment list (see RequirementListAccordion's
   * `categoryComments`); nothing is persisted past the session. Omit for callers with no
   * comment-thread concept (e.g. the Client's bucket Comments drawer), which keeps Send inert. */
  onSend?: (text: string) => void
}

/** Shared by every "Comments" trigger in this prototype: the Requirements List (WTS) category
 *  drawer (title/comments/hasUnseen/onRead/onSend all wired — see RequirementListAccordion.tsx),
 *  and the Client's Requirement Bucket header/case bucket cards/opened category (still the old
 *  placeholder shell — no thread, Send stays inert — since those never pass the props above). */
export function CommentsDrawer({
  open,
  onOpenChange,
  title = 'General',
  comments,
  hasUnseen = false,
  onRead,
  onSend,
}: CommentsDrawerProps) {
  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  // Runs after the drawer's first paint (React fires effects post-paint), so a genuinely
  // unseen comment is visible in the red "New" state for a beat before this flips it to read —
  // not silently pre-cleared before the user ever sees it.
  useEffect(() => {
    if (open && hasUnseen) onRead?.()
  }, [open, hasUnseen, onRead])

  const commentList = comments ?? []

  // New messages land at the bottom of the thread, chat-style — scroll them into view instead
  // of leaving the reader wherever they were (or at the top, on first open).
  useEffect(() => {
    if (open) threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [open, commentList.length])

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    onSend?.(text)
    setDraft('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Comment thread</SheetDescription>
        </SheetHeader>
        <div ref={threadRef} className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {commentList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            commentList.map((comment) => (
              <div
                key={comment.id}
                className={cn('flex flex-col gap-1', comment.isOwn ? 'items-end' : 'items-start')}
              >
                <div className={cn('flex items-center gap-2 px-1', comment.isOwn && 'flex-row-reverse')}>
                  <span className="text-xs font-medium text-foreground">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                    comment.isOwn
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-muted text-foreground',
                  )}
                >
                  {comment.text}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Textarea
            placeholder="Write a comment..."
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!onSend}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {draft.length}/{MAX_COMMENT_LENGTH}
            </span>
            <Button type="button" disabled={!onSend || !draft.trim()} onClick={handleSend} className="gap-2">
              Send
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
