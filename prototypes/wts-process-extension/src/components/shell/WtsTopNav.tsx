import { Bell, ChevronDown, CircleUser } from 'lucide-react'

import { Button } from '@wts/ui'
import { cn } from '@wts/ui'

import { WtsLogo } from './WtsLogo'

interface WtsTopNavProps {
  className?: string
  /** Figma 15728:28563 — red badge on bell. */
  notificationCount?: number
}

/** Figma WTS-ShadCn 15131:9509 — WTS Navbar. */
export function WtsTopNav({
  className,
  notificationCount = 1,
}: WtsTopNavProps) {
  const showNotificationBadge = notificationCount > 0

  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center border-b border-border bg-background px-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <WtsLogo />

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg p-0 text-sm font-medium text-sky-800 hover:text-sky-900"
          >
            EN
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            {showNotificationBadge && (
              <span className="absolute left-5 top-0 flex min-w-[18px] items-center justify-center rounded-md bg-brand px-1 py-1 text-xs leading-none text-brand-foreground">
                {notificationCount}
              </span>
            )}
          </div>

          <button
            type="button"
            className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="User menu"
          >
            <CircleUser className="size-8" strokeWidth={1.25} />
          </button>
        </div>
      </div>
    </header>
  )
}
