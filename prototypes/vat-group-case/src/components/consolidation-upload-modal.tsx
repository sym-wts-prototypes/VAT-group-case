import { useEffect, useRef, useState } from 'react'
import { File as FileIcon, Upload, X } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@wts/ui'

export interface StagedConsolidationFile {
  name: string
  size: number
}

export interface ConsolidationUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fires once, with everything staged in this session — the Creator can pick files in more
   * than one pass (Feature 5 of the "VAT-registration alignment" ticket: "the user CAN upload
   * multiple files") before confirming. */
  onUpload: (files: StagedConsolidationFile[]) => void
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/** Feature 5 of the "VAT-registration alignment" ticket — clicking the Consolidation task's
 * "Upload" affordance opens this instead of triggering a bare file input directly, so the
 * Creator can stage several files (across several picks) and review the list before committing.
 * Feature 1/3 of the "upload modal & data-package visuals" ticket — the dropzone and the staged
 * file rows are copied from the reference folder's own FileDropzone/StagedFileItem (gray, not
 * blue; same layout, spacing, and icon treatment) rather than a one-off blue look. */
export function ConsolidationUploadModal({ open, onOpenChange, onUpload }: ConsolidationUploadModalProps) {
  const [staged, setStaged] = useState<StagedConsolidationFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setStaged([])
  }, [open])

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setStaged((prev) => [...prev, ...Array.from(fileList).map((f) => ({ name: f.name, size: f.size }))])
  }
  const removeStaged = (index: number) =>
    setStaged((prev) => prev.filter((_, i) => i !== index))

  const handleConfirm = () => {
    if (staged.length === 0) return
    onUpload(staged)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="bg-background/40 backdrop-blur-sm" className="flex max-w-lg flex-col gap-4">
        <DialogHeader className="gap-1.5">
          <DialogTitle>Upload consolidation documents</DialogTitle>
          <DialogDescription>
            Select one or more files to add to the consolidated Group Case package.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-muted-foreground/40 px-6 py-6 transition-colors hover:border-muted-foreground/60"
        >
          <Upload className="h-10 w-10 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium">Drag &amp; Drop or Choose file to upload</p>
            <p className="text-xs text-muted-foreground">
              You can select multiple files, one pick at a time.
            </p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {staged.length > 0 && (
          <>
            <Separator />
            <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
              {staged.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-muted/80 px-4 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center">
                    <FileIcon className="size-8 text-foreground/70" aria-hidden />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${file.name} from the upload`}
                    onClick={() => removeStaged(index)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter className="gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" disabled={staged.length === 0} onClick={handleConfirm}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
