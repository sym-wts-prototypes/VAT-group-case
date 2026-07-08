import { cn } from './cn'

export interface OptionPillItem<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface OptionPillsProps<T extends string = string> {
  label: string
  value: T
  options: OptionPillItem<T>[]
  onChange: (value: T) => void
  className?: string
  /** Overrides the default uppercase/muted caption style — e.g. to match a standard form Label. */
  labelClassName?: string
}

export function OptionPills<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  labelClassName,
}: OptionPillsProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className={cn('text-xs font-medium uppercase tracking-wide text-muted-foreground', labelClassName)}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
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
