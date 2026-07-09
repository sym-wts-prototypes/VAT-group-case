import { Separator } from '@wts/ui'
import { cn } from '@wts/ui'

export function VerticalSeparator({ className }: { className?: string }) {
  return (
    <Separator
      orientation="vertical"
      className={cn('h-5 shrink-0', className)}
    />
  )
}
