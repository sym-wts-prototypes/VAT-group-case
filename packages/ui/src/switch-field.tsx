import * as React from 'react'

import { cn } from './cn'
import { Switch } from './switch'

export interface SwitchFieldProps {
  label: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  /** Place the label to the left of the toggle (default: right). */
  labelPosition?: 'left' | 'right'
  className?: string
}

const SwitchField = React.forwardRef<HTMLLabelElement, SwitchFieldProps>(
  (
    {
      label,
      description,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      labelPosition = 'right',
      className,
    },
    ref,
  ) => {
    const isLeft = labelPosition === 'left'
    const textBlock = (
      <span
        className={cn(
          'flex flex-col gap-0.5',
          isLeft && 'flex-1 text-right',
        )}
      >
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    )

    return (
      <label
        ref={ref}
        className={cn(
          'flex cursor-pointer items-start gap-3 [&>[role=switch]]:mt-0.5',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        {labelPosition === 'left' && textBlock}
        <Switch
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        {labelPosition === 'right' && textBlock}
      </label>
    )
  },
)
SwitchField.displayName = 'SwitchField'

export { SwitchField }
