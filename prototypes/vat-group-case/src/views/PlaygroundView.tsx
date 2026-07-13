import { useEffect, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import {
  navigateToPrototype,
  SIDEBAR_CASE_MANAGEMENT_ID,
  SIDEBAR_ORGANISATIONS_ID,
  WtsAppShell,
  type SidebarItemId,
} from '@wts/app-shell'
import { Button, cn } from '@wts/ui'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { useDemoStore } from '@/store/useDemoStore'

import { PlaygroundMain } from './PlaygroundMain'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function PlaygroundView() {
  const [controlsHidden, setControlsHidden] = useState(false)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const role = useDemoStore((state) => state.role)
  const setShowCaseManagement = useDemoStore((state) => state.setShowCaseManagement)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'h') return
      if (!event.shiftKey || !(event.metaKey || event.ctrlKey)) return
      if (isEditableTarget(event.target)) return

      event.preventDefault()
      setControlsHidden((hidden) => !hidden)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Tell the embedding gallery to hide its chrome so fullscreen fills the whole window.
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'wts:fullscreen', value: controlsHidden }, '*')
    }
  }, [controlsHidden])

  // "Case Management" routes into this prototype's own Case Management page (not the default
  // cross-prototype nav WtsSidebar would otherwise use for that item) — every other item keeps
  // the default behaviour.
  const sidebar = {
    role,
    activeItemId: SIDEBAR_CASE_MANAGEMENT_ID,
    onNavigate: (id: SidebarItemId) => {
      if (id === SIDEBAR_CASE_MANAGEMENT_ID) {
        setShowCaseManagement(true)
      } else if (id === SIDEBAR_ORGANISATIONS_ID) {
        navigateToPrototype('organisations')
      }
    },
  }

  if (controlsHidden) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <WtsAppShell fullscreen className="min-h-0 flex-1" sidebar={sidebar}>
          <PlaygroundMain />
        </WtsAppShell>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <aside
        className={cn(
          'flex min-h-0 shrink-0 flex-col transition-[width] duration-200 ease-out',
          panelCollapsed ? 'w-9' : 'w-full lg:w-72',
        )}
      >
        {panelCollapsed ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shadow-sm"
            onClick={() => setPanelCollapsed(false)}
            aria-label="Expand Playground controls"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Playground controls
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => setPanelCollapsed(true)}
                aria-label="Collapse Playground controls"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* The options list itself scrolls — the label/collapse row above stays put
                (see the App.tsx-level height fix that makes this container's height
                determinate, so overflow-y-auto here actually has something to scroll). */}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <ControlPanel />
            </div>
          </div>
        )}
      </aside>

      <WtsAppShell
        className="min-h-[calc(100vh-1rem)] flex-1"
        sidebar={sidebar}
      >
        <PlaygroundMain />
      </WtsAppShell>
    </div>
  )
}
