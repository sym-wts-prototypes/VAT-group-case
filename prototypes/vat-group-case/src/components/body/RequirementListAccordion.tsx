import { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  EllipsisVertical,
  FileText,
  Info,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Toast,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@wts/ui'
import { REQUIREMENT_CATEGORIES } from '@/config/requirements'
import type { FileConfidence, MatchedFile, RequirementCategoryStatus } from '@/config/requirements'
import {
  unmatchedFilesForCategory,
  useAiMatchRun,
  useAiMatchRunCount,
  useRequirementCategories,
  useRequirementsStore,
  requirementTotals,
} from '@/store/useRequirementsStore'
import { FileChip } from '@/components/body/FileChip'
import { RequirementsProgressBar } from '@/components/body/RequirementsProgressBar'
import { CommentsDrawer, CommentsIndicatorIcon } from '@/components/body/CommentsDrawer'
import type { Process, Role } from '@/types'

interface RequirementListAccordionProps {
  /** Draft: delete/remove. Post-draft: checkmarks + category actions (Figma 1928:72569). */
  variant?: 'draft' | 'postDraft'
  role?: Role
  /** CIT AI file-matcher simulation ticket — gates every matched-files/confidence/"Ai match"
   *  affordance to CIT only; VAT/HR see the exact same categories, but only their plain preset
   *  attachments and a matching-free "All files" section. Optional because the draft variant
   *  never reaches any of that rendering (`isDraft` short-circuits first) and doesn't pass one. */
  process?: Process
  className?: string
}

function categoryStatusTone(
  status: RequirementCategoryStatus | undefined,
): 'sky' | 'gray' | 'green' {
  switch (status) {
    case 'In Progress':
      return 'sky'
    case 'Done':
      return 'green'
    default:
      return 'gray'
  }
}

/** Consistency ticket — the category header's "N files uploaded" count must always equal the
 *  number of chips the category's own "All files" section actually renders, so it's computed
 *  from the exact same source (`filesUploadedCount` below) rather than a separate hand-typed
 *  number that can silently drift out of sync. `undefined` (draft, or a process with nothing to
 *  count) omits the "· N files uploaded" clause entirely rather than claiming "0". */
function categorySubtitleText(
  itemCount: number,
  filesUploadedCount: number | undefined,
  variant: 'draft' | 'postDraft',
): string {
  const itemLabel = itemCount === 1 ? '1 requirement' : `${itemCount} requirements`
  if (variant === 'postDraft' && filesUploadedCount !== undefined) {
    const fileLabel =
      filesUploadedCount === 1 ? '1 file uploaded' : `${filesUploadedCount} files uploaded`
    return `${itemLabel} · ${fileLabel}`
  }
  return itemLabel
}

/** CIT AI file-matcher simulation ticket — a matched-files group's own confidence badge is the
 *  weakest link: "High" only once every file in the group is high-confidence. */
function overallConfidence(files: MatchedFile[]): FileConfidence {
  return files.every((f) => f.confidence === 'high') ? 'high' : 'medium'
}

const AI_MATCH_PENDING_MESSAGE = 'Files will appear here once AI matching is done.'

function AllFilesToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full cursor-pointer justify-between gap-4 rounded-none px-4 py-3 text-left font-medium text-foreground hover:bg-transparent"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Collapse all files' : 'Expand all files'}
    >
      <span className="text-sm font-medium text-foreground">All files</span>
      {isOpen ? (
        <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      )}
    </Button>
  )
}

