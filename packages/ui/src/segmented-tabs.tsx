import { cn } from './cn'
import { Badge } from './badge'

export interface SegmentedTabItem<T extends string = string> {
  value: T
  label: string
  count?: number
  disabled?: boolean
}

export interface SegmentedTabsProps<T extends string = string> {
  label: string
  value: T
  options: SegmentedTabItem<T>[]
  onChange: (value: T) => void
  className?: string
}

export function SegmentedTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
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
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 transition-colors',
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
              {option.count != null && (
                <Badge
                  tone={selected ? 'sky' : 'gray'}
                  size="sm"
                >
                  {option.count}
                </Badge>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
