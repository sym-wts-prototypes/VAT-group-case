import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Layers, ExternalLink, Figma, Check } from 'lucide-react'
import { entryUrl, screenUrl } from '@wts/prototype-kit'

import { getPrototype } from '../registry'
import { buildScreenExport, copyExport, downloadExport } from '../figma/export'
import { NotFound } from './NotFound'

export function PrototypeScreen() {
  const { prototypeId } = useParams()
  const prototype = getPrototype(prototypeId)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/30">
        <div className="border-b p-4">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            ← All prototypes
          </Link>
          <h2 className="mt-2 text-sm font-semibold leading-snug">{prototype.title}</h2>
          <Link
            to={`/p/${prototype.id}/canvas`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
          >
            <Layers className="h-4 w-4" /> Open flow canvas
          </Link>
          {prototype.figmaFileKey && (
            <Link
              to={`/p/${prototype.id}/figma`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
            >
              <Figma className="h-4 w-4" /> Figma designs
            </Link>
          )}
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Screens
          </p>
          {prototype.flow.screens.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={
                'flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ' +
                (activeId === s.id ? 'bg-accent font-medium' : '')
              }
            >
              <span>{s.label}</span>
              {s.meta?.role && (
                <span className="text-[11px] text-muted-foreground">
                  {s.meta.role}
                  {s.meta.phase ? ` · ${s.meta.phase}` : ''}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t p-3">
          <button
            onClick={copyToFigma}
            className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied — paste in the Figma plugin
              </>
            ) : (
              <>
                <Figma className="h-3.5 w-3.5" /> Copy screen to Figma
              </>
            )}
          </button>
          <button
            onClick={downloadToFigma}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            or download JSON
          </button>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 border-t p-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open screen in new tab
        </a>
      </aside>
      <div className="min-w-0 flex-1 bg-muted/40">
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
