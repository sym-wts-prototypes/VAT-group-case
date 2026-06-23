import * as React from 'react'
import { Upload } from 'lucide-react'

import { cn } from './cn'

export interface DropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  onFiles?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  /** Secondary hint line, e.g. accepted types/size. */
  hint?: string
  disabled?: boolean
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  ({ onFiles, accept, multiple, hint = 'PDF, PNG or JPG up to 10MB', disabled, className, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = React.useState(false)

    const emit = (list: FileList | null) => {
      if (list && list.length && onFiles) onFiles(Array.from(list))
    }

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return
          e.preventDefault()
          setDragging(false)
          emit(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          dragging && 'border-primary bg-accent',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        {...props}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag files here or <span className="text-[hsl(var(--link))]">click to upload</span>
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => emit(e.target.files)}
        />
      </div>
    )
  },
)
Dropzone.displayName = 'Dropzone'

export { Dropzone }
