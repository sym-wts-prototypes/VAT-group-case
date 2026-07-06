import { useEffect } from 'react'

import { useOrgHashSync } from '@/store/useOrgStore'
import { PlaygroundView } from '@/views/PlaygroundView'

/**
 * Safety net for a known Radix issue: when a menu/dialog closes, an inline
 * `pointer-events: none` can occasionally get left on <body>, which silently
 * freezes every trigger afterwards (e.g. the row/card 3-dot menus stop opening).
 * We already pass `modal={false}` to the dropdowns to avoid this, but this guard
 * makes the failure impossible: it strips the stuck style whenever no dialog is
 * actually open, without interfering while a modal dialog is legitimately shown.
 */
function useBodyPointerEventsGuard() {
  useEffect(() => {
    const body = document.body

    const hasOpenOverlay = () =>
      document.querySelector('[role="dialog"],[role="alertdialog"]') != null

    const maybeClear = () => {
      if (body.style.pointerEvents === 'none' && !hasOpenOverlay()) {
        body.style.removeProperty('pointer-events')
      }
    }

    const observer = new MutationObserver(() => {
      window.setTimeout(maybeClear, 50)
    })
    observer.observe(body, { attributes: true, attributeFilter: ['style'] })

    const interval = window.setInterval(maybeClear, 500)

    return () => {
      observer.disconnect()
      window.clearInterval(interval)
    }
  }, [])
}

export function App() {
  useOrgHashSync()
  useBodyPointerEventsGuard()

  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <main className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
        <PlaygroundView />
      </main>
    </div>
  )
}
