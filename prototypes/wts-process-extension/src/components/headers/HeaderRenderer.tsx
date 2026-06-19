import { resolveHeader } from '@/lib/resolveHeader'
import type { BucketStatus, HeaderContext, HeaderDescriptor } from '@/types'

import { CaseHeader } from './CaseHeader'
import { CaseWrapperHeader } from './CaseWrapperHeader'
import { RequirementBucketHeader } from './RequirementBucketHeader'
import { RequirementListHeader } from './RequirementListHeader'

interface HeaderRendererProps {
  /** Either provide ctx (resolver will run) or a pre-resolved descriptor. */
  ctx?: HeaderContext
  descriptor?: HeaderDescriptor
  compact?: boolean
  /** Case In Preparation: primary CTA until all tasks are done. */
  primaryDisabled?: boolean
  onPrimaryClick?: (label: string) => void
  bucketStatus?: BucketStatus
  bucketMarkAsDoneChecked?: boolean
  onBucketMarkAsDoneChange?: (checked: boolean) => void
}

export function HeaderRenderer({
  ctx,
  descriptor: descriptorProp,
  compact,
  primaryDisabled,
  onPrimaryClick,
  bucketStatus,
  bucketMarkAsDoneChecked,
  onBucketMarkAsDoneChange,
}: HeaderRendererProps) {
  const descriptor = descriptorProp ?? (ctx ? resolveHeader(ctx) : null)

  if (!descriptor) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-5 text-sm text-muted-foreground">
        Invalid combination - this header is not reachable for the current
        process / role / platform.
      </div>
    )
  }

  switch (descriptor.headerType) {
    case 'caseWrapper':
      return (
        <CaseWrapperHeader
          descriptor={descriptor}
          compact={compact}
          primaryDisabled={primaryDisabled}
          onPrimaryClick={onPrimaryClick}
        />
      )
    case 'case':
      return (
        <CaseHeader
          descriptor={descriptor}
          compact={compact}
          primaryDisabled={primaryDisabled}
          onPrimaryClick={onPrimaryClick}
        />
      )
    case 'requirementList':
      return (
        <RequirementListHeader descriptor={descriptor} compact={compact} />
      )
    case 'requirementBucket':
      return (
        <RequirementBucketHeader
          descriptor={descriptor}
          compact={compact}
          bucketStatus={bucketStatus}
          markAsDoneChecked={bucketMarkAsDoneChecked}
          onMarkAsDoneChange={onBucketMarkAsDoneChange}
        />
      )
  }
}
