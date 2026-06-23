import * as React from 'react'

import { cn } from './cn'
import { Checkbox } from './checkbox'

export interface CheckboxFieldProps {
  label: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const CheckboxField = React.forwardRef<HTMLLabelElement, CheckboxFieldProps>(
  (
    { label, description, checked, defaultChecked, onCheckedChange, disabled, className },
    ref,
  ) => (
    <label
      ref={ref}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <Checkbox
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </label>
  ),
)
CheckboxField.displayName = 'CheckboxField'

export { CheckboxField }
