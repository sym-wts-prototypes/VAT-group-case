import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Terminal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Input,
} from '@wts/ui'

import {
  CATALOG,
  type CatalogEntry,
  type CatalogSource,
  type PlaygroundControl,
} from '../catalog/registry'

/* ── Helpers ── */

const SOURCE_LABELS: Record<CatalogSource, { label: string; className: string }> = {
  shadcn: { label: 'shadcn/ui', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  'shadcn-customized': { label: 'shadcn/ui + customized', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  'wts-custom': { label: 'WTS custom', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  foundation: { label: 'Foundation', className: 'bg-purple-50 text-purple-700 border-purple-200' },
}

function SourceBadge({ source }: { source: CatalogSource }) {
  const { label, className } = SOURCE_LABELS[source]
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  )
}

function CodeBlock({ code, dark }: { code: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className={`overflow-x-auto p-4 text-[13px] leading-relaxed ${dark !== false ? 'rounded-lg bg-zinc-100 text-zinc-900' : 'bg-zinc-100 text-zinc-900'}`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
        title="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function InstallBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-3 font-mono text-[13px] text-zinc-900">
      <Terminal className="h-4 w-4 shrink-0 text-zinc-500" />
      <span className="overflow-x-auto">{command}</span>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(command)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="ml-auto shrink-0 rounded-md p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function PropsTable({ props }: { props: NonNullable<CatalogEntry['props']> }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium">Prop</th>
            <th className="px-4 py-2.5 text-left font-medium">Type</th>
            <th className="px-4 py-2.5 text-left font-medium">Default</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="border-b last:border-0">
              <td className="px-4 py-2.5 font-mono text-[13px] font-medium text-brand">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-[13px] text-muted-foreground">{p.type}</td>
              <td className="px-4 py-2.5 font-mono text-[13px]">{p.default ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Playground Controls ── */

function ControlField({
  control,
  value,
  onChange,
}: {
  control: PlaygroundControl
  value: any
  onChange: (v: any) => void
}) {
  const label = control.label ?? control.prop

  if (control.type === 'select') {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {control.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    )
  }

  if (control.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <Switch
          checked={!!value}
          onCheckedChange={(v) => onChange(v === true)}
        />
      </div>
    )
  }

  if (control.type === 'text') {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Input
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full text-xs"
        />
      </label>
    )
  }

  return null
}

/* ── Sidebar ── */

function Sidebar({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (id: string) => void
}) {
  const components = CATALOG.filter((c) => c.source !== 'foundation')
  const foundations = CATALOG.filter((c) => c.source === 'foundation')

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/30">
      <div className="border-b p-4">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          ← All prototypes
        </Link>
        <h2 className="mt-2 text-sm font-semibold">Components</h2>
        <p className="text-xs text-muted-foreground">@wts/ui design system</p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        {foundations.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Foundations
            </p>
            {foundations.map((c) => (
              <NavButton key={c.id} entry={c} active={activeId === c.id} onClick={() => onSelect(c.id)} />
            ))}
          </>
        )}
        <p className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Components
        </p>
        {components.map((c) => (
          <NavButton key={c.id} entry={c} active={activeId === c.id} onClick={() => onSelect(c.id)} />
        ))}
      </nav>
    </aside>
  )
}

function NavButton({
  entry,
  active,
  onClick,
}: {
  entry: CatalogEntry
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={
        'block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ' +
        (active ? 'bg-accent font-medium' : '')
      }
    >
      {entry.name}
    </button>
  )
}

/* ── Component Page ── */

function ComponentPage({ entry }: { entry: CatalogEntry }) {
  const pg = entry.playground
  const [values, setValues] = useState<Record<string, any>>(() => {
    if (!pg) return {}
    const d: Record<string, any> = {}
    pg.controls.forEach((c) => {
      d[c.prop] = c.defaultValue
    })
    return d
  })

  const updateValue = (prop: string, v: any) =>
    setValues((prev) => ({ ...prev, [prop]: v }))

  const hasPlayground = pg && pg.controls.length > 0
  const previewContent = pg ? pg.render(values, updateValue) : entry.demo?.render()
  const codeContent = pg ? pg.code(values) : entry.demo?.code

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {entry.name}
        </h1>
        <SourceBadge source={entry.source} />
      </div>
      <p className="mt-2 text-base text-muted-foreground">{entry.description}</p>

      {/* Playground card: preview + side controls, code below */}
      {(previewContent || codeContent) && (
        <div className="mt-8 overflow-hidden rounded-xl border">
          <div className="flex flex-col md:flex-row">
            {previewContent && (
              <div className="flex min-h-[200px] flex-1 items-center justify-center bg-background p-10">
                {previewContent}
              </div>
            )}

            {hasPlayground && (
              <div className="flex w-full shrink-0 flex-col gap-4 border-t bg-muted/30 p-5 md:w-64 md:border-l md:border-t-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Controls
                </p>
                {pg.controls
                  .filter((control) => !control.visible || control.visible(values))
                  .map((control) => (
                    <ControlField
                      key={control.prop}
                      control={control}
                      value={values[control.prop]}
                      onChange={(v) => updateValue(control.prop, v)}
                    />
                  ))}
              </div>
            )}
          </div>

          {codeContent && (
            <div className="border-t">
              <CodeBlock code={codeContent} dark={false} />
            </div>
          )}
        </div>
      )}

      {/* Install */}
      {entry.installCommand && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Installation</h2>
          <div className="mt-3">
            <InstallBlock command={entry.installCommand} />
          </div>
        </section>
      )}

      {/* Import */}
      {entry.importPath && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Usage</h2>
          <div className="mt-3">
            <CodeBlock code={entry.importPath} />
          </div>
        </section>
      )}

      {/* API Reference */}
      {entry.props && entry.props.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">API Reference</h2>
          <div className="mt-3">
            <PropsTable props={entry.props} />
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Main ── */

export function Components() {
  const [activeId, setActiveId] = useState(CATALOG[0]?.id)
  const active = CATALOG.find((c) => c.id === activeId) ?? CATALOG[0]

  return (
    <div className="flex h-full">
      <Sidebar activeId={active?.id ?? ''} onSelect={setActiveId} />
      <div className="min-w-0 flex-1 overflow-y-auto">
        {active && <ComponentPage key={active.id} entry={active} />}
      </div>
    </div>
  )
}
