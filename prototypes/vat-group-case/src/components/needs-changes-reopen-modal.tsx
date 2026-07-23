import { useEffect, useMemo, useRef, useState } from 'react'
import { File as FileIcon, Paperclip, RefreshCw, Search, X } from 'lucide-react'

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileDropzone,
  Input,
  Label,
  Textarea,
  cn,
} from '@wts/ui'

const PARENT_COMMENT_MAX_LENGTH = 500
const CHILD_COMMENT_MAX_LENGTH = 300

interface ChildFile {
  name: string
  size: number
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface ReopenableChildCase {
  id: string
  client: string
}

type ReopenChoice = 'no' | 'yes'

export interface NeedsChangesReopenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Named explicitly in the parent-comment label below (Feature 6 of the "button states &
   * child-case comments" ticket) so it's unambiguous which case that comment applies to. */
  parentCaseId: string
  /** Every Child Case in the group — all of them are listed, selection decides which get
   * reopened (see the "Reviewer/Client Needs Changes reopen" ticket, Segment 2). */
  childCases: ReopenableChildCase[]
  /** Fires when "Reopen child cases?" is Yes — only reachable in that state (Segment 4 of the
   * "review-flow rework" ticket), carrying the parent-level comment, exactly which Child Cases
   * were selected, and each selected Child Case's own optional comment (Feature 6), keyed by id. */
  onConfirmNeedsChanges: (
    parentComment: string,
    selectedChildIds: string[],
    childComments: Record<string, string>,
  ) => void
  /** Fires when "Reopen child cases?" is No — the only decision available in that state, since
   * nothing is being sent back. Carries the written comment so it can be reflected on the
   * Creator's (and everyone else's) approved banner. */
  onConfirmApprove: (comment: string) => void
}

/** Reviewer (In Review) / Client (Client Approval) review dialog — layout matches the reference
 * platform's "Submit review" dialog. The "Reopen child cases?" switcher (Segment 4) is the real
 * decision surface: No means the package is fine as-is (only Approve is available, dialog stays
 * narrow); Yes means specific Child Cases need to go back (only Need Changes is available, via
 * the searchable, scrollable multi-select plus a per-entity comment column — Feature 6 — which
 * is why the dialog widens considerably in that state, to fit all three columns without
 * truncating any entity name). */
export function NeedsChangesReopenModal({
  open,
  onOpenChange,
  parentCaseId,
  childCases,
  onConfirmNeedsChanges,
  onConfirmApprove,
}: NeedsChangesReopenModalProps) {
  const [parentComment, setParentComment] = useState('')
  // FileDropzone renders its own selected-file UI; nothing here needs to read the name back,
  // just hand it a setter to satisfy `onFileChange`.
  const [, setStagedFileName] = useState<string | null>(null)
  const [reopenChoice, setReopenChoice] = useState<ReopenChoice>('no')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // Feature 6 — one optional comment per selected Child Case, cleared the moment that Child
  // Case is deselected so a stale comment never gets submitted for an entity no longer reopened.
  const [childComments, setChildComments] = useState<Record<string, string>>({})
  // Change 2 (file-upload ticket) — one optional supporting document per selected Child Case,
  // same deselect-clears-it lifecycle as childComments above. Decorative like the parent-level
  // FileDropzone above (never read back by the confirm handlers) — this modal doesn't wire any
  // uploaded file into the store, only the comment text.
  const [childFiles, setChildFiles] = useState<Record<string, ChildFile>>({})
  const childFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!open) return
    setParentComment('')
    setStagedFileName(null)
    setReopenChoice('no')
    setSearch('')
    setSelectedIds(new Set())
    setChildComments({})
    setChildFiles({})
  }, [open])

  const visibleChildCases = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return childCases
    return childCases.filter((c) => c.client.toLowerCase().includes(q))
  }, [childCases, search])

  const toggle = (id: string) => {
    const wasSelected = selectedIds.has(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (wasSelected) {
      setChildComments((prev) => {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
      setChildFiles((prev) => {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const selectAllVisible = () =>
    setSelectedIds((prev) => new Set([...prev, ...visibleChildCases.map((c) => c.id)]))
  const clearSelection = () => {
    setSelectedIds(new Set())
    setChildComments({})
    setChildFiles({})
  }

  const handleClose = () => onOpenChange(false)
  const handleNeedChanges = () => {
    const relevantComments = Object.fromEntries(
      Object.entries(childComments)
        .filter(([id, text]) => selectedIds.has(id) && text.trim())
        .map(([id, text]) => [id, text.trim()]),
    )
    onConfirmNeedsChanges(parentComment, [...selectedIds], relevantComments)
    onOpenChange(false)
  }
  const handleApprove = () => {
    onConfirmApprove(parentComment)
    onOpenChange(false)
  }

  const isReopening = reopenChoice === 'yes'
  const selectedChildCases = childCases.filter((c) => selectedIds.has(c.id))
  const filledChildComments = selectedChildCases.filter((c) => childComments[c.id]?.trim()).length

  // Change 2 — the small paperclip button opens this Child Case's own hidden file input;
  // reused for both the first upload and "replace" (Change 4), same input either way.
  const handleChildFilePick = (id: string, file: File | undefined) => {
    if (!file) return
    setChildFiles((prev) => ({ ...prev, [id]: { name: file.name, size: file.size } }))
  }
  const handleChildFileRemove = (id: string) => {
    setChildFiles((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        overlayClassName="bg-background/40 backdrop-blur-sm"
        className={cn(
          'flex flex-col gap-4',
          // Change 6 — a definite height (not just a cap) so the flex-1 row below has real
          // space to grow into and shrink against; its own columns scroll internally instead of
          // the whole dialog growing past the viewport and scrolling as one long page. The NO
          // state's content is short and static, so a plain height cap + fallback scroll is fine.
          isReopening ? 'h-[80vh] max-w-[1360px]' : 'max-h-[85vh] max-w-[560px] overflow-y-auto',
        )}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle>Submit review</DialogTitle>
          <DialogDescription>
            You can upload files if needed before approving or requesting changes.
          </DialogDescription>
        </DialogHeader>

        {/* Layout-refinement ticket ("review modal YES-state polish") — two visually distinct
            regions when reopening: a fixed-width left column (parent-level fields) and a
            divider-separated right region that fills all remaining width via a 2-col grid (`fr`
            columns, not pixel caps, so there's no dead gap on the right at the wider max-width).
            `flex-1 min-h-0` only when reopening — lets this row grow to fill whatever's left of
            the dialog's own fixed height (Change 6) so its columns scroll internally instead of
            the whole dialog. Collapses back to just the left column when not reopening. */}
        <div className={cn('flex gap-6', isReopening && 'min-h-0 flex-1')}>
          {/* Change 5 (file-upload ticket) — fixed 420px only while reopening (sized so the
              parent-comment label fits on one line next to the wider right region); in the NO
              state this instead fills the whole (narrower) dialog width, so form elements sit
              flush with the right edge instead of leaving that width capped and empty. */}
          <div className={cn('flex flex-col gap-4', isReopening ? 'w-[420px] shrink-0' : 'w-full')}>
            <FileDropzone
              id="reopen-upload-documents"
              label="Upload additional documents (Optional)"
              onFileChange={setStagedFileName}
              accept=".csv,.xls,.xlsx"
              hint="Max file size is 5 MB. Supported file types are csv, xls, xlsx."
            />

            <div className="flex flex-col gap-1.5">
              {/* Feature 6 — explicitly names the Parent Case so it's unmistakable this note is
                  about the group as a whole, not any one entity (see the per-entity comments on
                  the right, which each name their own Child Case instead). Column width (420px)
                  is sized so this label fits on one line at any zoom level. */}
              <Label htmlFor="reopen-parent-comment" className="whitespace-nowrap">
                Parent case comment ({parentCaseId}){' '}
                <span className="font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Applies to the whole group case sent back to the creator.
              </p>
              <Textarea
                id="reopen-parent-comment"
                rows={3}
                maxLength={PARENT_COMMENT_MAX_LENGTH}
                value={parentComment}
                placeholder="Notes for the creator on the overall package…"
                onChange={(e) => setParentComment(e.target.value)}
              />
              <span className="self-end text-muted-foreground text-xs">
                {parentComment.length}/{PARENT_COMMENT_MAX_LENGTH}
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">Reopen child cases?</span>
                <div
                  role="radiogroup"
                  aria-label="Reopen child cases?"
                  className="flex shrink-0 overflow-hidden rounded-lg"
                >
                  <Button
                    type="button"
                    role="radio"
                    aria-checked={!isReopening}
                    size="sm"
                    variant={isReopening ? 'outline' : 'default'}
                    className="rounded-r-none"
                    onClick={() => setReopenChoice('no')}
                  >
                    No
                  </Button>
                  <Button
                    type="button"
                    role="radio"
                    aria-checked={isReopening}
                    size="sm"
                    variant={isReopening ? 'default' : 'outline'}
                    className="rounded-l-none border-l-0"
                    onClick={() => setReopenChoice('yes')}
                  >
                    Yes
                  </Button>
                </div>
              </div>
              {/* Own full-width row (not squeezed alongside the No/Yes buttons) so this fits on
                  one line instead of wrapping mid-sentence. */}
              <span className="text-xs text-muted-foreground">
                {isReopening
                  ? 'Yes — select the entities to send back for changes.'
                  : 'No — the package will be approved as is.'}
              </span>
            </div>
          </div>

          {isReopening && (
            <>
              {/* Change 5 — vertical divider marking the parent-case column off from the
                  entity-selection + comments region; stretches to match the taller sibling via
                  the row's default flex `align-items: stretch`. Feature 2 of the "reopen modal
                  rules" ticket — widened + darkened a shade from the plain `border` token (too
                  thin/light to read as a real divider at this width). */}
              <div className="w-0.5 shrink-0 bg-zinc-300" />

              <div className="grid min-w-0 flex-1 grid-cols-2 gap-6">
                <div className="flex min-h-0 flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Child cases to reopen</Label>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {selectedIds.size} of {childCases.length}
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search child cases…"
                      className="h-9 pl-8"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={selectAllVisible}
                      className="text-xs font-medium text-[hsl(var(--link))] hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-medium text-[hsl(var(--link))] hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Change 3/6 — fills the rest of the fixed-height column (flex-1 + min-h-0
                      instead of a max-h cap) so the frame reaches all the way to the column's
                      bottom, full width, scrolling internally once its own content overflows.
                      No `truncate` on the entity name: it wraps onto a second line instead of
                      clipping, matching the "no text overflow" requirement literally. */}
                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto rounded-md border border-border p-1">
                    {visibleChildCases.length === 0 ? (
                      <p className="px-2 py-6 text-center text-muted-foreground text-sm">
                        No matches. Try a different search term.
                      </p>
                    ) : (
                      visibleChildCases.map((child) => (
                        <label
                          key={child.id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 hover:bg-muted"
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={selectedIds.has(child.id)}
                            onCheckedChange={() => toggle(child.id)}
                          />
                          <span className="min-w-0 flex-1 text-foreground text-sm">
                            {child.client}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex min-h-0 flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Child case comments</Label>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {filledChildComments} of {selectedChildCases.length} filled
                    </span>
                  </div>
                  {/* Change 3 — short addition noting the (also optional) per-entity document,
                      not just the comment.
                      Feature 2 of the "reopen modal rules" ticket — a forced break at the
                      sentence boundary reads cleaner than letting the browser wrap wherever it
                      runs out of room, which left "Not" stranded at the end of the first line
                      and only "mandatory." on the second. */}
                  <p className="text-xs text-muted-foreground">
                    A note (and optional document) per child case being sent back.
                    <br />
                    Not mandatory.
                  </p>
                  {/* Change 3 — light frame added around the scroller (previously borderless),
                      matching the checklist's own frame; fills to the column's bottom the same
                      way, via flex-1 + min-h-0 instead of a max-h cap. */}
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-border p-2">
                    {selectedChildCases.length === 0 ? (
                      // Change 4 — plain informational message: solid border + muted fill,
                      // not the dashed drag-and-drop treatment (which read as an upload target).
                      <p className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-muted-foreground text-sm">
                        Select at least one child case to leave it a comment.
                      </p>
                    ) : (
                      selectedChildCases.map((child) => {
                        const file = childFiles[child.id]
                        return (
                          <div key={child.id} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              {/* Feature 6 — each comment names its own Child Case, so it's
                                  never ambiguous whose feedback this is (paired with the
                                  parent-comment label, which names the Parent Case instead). */}
                              <span className="min-w-0 text-sm font-medium text-foreground">{child.client}</span>
                              <span className="shrink-0 text-muted-foreground text-xs">{child.id}</span>
                            </div>
                            {/* Change 1 — ~2 lines by default (min-h override; the textarea
                                variants' own min-h-[80px] read closer to 3-4 lines), still
                                natively resizable via the corner handle if more room is needed.
                                Change 2 — the small paperclip button sits to the right of the
                                textarea, not below it, so it doesn't add its own row. */}
                            <div className="flex items-start gap-2">
                              <Textarea
                                rows={2}
                                maxLength={CHILD_COMMENT_MAX_LENGTH}
                                value={childComments[child.id] ?? ''}
                                placeholder="What needs rework for this entity?"
                                onChange={(e) =>
                                  setChildComments((prev) => ({ ...prev, [child.id]: e.target.value }))
                                }
                                className="min-h-[52px] flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8 shrink-0"
                                aria-label={file ? `Replace document for ${child.client}` : `Attach a document for ${child.client}`}
                                onClick={() => childFileInputRefs.current[child.id]?.click()}
                              >
                                <Paperclip className="size-3.5" aria-hidden />
                              </Button>
                              <input
                                ref={(el) => {
                                  childFileInputRefs.current[child.id] = el
                                }}
                                type="file"
                                className="hidden"
                                accept=".pdf,.csv,.xls,.xlsx,.docx"
                                onChange={(e) => {
                                  handleChildFilePick(child.id, e.target.files?.[0])
                                  e.target.value = ''
                                }}
                              />
                            </div>
                            {/* Change 4 — minimal uploaded-file row: name + size, a small
                                reupload control (reopens the same file picker) and a remove
                                control (clears it entirely), no larger than it needs to be. */}
                            {file && (
                              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 text-xs">
                                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
                                <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
                                <button
                                  type="button"
                                  aria-label={`Replace document for ${child.client}`}
                                  className="shrink-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => childFileInputRefs.current[child.id]?.click()}
                                >
                                  <RefreshCw className="size-3.5" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Remove document for ${child.client}`}
                                  className="shrink-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleChildFileRemove(child.id)}
                                >
                                  <X className="size-3.5" aria-hidden />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Alert variant="info">
          Approval sends the package back to the creator, not directly to the client.
        </Alert>

        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col sm:items-stretch sm:justify-normal sm:space-x-0">
          <div className="flex w-full gap-3">
            {/* Feature 1 of the "button states & child-case comments" ticket — both buttons keep
                their own color disabled or not (never fall back to the default black/primary
                variant); `disabled:opacity-50` on the base Button already supplies the muted
                look, so the color classes apply unconditionally.
                Feature 2 of the "reopen modal rules" ticket — reopening additionally requires at
                least one child case selected before Need Changes can fire; the comment and
                document stay optional (neither gates this). */}
            <Button
              type="button"
              disabled={!isReopening || selectedIds.size === 0}
              className="flex-1 bg-amber-600 text-white hover:bg-amber-600/90"
              onClick={handleNeedChanges}
            >
              Need Changes
            </Button>
            <Button
              type="button"
              disabled={isReopening}
              className="flex-1 bg-green-600 text-white hover:bg-green-600/90"
              onClick={handleApprove}
            >
              Approve
            </Button>
          </div>
          {isReopening ? (
            <p className={cn('text-center text-xs', selectedIds.size === 0 ? 'text-amber-700' : 'text-muted-foreground')}>
              {selectedIds.size === 0
                ? 'Select at least one child case to send back before confirming.'
                // Feature 2 of the "reopen modal rules" ticket — always states the child-case
                // count being returned, for both the Reviewer and Client variants of this modal,
                // which share this exact component.
                : `Returning the parent case + ${selectedIds.size} child case${selectedIds.size === 1 ? '' : 's'}.`}
            </p>
          ) : (
            // Feature 1 of the "reopen-modal NO-state copy" ticket — replaces the old fallback
            // ("Returning the parent case + 0 child cases."), which read as if child cases were
            // being sent back even though nothing is selected in the No state.
            <p className="text-center text-xs text-muted-foreground">
              You will approve the consolidated package.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
