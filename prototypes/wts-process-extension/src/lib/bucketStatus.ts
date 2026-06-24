import type { BucketStatus } from '@/types'

export const BUCKET_STATUS_LABELS: Record<BucketStatus, string> = {
  notStarted: 'Not started',
  inProgress: 'In Progress',
  done: 'Done',
}

export const BUCKET_STATUS_TONE: Record<
  BucketStatus,
  'gray' | 'sky' | 'green'
> = {
  notStarted: 'gray',
  inProgress: 'sky',
  done: 'green',
}

export function bucketStatusFromMarkAsDone(checked: boolean): BucketStatus {
  return checked ? 'done' : 'inProgress'
}
