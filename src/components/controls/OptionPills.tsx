import { cn } from '@/lib/cn'

export interface OptionPillItem<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface OptionPillsProps<T extends string> {
  label: string
  value: T
  options: OptionPillItem<T>[]
  onChange: (value: T) => void
  className?: string
}

/**
 * Segmented pill control — all options visible; selected state uses
 * filled primary styling.
 */
export function OptionPills<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: OptionPillsProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary text-primary-foreground shadow-[0_1px_1px_rgba(0,0,0,0.06)]'
                  : 'border-border bg-background text-foreground hover:border-muted-foreground/40 hover:bg-muted',
                option.disabled &&
                  'cursor-not-allowed opacity-40 hover:border-border hover:bg-background',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
