import { useState, type ReactNode } from 'react'
import {
  BarChartBig,
  Building2,
  Folder,
  Home,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PocketKnife,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@wts/ui'
import { cn } from '@wts/ui'
import { useDemoStore } from '@/store/useDemoStore'

/** Figma WTS-ShadCn sidebar (15127:6194). */
export const SIDEBAR_ACTIVE_ITEM_ID = 'case-management' as const

type NavItemId =
  | 'home'
  | 'control-center'
  | 'pm-dashboard'
  | typeof SIDEBAR_ACTIVE_ITEM_ID
  | 'organisations'

const NAV_ITEMS: Array<{
  id: NavItemId
  icon: LucideIcon
  label: string
}> = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'control-center', icon: LayoutDashboard, label: 'Control Center' },
  { id: 'pm-dashboard', icon: BarChartBig, label: 'PM Tool Dashboard' },
  { id: 'case-management', icon: Folder, label: 'Case Management' },
  { id: 'organisations', icon: Building2, label: 'Organisations' },
]

const CLIENT_NAV_ITEM_IDS = new Set<NavItemId>([
  'home',
  'case-management',
  'organisations',
])

/**
 * Hover/focus tooltip for the collapsed rail — dark pill to the right of the
 * icon (Figma 5483:200611). Shown only while the sidebar is collapsed.
 */
function RailTooltip({
  label,
  enabled,
  children,
}: {
  label: string
  enabled: boolean
  children: ReactNode
}) {
  if (!enabled) return <>{children}</>
  return (
    <div className="group relative flex w-fit">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  )
}

interface SidebarNavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  expanded: boolean
}

function SidebarNavItem({
  icon: Icon,
  label,
  active,
  expanded,
}: SidebarNavItemProps) {
  if (!expanded) {
    return (
      <RailTooltip label={label} enabled>
        <Button
          type="button"
          variant={active ? 'brand' : 'ghost'}
          size="icon"
          className="size-9 shrink-0"
          aria-label={label}
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </RailTooltip>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'flex h-9 w-full max-w-[204px] items-center overflow-hidden rounded-lg text-left',
        active
          ? 'bg-brand text-brand-foreground shadow-[0_1px_1px_rgba(0,0,0,0.06),0_1px_1.5px_rgba(0,0,0,0.1)]'
          : 'text-foreground hover:bg-accent/50',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span className="flex size-9 shrink-0 items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <span
        className={cn(
          'truncate text-sm leading-5',
          active ? 'font-semibold' : 'font-normal',
        )}
      >
        {label}
      </span>
    </button>
  )
}

export function WtsSidebar({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const role = useDemoStore((state) => state.role)
  const isClient = role === 'client'
  const navItems = isClient
    ? NAV_ITEMS.filter((item) => CLIENT_NAV_ITEM_IDS.has(item.id))
    : NAV_ITEMS

  return (
    <aside
      className={cn(
        'relative z-20 flex shrink-0 flex-col border-r border-[hsl(var(--sidebar-border))] bg-background transition-[width] duration-200 ease-out',
        expanded ? 'w-[220px]' : 'w-[52px]',
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-2">
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1"
          aria-label="Main navigation"
        >
          <div className="flex h-9 w-full max-w-[204px] shrink-0 items-center">
            <RailTooltip label="Expand menu" enabled={!expanded}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 shrink-0 shadow-sm"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {expanded ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>
            </RailTooltip>
          </div>

          {navItems.map(({ id, icon, label }) => (
            <SidebarNavItem
              key={id}
              icon={icon}
              label={label}
              active={id === SIDEBAR_ACTIVE_ITEM_ID}
              expanded={expanded}
            />
          ))}
        </nav>

        {!isClient && (
          <div className={cn('shrink-0', expanded ? 'w-full' : '')}>
          {expanded ? (
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="default"
                size="icon"
                className="size-9 shrink-0 shadow-sm"
                aria-label="External Tools"
              >
                <PocketKnife className="h-4 w-4" />
              </Button>
              <span className="truncate text-sm leading-5 text-foreground">
                External Tools
              </span>
            </div>
          ) : (
            <RailTooltip label="External Tools" enabled>
              <Button
                type="button"
                variant="default"
                size="icon"
                className="size-9 shadow-sm"
                aria-label="External Tools"
              >
                <PocketKnife className="h-4 w-4" />
              </Button>
            </RailTooltip>
          )}
          </div>
        )}
      </div>
    </aside>
  )
}
