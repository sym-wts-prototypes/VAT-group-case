import { useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'

/**
 * Item-level comment. Built as a list now so a future thread / side-drawer can
 * reuse the same shape with no rework.
 */
export interface AssessmentComment {
  author: string
  role: string
  text: string
  /** ISO timestamp. */
  time: string
  type: 'return'
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface CommentsAffordanceProps {
  comments: AssessmentComment[]
  /** Reviewer first name — when set, renders the amber "Returned by" pill. */
  returnedBy?: string
}

/**
 * Right-side comments affordance. Renders the amber return pill for a returned
 * item, or a bare speech-bubble + count when it merely has history. Clicking
 * opens a read-only thread popover — the drop-in point for a future side-drawer.
 */
export function CommentsAffordance({
  comments,
  returnedBy,
}: CommentsAffordanceProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!returnedBy && comments.length === 0) return null

  return (
    <div ref={containerRef} className="relative shrink-0">
      {returnedBy ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-medium leading-none text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          Returned by {returnedBy}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={`${comments.length} comment${comments.length === 1 ? '' : 's'}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium leading-none text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          {comments.length}
        </button>
      )}

      {open && <CommentThreadPanel comments={comments} />}
    </div>
  )
}

/** Read-only thread panel. Swap this for a side-drawer later without API churn. */
function CommentThreadPanel({ comments }: { comments: AssessmentComment[] }) {
  return (
    <div
      role="dialog"
      aria-label="Comments"
      className="absolute right-0 top-full z-40 mt-2 w-80 rounded-lg border border-border bg-popover p-3 text-left shadow-header-base"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Comments
      </p>
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {comments.map((comment, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {comment.author}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.role}
                </span>
              </div>
              {comment.type === 'return' && (
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  Returned
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {comment.text}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatTime(comment.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
