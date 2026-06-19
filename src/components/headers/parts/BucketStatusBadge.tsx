import { Badge } from '@/components/ui/badge'
import {
  BUCKET_STATUS_LABELS,
  BUCKET_STATUS_TONE,
} from '@/lib/bucketStatus'
import type { BucketStatus } from '@/types'

export function BucketStatusBadge({ status }: { status: BucketStatus }) {
  return (
    <Badge tone={BUCKET_STATUS_TONE[status]}>
      <span className="px-1.5 py-[3px]">{BUCKET_STATUS_LABELS[status]}</span>
    </Badge>
  )
}
