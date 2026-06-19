import { Actions } from './parts/Actions'
import { BackLink } from './parts/BackLink'
import { BucketStatusBadge } from './parts/BucketStatusBadge'
import { DueDate } from './parts/DueDate'
import { HeaderShell } from './parts/HeaderShell'
import { Title } from './parts/Title'
import { VerticalSeparator } from './parts/VerticalSeparator'
import type { BucketStatus, HeaderDescriptor } from '@/types'

interface RequirementBucketHeaderProps {
  descriptor: HeaderDescriptor
  compact?: boolean
  bucketStatus?: BucketStatus
  markAsDoneChecked?: boolean
  onMarkAsDoneChange?: (checked: boolean) => void
}

/**
 * Client bucket header (Figma 5346:112616): back, Comments + Mark as done,
 * title, status badge, due date.
 */
export function RequirementBucketHeader({
  descriptor,
  compact,
  bucketStatus,
  markAsDoneChecked = false,
  onMarkAsDoneChange,
}: RequirementBucketHeaderProps) {
  const primary =
    descriptor.actions.primary?.label === 'Mark as done'
      ? descriptor.actions.primary
      : undefined

  return (
    <HeaderShell variant="slim" compact={compact}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          {descriptor.backLink ? (
            <BackLink
              label={descriptor.backLink.label}
              href={descriptor.backLink.href}
            />
          ) : (
            <span className="h-10" />
          )}
          <Actions
            primary={primary}
            secondary={descriptor.actions.secondary}
            size={compact ? 'sm' : 'lg'}
            allOutline
            markAsDoneChecked={markAsDoneChecked}
            onMarkAsDoneChange={onMarkAsDoneChange}
          />
        </div>

        <div className="flex items-center gap-4">
          <Title title={descriptor.title} size="slim" />
          <VerticalSeparator />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {bucketStatus && <BucketStatusBadge status={bucketStatus} />}
            {descriptor.dueDate && (
              <DueDate date={descriptor.dueDate} variant="gray" />
            )}
          </div>
        </div>
      </div>
    </HeaderShell>
  )
}
