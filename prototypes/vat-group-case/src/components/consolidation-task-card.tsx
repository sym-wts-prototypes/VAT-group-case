import { useState } from 'react'
import { ChevronDown, Download, File as FileIcon, Trash2, Upload } from 'lucide-react'

import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@wts/ui'

import { ConsolidationUploadModal, type StagedConsolidationFile } from '@/components/consolidation-upload-modal'
import { TASK_STATUS_LABELS, TASK_STATUS_TONE, type TaskStatus } from '@/lib/caseTasks'

// Segment 7 — replaces the old always-collapsed TaskRow + separate purple "all children ready"
// banner with a single expandable card: collapsed shows just the status, expanding reveals the
// uploaded documents (Feature 5 of the "VAT-registration alignment" ticket moved the generated
// bundle out to its own "Data Package" element above this card — see
// parent-vat-group-case-page.tsx — so this card is now Creator-uploaded documents only).

export type ConsolidationUploadedFile = StagedConsolidationFile

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface ConsolidationTaskCardProps {
  /** Every Child Case is Ready for Consolidation — until then the task stays 'notStarted' and
   * can't even be expanded. */
  canAct: boolean
  /** Creator only, and only while the task is still actionable (In Preparation) — Reviewer and
   * Partner get the same card read-only: no upload button, no Done control, download only. */
  canUpload: boolean
  uploadedFiles: ConsolidationUploadedFile[]
  /** Feature 5 — appends everything staged in one upload-modal session; multiple uploads (each
   * potentially with several files) keep adding to the list rather than replacing it. */
  onUploadFiles: (files: ConsolidationUploadedFile[]) => void
  onRemoveFile: (index: number) => void
  /** Feature 5 — the task never auto-completes just because files exist; only this explicit,
   * Creator-set flag does, and only it (not the file count) gates the header's next-step button
   * (see parent-vat-group-case-page.tsx's `primaryDisabled`). */
  isDone: boolean
  onDoneChange: (done: boolean) => void
}

export function ConsolidationTaskCard({
  canAct,
  canUpload,
  uploadedFiles,
  onUploadFiles,
  onRemoveFile,
  isDone,
  onDoneChange,
}: ConsolidationTaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const status: TaskStatus = !canAct ? 'notStarted' : isDone ? 'done' : 'inProgress'
  const canExpand = status !== 'notStarted'

  const helperText =
    status === 'notStarted' ? (
      <>
        Available when all child cases reach the <span className="italic">Ready for Consolidation</span> step
      </>
    ) : status === 'inProgress' ? (
      'Upload the consolidation documents, then mark this task Done to continue'
    ) : (
      'Consolidation documents uploaded — send it for internal review'
    )

  return (
    <div className="rounded-lg border border-border bg-background shadow-header-sm">
      <div className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={() => canExpand && setExpanded((v) => !v)}
          disabled={!canExpand}
          aria-expanded={expanded}
          aria-label={canExpand ? (expanded ? 'Collapse task' : 'Expand task') : undefined}
          className="flex min-w-0 flex-1 flex-col gap-0.5 text-left disabled:cursor-default"
        >
          <span className="text-sm font-medium text-foreground">Consolidation</span>
          <span className="text-xs text-muted-foreground">{helperText}</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {/* Feature 5 — the pill itself is the manual Done control for the Creator (matching
              the reference platform's own dropdown-badge pattern): defaults to "In progress"
              the moment the task becomes actionable and stays there — uploading files never
              flips it on its own — until the Creator explicitly picks "Done" here. */}
          {canUpload && canAct ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Badge tone={TASK_STATUS_TONE[status]} className="cursor-pointer">
                  {TASK_STATUS_LABELS[status]}
                  <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDoneChange(false)}>In progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDoneChange(true)}>Done</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge tone={TASK_STATUS_TONE[status]}>{TASK_STATUS_LABELS[status]}</Badge>
          )}
          <Badge tone="gray">
            {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
          </Badge>
          {/* Feature 5 — visible in the collapsed header too (not just once expanded), same as
              the reference platform's own task rows; opens the upload modal rather than a bare
              file input directly. */}
          {canUpload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload
            </Button>
          )}
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Collapse task' : 'Expand task'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                aria-hidden
              />
            </button>
          )}
        </div>
      </div>

      {expanded && canExpand && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3.5">
          {uploadedFiles.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          ) : (
            uploadedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                <FileIcon className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={`Download ${file.name}`}>
                    <Download className="h-4 w-4" aria-hidden />
                  </Button>
                  {canUpload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => onRemoveFile(index)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {canUpload && (
        <ConsolidationUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={onUploadFiles}
        />
      )}
    </div>
  )
}
