import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Ellipsis,
  EllipsisVertical,
  Eye,
  File,
  FileText,
  MessageSquareText,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Toast,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@wts/ui'
import { REQUIREMENT_CATEGORIES } from '@/config/requirements'
import type { RequirementCategoryStatus } from '@/config/requirements'
import type { Role } from '@/types'

interface RequirementListAccordionProps {
  /** Draft: delete/remove. Post-draft: checkmarks + category actions (Figma 1928:72569). */
  variant?: 'draft' | 'postDraft'
  role?: Role
  className?: string
}

type CategoryView = 'requirements' | 'files'

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

function categorySubtitle(
  itemCount: number,
  filesUploaded: number | undefined,
  variant: 'draft' | 'postDraft',
) {
  const itemLabel = itemCount === 1 ? '1 requirement' : `${itemCount} requirements`
  if (variant === 'postDraft' && filesUploaded !== undefined) {
    const fileLabel =
      filesUploaded === 1 ? '1 file uploaded' : `${filesUploaded} files uploaded`
    return `${itemLabel} · ${fileLabel}`
  }
  return itemLabel
}

/** WTS requirement list — draft or in-preparation+ accordion. */
export function RequirementListAccordion({
  variant = 'postDraft',
  role = 'creator',
  className,
}: RequirementListAccordionProps) {
  const isDraft = variant === 'draft'
  const showItemMenu = !isDraft && role === 'creator'
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      REQUIREMENT_CATEGORIES.map((cat, index) => [cat.id, index === 0]),
    ),
  )
  // Requirements/Files switcher — lives in the "..." dropdown (see the screenshot this was
  // built from), not as a separate under-header element. Defaults to 'requirements' per category.
  const [view, setView] = useState<Record<string, CategoryView>>(() =>
    Object.fromEntries(REQUIREMENT_CATEGORIES.map((cat) => [cat.id, 'requirements' as const])),
  )
  // Simulated in-app preview — only ever opened for .pdf files (see the Files view below).
  const [previewFileName, setPreviewFileName] = useState<string | null>(null)
  // Shared by every download button on this page (per-row in Requirements view, per-file in
  // Files view) — same controlled Toast pattern as parent-vat-group-case-page.tsx's send/
  // correction toasts.
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null)

  function toggleCategory(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function setCategoryView(id: string, next: CategoryView) {
    setView((prev) => ({ ...prev, [id]: next }))
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {REQUIREMENT_CATEGORIES.map((category) => {
        const isOpen = expanded[category.id] ?? false
        const categoryView = view[category.id] ?? 'requirements'
        // The Files view is derived from the requirements' own attached files rather than a
        // separate demo-data list, so the two views can never disagree with each other.
        const categoryFiles = category.items.flatMap((item) => (item.file ? [item.file] : []))
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
                  {categorySubtitle(
                    category.items.length,
                    category.filesUploaded,
                    variant,
                  )}
                </p>
              </div>

              {!isDraft && category.status && (
                <Badge tone={categoryStatusTone(category.status)}>
                  {category.status}
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {!isDraft && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg shadow-sm"
                        aria-label="View options"
                      >
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[200px]">
                      <DropdownMenuLabel>View</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={categoryView === 'requirements'}
                        onCheckedChange={() => setCategoryView(category.id, 'requirements')}
                      >
                        Requirements
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={categoryView === 'files'}
                        onCheckedChange={() => setCategoryView(category.id, 'files')}
                      >
                        Files
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="h-4 w-4" />
                        Download as .zip
                      </DropdownMenuItem>
                      <DropdownMenuItem className="justify-between">
                        <span className="flex items-center gap-2">
                          <MessageSquareText className="h-4 w-4" />
                          Comments
                        </span>
                        {Boolean(category.commentsCount) && (
                          <Badge tone="gray" size="sm">
                            {category.commentsCount}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                {!isDraft && categoryView === 'files' ? (
                  categoryFiles.length === 0 ? (
                    <p className="border-t border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                      No files uploaded yet.
                    </p>
                  ) : (
                    categoryFiles.map((file, index) => {
                      const isPdf = file.name.toLowerCase().endsWith('.pdf')
                      return (
                        <div
                          key={`${file.name}-${index}`}
                          className={cn(
                            'flex min-h-24 items-center gap-3 border-t border-border bg-background px-4',
                            index === categoryFiles.length - 1 && 'last:border-b-0',
                          )}
                        >
                          <File className="h-8 w-8 shrink-0 text-foreground" aria-hidden />
                          <div className="min-w-0 flex-1 py-2.5">
                            <p className="truncate text-sm font-medium leading-5 text-foreground">
                              {file.name}
                            </p>
                            <p className="text-sm leading-5 text-muted-foreground">{file.size}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 p-2">
                            {isPdf ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                aria-label={`Preview ${file.name}`}
                                onClick={() => setPreviewFileName(file.name)}
                              >
                                <Eye className="h-4 w-4" aria-hidden />
                              </Button>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={0} className="inline-flex">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9"
                                        aria-label={`Preview ${file.name} (unavailable)`}
                                        disabled
                                      >
                                        <Eye className="h-4 w-4" aria-hidden />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Non .pdf files can not be previewed.</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              aria-label={`Download ${file.name}`}
                              onClick={() => setDownloadedFileName(file.name)}
                            >
                              <Download className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )
                ) : (
                  category.items.map((item, index) => {
                    const checkState = item.checkState ?? 'open'
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex min-h-24 items-center border-t border-border bg-background',
                          index === category.items.length - 1 && 'last:border-b-0',
                        )}
                      >
                        {!isDraft && (
                          <div className="flex shrink-0 items-center p-2.5">
                            <Check
                              className={cn(
                                'h-5 w-5',
                                checkState === 'done'
                                  ? 'text-foreground'
                                  : 'text-muted-foreground/30',
                              )}
                              aria-hidden
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 p-2.5">
                          <div className="px-2 py-2">
                            <p className="truncate text-sm font-medium leading-5 text-foreground">
                              {item.id} / {item.title}
                            </p>
                            <p className="truncate text-sm leading-5 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
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
                  })
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
    </div>
  )
}
