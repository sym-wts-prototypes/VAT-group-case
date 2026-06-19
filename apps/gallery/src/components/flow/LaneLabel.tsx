import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'

export interface LaneLabelData {
  label: string
  height: number
  [key: string]: unknown
}

// Non-interactive band label drawn in the left gutter of each lane.
export const LaneLabel = memo(function LaneLabel({ data }: NodeProps) {
  const d = data as LaneLabelData
  return (
    <div
      className="flex items-center"
      style={{ width: 200, height: d.height, pointerEvents: 'none' }}
    >
      <div className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        {d.label}
      </div>
    </div>
  )
})
