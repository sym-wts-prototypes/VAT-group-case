import { cn } from '@wts/ui'

export interface PhaseRadioItem<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface PhaseRadiosProps<T extends string> {
  label: string
  value: T
  options: PhaseRadioItem<T>[]
  onChange: (value: T) => void
  className?: string
}

/** Vertical radio-button group for selecting the phase. */
export function PhaseRadios<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: PhaseRadiosProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
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
                  selected
                    ? 'font-medium text-foreground'
                    : 'text-foreground',
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
