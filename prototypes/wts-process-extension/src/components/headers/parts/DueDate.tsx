import { Calendar } from 'lucide-react'

import { Badge } from '@wts/ui'

interface DueDateProps {
  date: string
  /** Sky pill on case header; gray pill inline on requirement headers. */
  variant?: 'sky' | 'gray'
  className?: string
}

export function DueDate({ date, variant = 'sky', className }: DueDateProps) {
  return (
    <Badge tone={variant} className={className}>
      <Calendar className="h-3.5 w-3.5 shrink-0" />
      Due Date: {date}
    </Badge>
  )
}
