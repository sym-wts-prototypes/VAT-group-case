import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  EllipsisVertical,
  MessageSquareText,
  Trash2,
  X,
} from 'lucide-react'

import { Badge } from '@wts/ui'
import { Button } from '@wts/ui'
import { REQUIREMENT_CATEGORIES } from '@/config/requirements'
import type { RequirementCategoryStatus } from '@/config/requirements'
import { cn } from '@wts/ui'
import type { Role } from '@/types'

interface RequirementListAccordionProps {
  /** Draft: delete/remove. Post-draft: checkmarks + category actions (Figma 1928:72569). */
  variant?: 'draft' | 'postDraft'
  role?: Role
  className?: string
}

function categoryStatusTone(
  status: RequirementCategoryStatus | undefined,
): 'blue' | 'gray' | 'green' {
  switch (status) {
    case 'In Progress':
      return 'blue'
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
  if (variant === 'postDraft' && filesUploaded !== undefined) {
    const fileLabel =
      filesUploaded === 1 ? '1 file uploaded' : `${filesUploaded} files uploaded`
    return `${itemCount} Items · ${fileLabel}`
  }
  return `${itemCount} Items`
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

  function toggleCategory(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {REQUIREMENT_CATEGORIES.map((category) => {
        const isOpen = expanded[category.id] ?? false
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
                  <span className="px-1.5 py-[3px] leading-none">
                    {category.status}
                  </span>
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {!isDraft && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-9 gap-2 rounded-lg px-4 shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download as .zip
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg shadow-sm"
                      aria-label="Comments"
                    >
                      <MessageSquareText className="h-4 w-4" />
                    </Button>
                  </>
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
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
