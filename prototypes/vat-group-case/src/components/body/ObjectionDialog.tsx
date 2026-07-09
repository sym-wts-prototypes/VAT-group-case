import { useEffect, useState } from 'react'
import { Landmark, X } from 'lucide-react'

import { Button } from '@wts/ui'
import { SAMPLE_CASE_IDS, SAMPLE_CASE_TITLE } from '@/config/sampleData'
import { cn } from '@wts/ui'

import { FileDropzone } from './FileDropzone'

const COMMENT_MAX = 500

interface ObjectionDialogProps {
  open: boolean
  onClose: () => void
  /** Authority being objected to (e.g. "Stadtverwaltung Berlin"). */
  authority: string
  received?: string
  onSubmit?: (payload: {
    comment: string
    cleanAssessment: string | null
  }) => void
}

/** Figma 278:645 — Create objection case dialog (CIT Assessment & Closure). */
export function ObjectionDialog({
  open,
  onClose,
  authority,
  received,
  onSubmit,
}: ObjectionDialogProps) {
  const [comment, setComment] = useState('')
  const [cleanAssessment, setCleanAssessment] = useState<string | null>(null)

  // Reset transient state whenever the dialog is opened.
  useEffect(() => {
    if (open) {
      setComment('')
      setCleanAssessment(null)
    }
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

  const caseLabel = `${SAMPLE_CASE_IDS.cit} / ${SAMPLE_CASE_TITLE.cit.join(' · ')}`
  const canSubmit = cleanAssessment !== null

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit?.({ comment, cleanAssessment })
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="objection-dialog-title"
        className="relative my-6 flex w-[600px] max-w-full flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
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
            id="objection-dialog-title"
            className="text-xl font-semibold leading-7 text-foreground"
          >
            Create an objection case?
          </h2>
          <p className="text-sm text-muted-foreground">
            Start an internal objection case for this assessment. Nothing is filed
            with the tax authority yet — you can manage and submit it from the
            objection case later.
          </p>
        </header>

        <div className="rounded-lg border border-border bg-muted/40">
          <div className="border-b border-border px-4 py-3 text-sm text-foreground">
            {caseLabel}
          </div>
          <div className="flex items-center gap-2 p-4">
            <Landmark className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {authority}
              </p>
              {received && (
                <p className="truncate text-sm text-muted-foreground opacity-90">
                  {received}
                </p>
              )}
            </div>
          </div>
        </div>

        <FileDropzone
          id="objection-clean-assessment-upload"
          label="Upload assessment without yellow pages"
          onFileChange={setCleanAssessment}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="objection-comment"
            className="text-sm font-medium text-foreground"
          >
            Comment (Optional)
          </label>
          <textarea
            id="objection-comment"
            value={comment}
            maxLength={COMMENT_MAX}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Note the deviation for the record."
            className="min-h-[100px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-header-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-right text-sm text-muted-foreground">
            {comment.length}/{COMMENT_MAX}
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
            variant="destructive"
            className={cn('flex-1', !canSubmit && 'opacity-50')}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Propose objection
          </Button>
        </div>
      </div>
    </div>
  )
}
