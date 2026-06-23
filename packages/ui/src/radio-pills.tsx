import { cn } from './cn'

export interface RadioPillItem<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface RadioPillsProps<T extends string = string> {
  label: string
  value: T
  options: RadioPillItem<T>[]
  onChange: (value: T) => void
  className?: string
}

export function RadioPills<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: RadioPillsProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-col gap-2"
      >
        {options.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-3',
                option.disabled
                  ? 'cursor-not-allowed opacity-40'
                  : 'cursor-pointer',
              )}
            >
              <input
                type="radio"
                name={label}
                className="size-4 shrink-0 accent-primary"
                checked={selected}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <span
                className={cn(
                  'text-sm',
                  selected ? 'font-medium text-foreground' : 'text-foreground',
                )}
              >
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
