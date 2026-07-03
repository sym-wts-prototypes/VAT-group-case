import type { ReactNode } from 'react'

import { cn } from '@wts/ui'

import { WtsFooter } from './WtsFooter'
import { WtsSidebar, type WtsSidebarProps } from './WtsSidebar'
import { WtsTopNav } from './WtsTopNav'

interface WtsAppShellProps {
  children: ReactNode
  className?: string
  /** Edge-to-edge layout without demo container chrome. */
  fullscreen?: boolean
  /** Sidebar props — role, active item, custom nav handler. */
  sidebar?: WtsSidebarProps
}

/**
 * WTS app chrome: top navbar + sidebar + page content + footer (Figma 15907:3195).
 * Universal shell shared across prototypes.
 */
export function WtsAppShell({
  children,
  className,
  fullscreen = false,
  sidebar,
}: WtsAppShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden bg-background',
        fullscreen
          ? 'h-full rounded-none border-0 shadow-none'
          : 'rounded-lg border border-border shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      <WtsTopNav />
      <div className="flex min-h-0 flex-1">
        <WtsSidebar {...sidebar} />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          {children}
        </div>
      </div>
      <WtsFooter />
    </div>
  )
}
