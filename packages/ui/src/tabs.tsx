import type { ReactNode } from 'react'

import { cn } from './cn'

export interface TabItem<T extends string = string> {
  value: T
  /** Tab label. Accepts ReactNode so consumers can include icons next to text. */
  label: ReactNode
  count?: number
  disabled?: boolean
}

export interface TabsProps<T extends string = string> {
  /** Visual style. Matches Figma "Style" property. */
  variant?: 'button' | 'line'
  label?: string
  value: T
  options: TabItem<T>[]
  onChange: (value: T) => void
  className?: string
}

/** Count badge — matches Figma BadgeNumber: rounded-md, input bg, 12px regular. */
function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-input px-1 py-0.5 text-xs font-normal leading-none text-foreground">
      {children}
    </span>
  )
}

export function Tabs<T extends string>({
  variant = 'button',
  label,
  value,
  options,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}

      {variant === 'button' ? (
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
                {option.count != null && <CountBadge>{option.count}</CountBadge>}
              </button>
            )
          })}
        </div>
      ) : (
        <div
          role="tablist"
          aria-label={label}
          className="flex items-stretch border-b border-border"
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
                  'flex items-center justify-center gap-1.5 px-4 py-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  '-mb-px border-b-2',
                  selected
                    ? 'border-foreground'
                    : 'border-transparent hover:border-border',
                  option.disabled && 'cursor-not-allowed opacity-40',
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
                {option.count != null && <CountBadge>{option.count}</CountBadge>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
