import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, LayoutGrid, Figma } from 'lucide-react'

import { getPrototype } from '../registry'
import { NotFound } from './NotFound'
import {
  fetchFrames,
  fetchFrameImages,
  type FigmaFrameRef,
  type PullStatus,
} from '../figma/pull'

const MAX_FRAMES = 60

export function FigmaDesigns() {
  const { prototypeId } = useParams()
  const prototype = getPrototype(prototypeId)
  const fileKey = prototype?.figmaFileKey

  const [status, setStatus] = useState<PullStatus | 'loading'>('loading')
  const [message, setMessage] = useState<string>()
  const [frames, setFrames] = useState<FigmaFrameRef[]>([])
  const [images, setImages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!fileKey) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const result = await fetchFrames(fileKey)
      if (cancelled) return
      setStatus(result.status)
      setMessage(result.message)
      setFrames(result.frames)
      if (result.status === 'ok' && result.frames.length) {
        const ids = result.frames.slice(0, MAX_FRAMES).map((f) => f.id)
        const imgs = await fetchFrameImages(fileKey, ids)
        if (!cancelled) setImages(imgs)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fileKey])

  if (!prototype) return <NotFound />

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          ← All prototypes
        </Link>
        <span className="text-sm font-medium">{prototype.title}</span>
        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          <Figma className="h-3 w-3" /> Figma designs
        </span>
        <Link
          to={`/p/${prototype.id}`}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
        >
          <LayoutGrid className="h-4 w-4" /> Screen view
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {!fileKey ? (
          <Notice title="No Figma file linked">
            Set <code>figmaFileKey</code> in this prototype's <code>manifest.ts</code> to pull its
            designs.
          </Notice>
        ) : status === 'loading' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading frames from Figma…
          </div>
        ) : status === 'token-missing' ? (
          <Notice title="Figma pull not configured">
            Set the Worker secret: <code>cd worker &amp;&amp; npx wrangler secret put FIGMA_TOKEN</code>
            {' '}(and add <code>FIGMA_TOKEN</code> to <code>worker/.dev.vars</code> for local preview).
          </Notice>
        ) : status === 'no-worker' ? (
          <Notice title="Available via the worker">{message}</Notice>
        ) : status === 'error' ? (
          <Notice title="Couldn't reach Figma">{message}</Notice>
        ) : frames.length === 0 ? (
          <Notice title="No frames found">This Figma file has no top-level frames.</Notice>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {frames.length} frame{frames.length === 1 ? '' : 's'} from Figma
              {frames.length > MAX_FRAMES ? ` (showing first ${MAX_FRAMES})` : ''}.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {frames.slice(0, MAX_FRAMES).map((f) => (
                <div key={f.id} className="overflow-hidden rounded-lg border bg-card">
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted/40">
                    {images[f.id] ? (
                      <img src={images[f.id]} alt={f.name} className="h-full w-full object-contain" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-2">
                    <div className="truncate text-xs font-medium">{f.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{f.page}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  )
}
