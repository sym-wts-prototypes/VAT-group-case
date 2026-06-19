import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'

export function VerticalSeparator({ className }: { className?: string }) {
  return (
    <Separator
      orientation="vertical"
      className={cn('h-5 shrink-0', className)}
    />
  )
}
