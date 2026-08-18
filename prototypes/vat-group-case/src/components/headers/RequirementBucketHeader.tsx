import { Actions } from './parts/Actions'
import { BackLink } from './parts/BackLink'
import { BucketStatusBadge } from './parts/BucketStatusBadge'
import { DueDate } from './parts/DueDate'
import { HeaderShell } from './parts/HeaderShell'
import { CaseIdentityPills, Title } from './parts/Title'
import { VerticalSeparator } from './parts/VerticalSeparator'
import type { BucketStatus, HeaderDescriptor } from '@/types'

interface RequirementBucketHeaderProps {
  descriptor: HeaderDescriptor
  compact?: boolean
  bucketStatus?: BucketStatus
  markAsDoneChecked?: boolean
  onMarkAsDoneChange?: (checked: boolean) => void
  /** The back link's href is just "#" (static demo copy) — this is what actually navigates,
   *  back to the case view (the bucket-cards grid) instead of a no-op anchor click. */
  onBack?: () => void
  /** Opens the shared CommentsDrawer placeholder — the "Comments" secondary action is a no-op
   *  otherwise (Actions never wires secondary actions up on its own). */
  onCommentsClick?: () => void
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
  onBack,
  onCommentsClick,
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
              onClick={onBack}
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
            onCommentsClick={onCommentsClick}
          />
        </div>

        <div className="flex flex-col gap-2">
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
          {/* The case's own name + legal-entity/VAT-code pills, under the Requirements/Due Date
              row — not shown for the Client (see PlaygroundMain.tsx's `caseIdentity`, only set
              for non-Client roles). */}
          {descriptor.caseIdentity && (
            <CaseIdentityPills title={descriptor.caseIdentity.title} />
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
