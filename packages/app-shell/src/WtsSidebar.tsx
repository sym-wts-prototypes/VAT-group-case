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

import { Button, cn } from '@wts/ui'

import { navigateToPrototype } from './nav'

/** Identifier for the case-management sidebar item. */
export const SIDEBAR_CASE_MANAGEMENT_ID = 'case-management' as const

/** Identifier for the organisations sidebar item. */
export const SIDEBAR_ORGANISATIONS_ID = 'organisations' as const

export type SidebarItemId =
  | 'home'
  | 'control-center'
  | 'pm-dashboard'
  | typeof SIDEBAR_CASE_MANAGEMENT_ID
  | typeof SIDEBAR_ORGANISATIONS_ID

const NAV_ITEMS: Array<{
  id: SidebarItemId
  icon: LucideIcon
  label: string
}> = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'control-center', icon: LayoutDashboard, label: 'Control Center' },
  { id: 'pm-dashboard', icon: BarChartBig, label: 'PM Tool Dashboard' },
  { id: SIDEBAR_CASE_MANAGEMENT_ID, icon: Folder, label: 'Case Management' },
  { id: SIDEBAR_ORGANISATIONS_ID, icon: Building2, label: 'Organisations' },
]

const CLIENT_ITEM_IDS = new Set<SidebarItemId>([
  'home',
  SIDEBAR_CASE_MANAGEMENT_ID,
  SIDEBAR_ORGANISATIONS_ID,
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
  onClick?: () => void
}

function SidebarNavItem({
  icon: Icon,
  label,
  active,
  expanded,
  onClick,
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
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </RailTooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
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

export interface WtsSidebarProps {
  className?: string
  /** Role of the current user — used to filter visible nav items (client role gets a subset). */
  role?: string
  /** Which item is highlighted as active. Defaults to 'home' to match Figma's empty-state default. */
  activeItemId?: SidebarItemId
  /** Override navigation behaviour. When omitted, sidebar uses default cross-prototype nav. */
  onNavigate?: (itemId: SidebarItemId) => void
  /** Hide the External Tools button (defaults: shown when role !== 'client'). */
  hideExternalTools?: boolean
}

/** Figma WTS-ShadCn sidebar (15127:6194, app-shell 15907:3195). */
export function WtsSidebar({
  className,
  role,
  activeItemId = 'home',
  onNavigate,
  hideExternalTools,
}: WtsSidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const isClient = role === 'client'
  const navItems = isClient
    ? NAV_ITEMS.filter((item) => CLIENT_ITEM_IDS.has(item.id))
    : NAV_ITEMS

  const handleClick = (id: SidebarItemId) => {
    if (onNavigate) {
      onNavigate(id)
      return
    }
    // Default behaviour: cross-prototype navigation for known prototype IDs.
    if (id === SIDEBAR_CASE_MANAGEMENT_ID) {
      navigateToPrototype('wts-process-extension')
    } else if (id === SIDEBAR_ORGANISATIONS_ID) {
      navigateToPrototype('organisations')
    }
  }

  const showExternalTools = hideExternalTools == null ? !isClient : !hideExternalTools

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
              active={id === activeItemId}
              expanded={expanded}
              onClick={() => handleClick(id)}
            />
          ))}
        </nav>

        {showExternalTools && (
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
