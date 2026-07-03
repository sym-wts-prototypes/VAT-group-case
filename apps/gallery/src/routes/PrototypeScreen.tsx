import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Layers, ExternalLink, Figma, Check } from 'lucide-react'
import { entryUrl, screenUrl } from '@wts/prototype-kit'

import { getPrototype } from '../registry'
import { buildScreenExport, copyExport, downloadExport } from '../figma/export'
import { NotFound } from './NotFound'

export function PrototypeScreen() {
  const { prototypeId } = useParams()
  const prototype = getPrototype(prototypeId)
  const [activeId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // When the embedded prototype toggles fullscreen (Cmd/Ctrl+Shift+H), it posts a
  // message; we drop all gallery chrome and let the iframe cover the whole window.
  const [immersive, setImmersive] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'wts:fullscreen') {
        setImmersive(Boolean(event.data.value))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const currentScreen = useMemo(() => {
    if (!prototype) return undefined
    return (
      prototype.flow.screens.find((s) => s.id === activeId) ?? prototype.flow.screens[0]
    )
  }, [prototype, activeId])

  const src = useMemo(() => {
    if (!prototype) return ''
    const screen = prototype.flow.screens.find((s) => s.id === activeId)
    return screen ? screenUrl(prototype, screen) : entryUrl(prototype)
  }, [prototype, activeId])

  function buildPayload() {
    const doc = iframeRef.current?.contentDocument
    if (!doc?.body || !prototype || !currentScreen) {
      alert('Screen not ready yet — wait for it to load, then try again.')
      return null
    }
    return { payload: buildScreenExport(prototype, currentScreen, doc), screen: currentScreen }
  }

  async function copyToFigma() {
    const built = buildPayload()
    if (!built) return
    await copyExport(built.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function downloadToFigma() {
    const built = buildPayload()
    if (built && prototype) {
      downloadExport(built.payload, `${prototype.id}--${built.screen.id}.figma.json`)
    }
  }

  if (!prototype) return <NotFound />

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex h-11 shrink-0 items-center gap-3 border-b bg-background px-4"
        hidden={immersive}
      >
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          ← All prototypes
        </Link>
        <span className="text-sm font-medium">{prototype.title}</span>
        <Link
          to={`/p/${prototype.id}/canvas`}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
        >
          <Layers className="h-4 w-4" /> Flow canvas
        </Link>
        {prototype.figmaFileKey && (
          <Link
            to={`/p/${prototype.id}/figma`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
          >
            <Figma className="h-4 w-4" /> Figma designs
          </Link>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={copyToFigma}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium hover:bg-accent"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied — paste in Figma plugin
              </>
            ) : (
              <>
                <Figma className="h-4 w-4" /> Copy to Figma
              </>
            )}
          </button>
          <button
            onClick={downloadToFigma}
            className="text-[11px] text-muted-foreground hover:text-foreground"
            title="Download JSON payload"
          >
            JSON
          </button>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          title="Open screen in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div
        className={
          immersive
            ? 'fixed inset-0 z-50 bg-background'
            : 'min-h-0 flex-1 bg-muted/40'
        }
      >
        <iframe
          ref={iframeRef}
          key={prototype.id}
          title={prototype.title}
          src={src}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  )
}
