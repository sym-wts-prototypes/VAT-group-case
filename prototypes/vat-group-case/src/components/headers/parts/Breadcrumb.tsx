import { ChevronRight } from 'lucide-react'

import { cn } from '@wts/ui'
import type { BreadcrumbDescriptor } from '@/types'

interface BreadcrumbProps {
  items: BreadcrumbDescriptor[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex h-10 flex-wrap items-center gap-2.5 text-sm',
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2.5">
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  item.current
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className="h-[15px] w-[15px] text-muted-foreground"
                aria-hidden
              />
            )}
          </span>
        )
      })}
    </nav>
  )
}
