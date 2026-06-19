import { useEffect, useRef, useState } from 'react'
import { Download, File as FileIcon, FileX, Upload, X } from 'lucide-react'

import { cn } from '@wts/ui'

const DEFAULT_MAX_BYTES = 300 * 1024 * 1024

interface FileDropzoneProps {
  id: string
  label: string
  onFileChange: (name: string | null) => void
  accept?: string
  hint?: string
  /** Max upload size in bytes (defaults to 300 MB). */
  maxBytes?: number
  /** Optional template download affordance shown to the right of the label. */
  templateLabel?: string
  onTemplateDownload?: () => void
}

interface SelectedFile {
  name: string
  size: number
}

/** Compact size label, e.g. "3.7 MB" / "120 KB". */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/**
 * Single-file upload card matching the Temp-File design (node 330:3138). States:
 * empty dropzone, uploading (progress), and error (unsupported type / over 5 MB).
 */
export function FileDropzone({
  id,
  label,
  onFileChange,
  accept = '.pdf,.docx',
  hint,
  maxBytes = DEFAULT_MAX_BYTES,
  templateLabel,
  onTemplateDownload,
}: FileDropzoneProps) {
  const maxLabel = `${Math.round(maxBytes / 1024 / 1024)} MB`
  const resolvedHint =
    hint ?? `Max file size is ${maxLabel}. Supported file types are pdf, docx.`
  const inputRef = useRef<HTMLInputElement>(null)
  const progressTimer = useRef<number>()
  const [dragActive, setDragActive] = useState(false)
  const [selected, setSelected] = useState<SelectedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const acceptExts = accept
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  const acceptLabel = acceptExts.map((ext) => ext.replace('.', '')).join(', ')

  const stopTimer = () => {
    if (progressTimer.current !== undefined) {
      window.clearInterval(progressTimer.current)
      progressTimer.current = undefined
    }
  }

  useEffect(() => () => stopTimer(), [])

  const runProgress = () => {
    stopTimer()
    setProgress(0)
    progressTimer.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          stopTimer()
          return 100
        }
        return Math.min(prev + 12, 100)
      })
    }, 70)
  }

  const validate = (file: File): string | null => {
    const name = file.name.toLowerCase()
    if (acceptExts.length && !acceptExts.some((ext) => name.endsWith(ext))) {
      return `Unsupported file type. Supported file types are ${acceptLabel}.`
    }
    if (file.size > maxBytes) {
      return `${formatFileSize(file.size)} - The file exceeds the ${maxLabel} size limit.`
    }
    return null
  }

  const acceptFile = (file: File | undefined) => {
    if (!file) return
    const validationError = validate(file)
    setSelected({ name: file.name, size: file.size })
    if (validationError) {
      stopTimer()
      setProgress(0)
      setError(validationError)
      onFileChange(null)
      return
    }
    setError(null)
    onFileChange(file.name)
    runProgress()
  }

  const clear = () => {
    stopTimer()
    setSelected(null)
    setError(null)
    setProgress(0)
    onFileChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {templateLabel && (
          <button
            type="button"
            onClick={onTemplateDownload}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm font-medium text-[hsl(var(--link))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" aria-hidden />
            {templateLabel}
          </button>
        )}
      </div>

      {selected ? (
        <div className="rounded-lg border border-border p-3">
          <div className="flex min-h-[60px] items-center gap-3 rounded-lg bg-muted px-4 py-3.5">
            {error ? (
              <FileX className="h-8 w-8 shrink-0 text-red-600" aria-hidden />
            ) : (
              <FileIcon className="h-8 w-8 shrink-0 text-foreground" aria-hidden />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <p className="truncate text-sm font-medium text-foreground">
                {selected.name}
              </p>
              {error ? (
                <p className="text-xs text-red-600">{error}</p>
              ) : progress >= 100 ? (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selected.size)}
                </p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-foreground transition-[width] duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    {formatFileSize(selected.size)} · {progress}%
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={clear}
              aria-label="Remove file"
              className="shrink-0 text-foreground transition-colors hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragActive(false)
            acceptFile(event.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex items-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dragActive && 'border-ring bg-muted',
          )}
        >
          <Upload
            className="h-8 w-8 shrink-0 text-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-base font-medium leading-none text-foreground">
              Drag &amp; Drop or click to choose file
            </p>
            <p className="text-sm text-muted-foreground">{resolvedHint}</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          acceptFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
