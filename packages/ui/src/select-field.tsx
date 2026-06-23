import * as React from 'react'
import { Info } from 'lucide-react'

import { cn } from './cn'
import { Label } from './label'
import { Select, SelectContent, SelectTrigger, SelectValue } from './select'

export interface SelectFieldProps {
  label?: string
  description?: string
  /** Truthy shows the error state; a string is rendered in place of the description. */
  error?: string | boolean
  /** Tooltip text shown via an info icon next to the label. */
  info?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  triggerClassName?: string
  /** SelectItem children. */
  children: React.ReactNode
}

/**
 * Form-field wrapper around Select — matches the WTS-ShadCn "Select" component
 * (label + optional info tooltip, description, and an error state in --destructive).
 */
function SelectField({
  label,
  description,
  error,
  info,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  triggerClassName,
  children,
}: SelectFieldProps) {
  const errorText = typeof error === 'string' ? error : undefined
  const hasError = Boolean(error)
  return (
    <div className={cn('grid gap-2', className)}>
      {label && (
        <div className="flex items-center gap-1">
          <Label>{label}</Label>
          {info && (
            <span title={info} className="inline-flex text-muted-foreground">
              <Info className="h-3.5 w-3.5" aria-label={info} />
            </span>
          )}
        </div>
      )}
      <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          aria-invalid={hasError || undefined}
          className={cn(hasError && 'border-destructive focus:ring-destructive', triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {(errorText || description) && (
        <p className={cn('text-sm', hasError ? 'text-destructive' : 'text-muted-foreground')}>
          {errorText || description}
        </p>
      )}
    </div>
  )
}
SelectField.displayName = 'SelectField'

export { SelectField }
