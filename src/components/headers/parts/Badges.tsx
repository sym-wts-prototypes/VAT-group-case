import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { BadgeDescriptor } from '@/types'

interface BadgesProps {
  badges: BadgeDescriptor[]
  className?: string
}

export function Badges({ badges, className }: BadgesProps) {
  if (badges.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {badges.map((b, i) => (
        <Badge key={`${b.label}-${i}`} tone={b.tone}>
          <span className="px-1.5 py-[3px]">{b.label}</span>
        </Badge>
      ))}
    </div>
  )
}