/** WTS requirement list — draft or in-preparation+ accordion. */
export function RequirementListAccordion({
  variant = 'postDraft',
  role = 'creator',
  process,
  className,
}: RequirementListAccordionProps) {
  const isDraft = variant === 'draft'
  const isCit = process === 'cit'
  const showItemMenu = !isDraft && role === 'creator'
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      REQUIREMENT_CATEGORIES.map((cat, index) => [cat.id, index === 0]),
    ),
  )
  // Feature 4 (CIT AI file-matcher simulation ticket) — the bottom "All files" section's own
  // collapse state, independent per category (it can still be collapsed on its own while its
  // category stays open). Starts in sync with `expanded` above — expanding a category (below)
  // always expands its All files section too, so the two only ever drift apart via an explicit,
  // standalone collapse of All files itself.
  const [allFilesOpen, setAllFilesOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      REQUIREMENT_CATEGORIES.map((cat, index) => [cat.id, index === 0]),
    ),
  )
  // Simulated in-app preview — only ever opened for .pdf files (see FileChip).
  const [previewFileName, setPreviewFileName] = useState<string | null>(null)
  // Shared by every download action on this page (per-item file chips, the All files section,
  // the per-category "Download as .zip" button) — same controlled Toast pattern as
  // parent-vat-group-case-page.tsx's send/correction toasts.
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null)
  // "Comments" (icon button) opens this, scoped to whichever category was clicked — see
  // openComments below and CommentsDrawer's own title/comments/hasUnseen/onRead/onSend props.
  // The comment thread/seen state itself lives in useRequirementsStore (shared with the
  // Client's Requirement Bucket cards — see BodyPlaceholder.tsx's ClientBucketCardsBody), so
  // reading a new comment from either side clears it for both.
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false)
  const [activeCommentsCategoryId, setActiveCommentsCategoryId] = useState<string | null>(null)
  const categoryComments = useRequirementsStore((s) => s.categoryComments)
  const seenCategoryIds = useRequirementsStore((s) => s.seenCategoryIds)
  const sendComment = useRequirementsStore((s) => s.sendComment)
  const markCategorySeen = useRequirementsStore((s) => s.markCategorySeen)
  // CIT AI file-matcher simulation ticket — has "Start AI file matching" run yet, and "Clear
  // matching" (un-sorts one item's matched files back into its category's unmatched pool).
  const aiMatchRun = useAiMatchRun()
  const aiMatchRunCount = useAiMatchRunCount()
  const clearItemMatching = useRequirementsStore((s) => s.clearItemMatching)
  // A category's own new-comment state — drives both the row's Comments button badge and, for
  // whichever category is currently open, the drawer's own badge.
  const hasUnseenComment = (categoryId: string) =>
    !seenCategoryIds[categoryId] && (categoryComments[categoryId]?.some((c) => c.isNew) ?? false)

  const activeCommentsCategory = REQUIREMENT_CATEGORIES.find((cat) => cat.id === activeCommentsCategoryId)
  const openComments = (categoryId: string) => {
    setActiveCommentsCategoryId(categoryId)
    setCommentsDrawerOpen(true)
  }

  // Shared with the Client's Requirement Bucket view (useRequirementsStore) — checking an item
  // there, or the Playground's own "Simulate requirement adding or removing" control, moves
  // this view's own progress bar too.
  const categories = useRequirementCategories()
  const { done, total } = requirementTotals(categories)
  const allExpanded = categories.every((cat) => expanded[cat.id])

  function toggleCategory(id: string) {
    const willOpen = !expanded[id]
    setExpanded((prev) => ({ ...prev, [id]: willOpen }))
    // Expanding a category expands its All files section along with it (see `allFilesOpen`'s
    // own comment above) — collapsing the category leaves All files' own state untouched, since
    // it's simply not rendered while its category is closed anyway.
    if (willOpen) {
      setAllFilesOpen((prev) => ({ ...prev, [id]: true }))
    }
  }

  function toggleExpandAll() {
    const next = !allExpanded
    setExpanded(Object.fromEntries(categories.map((cat) => [cat.id, next])))
    if (next) {
      setAllFilesOpen(Object.fromEntries(categories.map((cat) => [cat.id, true])))
    }
  }

  function toggleAllFiles(id: string) {
    setAllFilesOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // CIT AI file-matcher simulation ticket — running (or re-running) the matcher expands every
  // category, and each category's own All files section, so the result is immediately visible
  // without the user having to open each one by hand. Keyed on the run *count* (not the boolean
  // "has it run" state) so a second, later re-run expands everything again even if the user had
  // since collapsed some categories.
  useEffect(() => {
    if (aiMatchRunCount === 0) return
    setExpanded(Object.fromEntries(categories.map((cat) => [cat.id, true])))
    setAllFilesOpen(Object.fromEntries(categories.map((cat) => [cat.id, true])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMatchRunCount])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {!isDraft && (
        <RequirementsProgressBar
          done={done}
          total={total}
          allExpanded={allExpanded}
          onExpandAll={toggleExpandAll}
          onDownloadAll={() => setDownloadedFileName('All files')}
        />
      )}
      {categories.map((category) => {
        const isOpen = expanded[category.id] ?? false
        const isAllFilesOpen = allFilesOpen[category.id] ?? false
        // CIT — this category's AI-matcher state: does it have any files to match at all, and
        // (once matching has run) which of them actually landed on a requirement.
        const aiPool = category.aiMatchPool ?? []
        const hasAiCapability = aiPool.length > 0
        const aiMatchedFiles = category.items.flatMap((item) => item.matchedFiles ?? [])
        const unmatchedFiles = unmatchedFilesForCategory(category)
        // VAT/HR — every requirement's plain preset attachment, flattened for the category's
        // All files section. CIT ignores this entirely (its files only ever come via matching).
        const plainAttachedFiles = category.items.flatMap((item) => (item.file ? [item.file] : []))
        // Every category gets an All files section, even one with nothing uploaded at all — it
        // just renders with explanatory copy instead of chips (see below) rather than
        // disappearing outright.
        const hasAllFilesSection = true
        // Consistency ticket — same source of truth the All files section itself renders from,
        // so the subtitle can never claim a count the chips below don't back up.
        const filesUploadedCount = isCit
          ? hasAiCapability
            ? aiPool.length
            : undefined
          : plainAttachedFiles.length > 0
            ? plainAttachedFiles.length
            : undefined
        return (
          <div
            key={category.id}
            className="flex flex-col overflow-hidden rounded-lg border border-border"
          >
            <div
              className={cn(
                'flex min-h-20 flex-wrap items-center gap-4 bg-accent px-4 py-4',
                isOpen ? 'rounded-t-lg' : 'rounded-lg',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-6 text-card-foreground">
                  {category.title}
                </p>
                <p className="text-sm leading-5 text-muted-foreground">
                  {categorySubtitleText(category.items.length, filesUploadedCount, variant)}
                </p>
              </div>

              {!isDraft && category.status && (
                <Badge tone={categoryStatusTone(category.status)}>
                  {category.status}
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {!isDraft &&
                  (() => {
                    const categoryUnseen = hasUnseenComment(category.id)
                    return (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg shadow-sm"
                        aria-label={categoryUnseen ? 'Comments (new)' : 'Comments'}
                        onClick={() => openComments(category.id)}
                      >
                        <CommentsIndicatorIcon hasUnseen={categoryUnseen} />
                      </Button>
                    )
                  })()}
                {!isDraft && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg shadow-sm"
                    aria-label="Download as .zip"
                    onClick={() => setDownloadedFileName(`${category.title}.zip`)}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </Button>
                )}
                {isDraft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    className="h-9 gap-2 px-4 text-sm font-medium"
                  >
                    Delete
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? 'Collapse category' : 'Expand category'}
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="flex flex-col">
                {category.items.map((item, index) => {
                  const checkState = item.checkState ?? 'open'
                  const matchedFiles = item.matchedFiles
                  const hasMatchedFiles = Boolean(matchedFiles && matchedFiles.length > 0)
                  // Feature 1 (CIT AI file-matcher simulation ticket) — this item IS a genuine
                  // future match target (per the category's deterministic demo assignment), but
                  // the matcher hasn't run yet — show the pending placeholder instead of nothing.
                  const isPendingMatch =
                    isCit && !aiMatchRun && Boolean(category.aiMatchAssignments?.[item.id])
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex min-h-24 border-t border-border bg-background',
                        // With matched files (chips can run several lines) the checkmark stays
                        // pinned to the top, next to the title — otherwise (nothing below the
                        // description) the whole row centers instead, so a short item doesn't
                        // read as top-anchored content floating above dead space.
                        hasMatchedFiles ? 'items-start' : 'items-center',
                        index === category.items.length - 1 && 'last:border-b-0',
                      )}
                    >
                      {!isDraft && (
                        <div className="flex shrink-0 items-center p-2.5">
                          <Check
                            className={cn(
                              'h-5 w-5',
                              checkState === 'done'
                                ? 'text-green-600'
                                : 'text-muted-foreground/30',
                            )}
                            aria-hidden
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 p-2.5">
                        <p className="truncate text-sm font-medium leading-5 text-foreground">
                          {item.id} / {item.title}
                        </p>
                        <p className="truncate text-sm leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                        {isCit && hasMatchedFiles && matchedFiles && (
                          <div className="mt-3 flex flex-col gap-2">
                            <div className="-mr-2.5 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                                <Sparkles className="h-4 w-4" aria-hidden />
                                Ai matched files
                              </span>
                              <Badge tone={overallConfidence(matchedFiles) === 'high' ? 'green' : 'yellow'}>
                                {overallConfidence(matchedFiles) === 'high' ? 'High' : 'Medium'} confidence
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span tabIndex={0} className="inline-flex">
                                        <Info className="h-3.5 w-3.5" aria-hidden />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      How confident the AI is that these files satisfy this requirement.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </Badge>
                              <div className="h-px min-w-8 flex-1 bg-border" aria-hidden />
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto shrink-0 gap-1 p-0 pr-0 text-sm"
                                onClick={() => clearItemMatching(item.id)}
                              >
                                <X className="h-3.5 w-3.5" aria-hidden />
                                Clear matching
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {matchedFiles.map((file) => (
                                <FileChip
                                  key={file.name}
                                  name={file.name}
                                  dot={file.confidence}
                                  onDownload={setDownloadedFileName}
                                  onPreview={setPreviewFileName}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {isPendingMatch && (
                          <p className="mt-3 text-sm text-muted-foreground">
                            {AI_MATCH_PENDING_MESSAGE}
                          </p>
                        )}
                      </div>
                      {isDraft && (
                        <div className="flex shrink-0 items-center p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="default"
                            className="h-9 gap-2 px-4 text-sm font-medium"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                      {showItemMenu && (
                        <div className="flex shrink-0 items-center p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label="More actions"
                          >
                            <EllipsisVertical className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Feature 4 (CIT AI file-matcher simulation ticket) — every file this category
                    has, matched or not, so any of them can be previewed/downloaded even when
                    it isn't (yet) sorted onto a specific requirement. Deliberately no tinted
                    background here — same plain bg-background/border-t as the rows above it. */}
                {!isDraft && hasAllFilesSection && (
                  <div className="border-t border-border bg-background">
                    <AllFilesToggle
                      isOpen={isAllFilesOpen}
                      onToggle={() => toggleAllFiles(category.id)}
                    />
                    {isAllFilesOpen && (
                      <>
                        <div className="mx-4 border-t border-border/50" aria-hidden />
                        <div className="flex flex-col gap-3 px-4 py-3">
                          {isCit ? (
                            <>
                              <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Matched
                                </p>
                                {!aiMatchRun ? (
                                  <p className="text-sm text-muted-foreground">{AI_MATCH_PENDING_MESSAGE}</p>
                                ) : aiMatchedFiles.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {aiMatchedFiles.map((file) => (
                                      <FileChip
                                        key={file.name}
                                        name={file.name}
                                        dot={file.confidence}
                                        onDownload={setDownloadedFileName}
                                        onPreview={setPreviewFileName}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No files were matched in this category.
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Not matched
                                </p>
                                {unmatchedFiles.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {unmatchedFiles.map((file) => (
                                      <FileChip
                                        key={file.name}
                                        name={file.name}
                                        dot="unmatched"
                                        onDownload={setDownloadedFileName}
                                        onPreview={setPreviewFileName}
                                      />
                                    ))}
                                  </div>
                                ) : aiPool.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No files have been uploaded for this category yet.
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Every uploaded file has been matched to a requirement.
                                  </p>
                                )}
                              </div>
                            </>
                          ) : plainAttachedFiles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {plainAttachedFiles.map((file) => (
                                <FileChip
                                  key={file.name}
                                  name={file.name}
                                  dot="unmatched"
                                  onDownload={setDownloadedFileName}
                                  onPreview={setPreviewFileName}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No files have been uploaded for this category yet.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <Dialog
        open={previewFileName != null}
        onOpenChange={(open) => !open && setPreviewFileName(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
            <FileText className="h-12 w-12" aria-hidden />
            <p className="text-sm">Preview not available in this demo</p>
          </div>
        </DialogContent>
      </Dialog>

      <Toast
        open={downloadedFileName != null}
        onOpenChange={(open) => !open && setDownloadedFileName(null)}
        title={`${downloadedFileName} downloaded successfully.`}
      />

      <CommentsDrawer
        open={commentsDrawerOpen}
        onOpenChange={setCommentsDrawerOpen}
        title={activeCommentsCategory?.title}
        comments={activeCommentsCategoryId ? categoryComments[activeCommentsCategoryId] : undefined}
        hasUnseen={Boolean(activeCommentsCategoryId) && hasUnseenComment(activeCommentsCategoryId ?? '')}
        onRead={() => activeCommentsCategoryId && markCategorySeen(activeCommentsCategoryId)}
        onSend={(text) => activeCommentsCategoryId && sendComment(activeCommentsCategoryId, 'You', text)}
      />
    </div>
  )
}
