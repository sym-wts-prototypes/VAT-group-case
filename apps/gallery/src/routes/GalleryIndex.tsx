import { Link } from 'react-router-dom'
import { LayoutGrid, Layers, ArrowRight } from 'lucide-react'

import { PROTOTYPES } from '../registry'

export function GalleryIndex() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Prototypes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PROTOTYPES.length} prototype{PROTOTYPES.length === 1 ? '' : 's'} · open a prototype to
          browse its screens or view the full user flow on the canvas.
        </p>
      </div>

      {PROTOTYPES.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No prototypes found. Add one under <code>prototypes/&lt;id&gt;/</code> with a{' '}
          <code>src/manifest.ts</code> and it will appear here automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOTYPES.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-header-sm transition-shadow hover:shadow-header-base"
            >
              <Link
                to={`/p/${p.id}`}
                className="flex aspect-[4/3] items-center justify-center border-b bg-muted/40"
              >
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-medium leading-snug">{p.title}</h2>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Link
                    to={`/p/${p.id}`}
                    className="inline-flex items-center gap-1 font-medium text-[hsl(var(--link))] hover:underline"
                  >
                    Screens <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-muted-foreground/40">·</span>
                  <Link
                    to={`/p/${p.id}/canvas`}
                    className="inline-flex items-center gap-1 font-medium text-[hsl(var(--link))] hover:underline"
                  >
                    <Layers className="h-3.5 w-3.5" /> Canvas
                  </Link>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {p.flow.screens.length} screens
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
