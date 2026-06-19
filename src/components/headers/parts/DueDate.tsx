import { Calendar } from 'lucide-react'

import { cn } from '@/lib/cn'

interface DueDateProps {
  date: string
  /** Blue pill on case header; gray pill inline on requirement headers. */
  variant?: 'blue' | 'gray'
  className?: string
}

export function DueDate({ date, variant = 'blue', className }: DueDateProps) {
  const isBlue = variant === 'blue'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0 rounded-full border p-1 text-xs font-medium leading-none',
        isBlue
          ? 'border-[hsl(var(--badge-blue-border))] bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--badge-blue-fg))]'
          : 'border-[hsl(var(--badge-gray-border))] bg-[hsl(var(--badge-gray-bg))] text-[hsl(var(--badge-gray-fg))]',
        className,
      )}
    >
      <span className="flex items-center justify-center px-0.5">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
      </span>
      <span className="px-1.5 py-[3px]">Due Date: {date}</span>
    </span>
  )
}
