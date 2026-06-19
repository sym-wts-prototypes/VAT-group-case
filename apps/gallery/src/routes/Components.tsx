import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'

import { CATALOG, type CatalogVariant } from '../catalog/registry'

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-[12px] leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="absolute right-2 top-2 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function VariantCard({ variant }: { variant: CatalogVariant }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {variant.label}
      </div>
      <div className="flex min-h-[96px] items-center justify-center bg-muted/20 p-6">
        {variant.render()}
      </div>
      <div className="border-t p-3">
        <CodeBlock code={variant.code} />
      </div>
    </div>
  )
}

export function Components() {
  const [activeId, setActiveId] = useState(CATALOG[0]?.id)
  const active = CATALOG.find((c) => c.id === activeId) ?? CATALOG[0]

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/30">
        <div className="border-b p-4">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            ← All prototypes
          </Link>
          <h2 className="mt-2 text-sm font-semibold">Components</h2>
          <p className="text-xs text-muted-foreground">@wts/ui design system</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
          {CATALOG.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={
                'block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ' +
                (active?.id === c.id ? 'bg-accent font-medium' : '')
              }
            >
              {c.name}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {active && (
          <div className="mx-auto max-w-3xl px-8 py-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{active.name}</h1>
            {active.description && (
              <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
            )}

            {active.Playground && (
              <div className="mt-6 rounded-lg border bg-card p-5">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Playground
                </p>
                <active.Playground />
              </div>
            )}

            <div className="mt-6 space-y-5">
              {active.variants.map((v) => (
                <VariantCard key={v.label} variant={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
