import { cn } from '@wts/ui'

export interface ProcessTabItem<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface ProcessTabsProps<T extends string> {
  label: string
  value: T
  options: ProcessTabItem<T>[]
  onChange: (value: T) => void
  className?: string
}

/** Segmented tab control — used for the Process switch in the control panel. */
export function ProcessTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: ProcessTabsProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex items-center gap-1 rounded-lg bg-muted p-1"
      >
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex flex-1 items-center justify-center rounded-md px-3 py-1 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                selected
                  ? 'bg-background shadow-header-base'
                  : 'hover:bg-background/50',
                option.disabled &&
                  'cursor-not-allowed opacity-40 hover:bg-transparent',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  selected ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
