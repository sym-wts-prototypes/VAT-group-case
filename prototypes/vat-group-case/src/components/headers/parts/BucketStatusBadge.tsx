import { Badge } from '@wts/ui'
import {
  BUCKET_STATUS_LABELS,
  BUCKET_STATUS_TONE,
} from '@/lib/bucketStatus'
import type { BucketStatus } from '@/types'

export function BucketStatusBadge({ status }: { status: BucketStatus }) {
  return (
    <Badge tone={BUCKET_STATUS_TONE[status]}>
      {BUCKET_STATUS_LABELS[status]}
    </Badge>
  )
}
