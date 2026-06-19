import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { ActionDescriptor, NextStepMenuDescriptor } from '@/types'

import { Icon } from './Icon'
import { NextStepDropdown } from './NextStepDropdown'

interface ActionsProps {
  primary?: ActionDescriptor
  nextStep?: NextStepMenuDescriptor
  secondary?: ActionDescriptor[]
  primaryDisabled?: boolean
  onPrimaryClick?: (label: string) => void
  size?: 'default' | 'sm' | 'lg'
  /** Requirement list/bucket: all buttons are outline in Figma. */
  allOutline?: boolean
  /** Client bucket: Mark as done uses a checkbox (Figma 5346:112616). */
  markAsDoneChecked?: boolean
  onMarkAsDoneChange?: (checked: boolean) => void
  className?: string
}

function ActionButton({
  action,
  variant,
  size,
  disabled,
  onClick,
}: {
  action: ActionDescriptor
  variant?: ActionDescriptor['variant']
  size?: 'default' | 'sm' | 'lg'
  disabled?: boolean
  onClick?: () => void
}) {
  const resolvedVariant = action.variant ?? variant ?? 'default'
  const iconSide = action.iconSide ?? 'left'

  return (
    <Button
      variant={resolvedVariant}
      size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {action.icon && iconSide === 'left' && (
        <Icon name={action.icon} className="h-4 w-4" />
      )}
      {action.label}
      {action.icon && iconSide === 'right' && (
        <Icon name={action.icon} className="h-4 w-4" />
      )}
    </Button>
  )
}

function MarkAsDoneButton({
  size,
  checked,
  onChange,
}: {
  size?: 'default' | 'sm' | 'lg'
  checked: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className="gap-2"
      onClick={() => onChange?.(!checked)}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          e.stopPropagation()
          onChange?.(e.target.checked)
        }}
        onClick={(e) => e.stopPropagation()}
        className="size-4 shrink-0 rounded-sm border border-primary accent-primary"
        aria-label="Mark as done"
      />
      Mark as done
    </Button>
  )
}

function renderAction(
  action: ActionDescriptor,
  opts: {
    size: 'default' | 'sm' | 'lg'
    allOutline: boolean
    primaryDisabled: boolean
    isPrimary: boolean
    onPrimaryClick?: (label: string) => void
    markAsDoneChecked?: boolean
    onMarkAsDoneChange?: (checked: boolean) => void
  },
) {
  if (action.label === 'Mark as done' && opts.onMarkAsDoneChange) {
    return (
      <MarkAsDoneButton
        key="mark-as-done"
        size={opts.size}
        checked={opts.markAsDoneChecked ?? false}
        onChange={opts.onMarkAsDoneChange}
      />
    )
  }

  const variant = opts.allOutline || action.variant === 'outline' ? 'outline' : 'default'

  return (
    <ActionButton
      key={action.label}
      action={action}
      variant={variant}
      size={opts.size}
      disabled={opts.isPrimary ? opts.primaryDisabled : false}
      onClick={
        opts.isPrimary && opts.onPrimaryClick && !opts.primaryDisabled
          ? () => opts.onPrimaryClick!(action.label)
          : undefined
      }
    />
  )
}

export function Actions({
  primary,
  nextStep,
  secondary,
  primaryDisabled = false,
  onPrimaryClick,
  size = 'lg',
  allOutline = false,
  markAsDoneChecked,
  onMarkAsDoneChange,
  className,
}: ActionsProps) {
  const hasActions =
    Boolean(nextStep) ||
    Boolean(primary) ||
    (secondary && secondary.length > 0)
  if (!hasActions) return null

  const opts = {
    size,
    allOutline,
    primaryDisabled,
    onPrimaryClick,
    markAsDoneChecked,
    onMarkAsDoneChange,
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {secondary?.map((action) =>
        renderAction(action, { ...opts, isPrimary: false }),
      )}
      {nextStep ? (
        <NextStepDropdown
          menu={nextStep}
          disabled={primaryDisabled}
          size={size}
        />
      ) : (
        primary && renderAction(primary, { ...opts, isPrimary: true })
      )}
    </div>
  )
}
