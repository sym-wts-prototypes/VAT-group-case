import { useEffect, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { SIDEBAR_CASE_MANAGEMENT_ID, WtsAppShell } from '@wts/app-shell'
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

  const sidebar = { role, activeItemId: SIDEBAR_CASE_MANAGEMENT_ID }

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
          'shrink-0 overflow-hidden transition-[width] duration-200 ease-out',
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
          <div className="lg:sticky lg:top-4">
            <div className="mb-2 flex items-center justify-between gap-2">
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
            <ControlPanel />
          </div>
        )}
      </aside>

      <WtsAppShell
        className="min-h-[min(720px,calc(100vh-2rem))] flex-1"
        sidebar={sidebar}
      >
        <PlaygroundMain />
      </WtsAppShell>
    </div>
  )
}
