import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LayoutGrid, Figma, Loader2, Check } from 'lucide-react'
import { screenUrl, type ScreenDef } from '@wts/prototype-kit'

import { getPrototype } from '../registry'
import { NotFound } from './NotFound'
import { buildFlowExport, copyExport } from '../figma/export'
import { ScreenNode, type ScreenNodeData } from '../components/flow/ScreenNode'
import { LaneLabel } from '../components/flow/LaneLabel'
import { laneLayout, layeredLayout } from '../components/flow/layout'

const nodeTypes = { screen: ScreenNode, lane: LaneLabel }

const processOf = (s: ScreenDef) => s.meta?.process ?? s.hash.split('/')[0]?.toUpperCase() ?? ''

export function PrototypeCanvas() {
  const { prototypeId } = useParams()
  const prototype = getPrototype(prototypeId)
  const navigate = useNavigate()

  const processes = useMemo(() => {
    if (!prototype) return [] as string[]
    return [...new Set(prototype.flow.screens.map(processOf))].filter(Boolean)
  }, [prototype])

  const [filter, setFilter] = useState<string>('')
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const active = filter || processes[0] || ''

  const activeScreens = useMemo(
    () => (prototype ? prototype.flow.screens.filter((s) => !active || processOf(s) === active) : []),
    [prototype, active],
  )

  async function sendFlowToFigma() {
    if (!prototype || exporting) return
    setExporting({ done: 0, total: activeScreens.length })
    try {
      const payload = await buildFlowExport(prototype, activeScreens, (done, total) =>
        setExporting({ done, total }),
      )
      await copyExport(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } finally {
      setExporting(null)
    }
  }

  const { nodes, edges } = useMemo(() => {
    if (!prototype) return { nodes: [] as Node[], edges: [] as Edge[] }
    const screens = prototype.flow.screens.filter((s) => !active || processOf(s) === active)
    const ids = new Set(screens.map((s) => s.id))

    const laid = laneLayout(screens) ?? layeredLayout({ screens, edges: prototype.flow.edges })
    const pos = new Map(laid.positions.map((p) => [p.id, p]))

    const screenNodes: Node[] = screens.map((s) => ({
      id: s.id,
      type: 'screen',
      position: { x: pos.get(s.id)?.x ?? 0, y: pos.get(s.id)?.y ?? 0 },
      data: {
        label: s.label,
        sublabel: s.meta?.role
          ? `${s.meta.role}${s.meta.phase ? ` · ${s.meta.phase}` : ''}`
          : undefined,
        src: screenUrl(prototype, s),
        snapshot: `${prototype.basePath}snapshots/${s.id}.png`,
        onOpen: () => navigate(`/p/${prototype.id}`),
      } satisfies ScreenNodeData,
    }))

    const laneNodes: Node[] = laid.lanes.map((lane, i) => ({
      id: `lane-${i}`,
      type: 'lane',
      position: { x: -40, y: lane.y },
      data: { label: lane.label, height: lane.height },
      draggable: false,
      selectable: false,
    }))

    const flowEdges: Edge[] = prototype.flow.edges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e, i) => ({
        id: `e${i}`,
        source: e.from,
        target: e.to,
        label: e.label,
        labelStyle: { fontSize: 11 },
        style: { strokeWidth: 1.5 },
      }))

    return { nodes: [...laneNodes, ...screenNodes], edges: flowEdges }
  }, [prototype, active, navigate])

  if (!prototype) return <NotFound />

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          ← All prototypes
        </Link>
        <span className="text-sm font-medium">{prototype.title}</span>
        {processes.length > 1 && (
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            {processes.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={
                  'rounded px-2 py-0.5 text-xs font-medium ' +
                  (active === p ? 'bg-background shadow-sm' : 'text-muted-foreground')
                }
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <span className="text-[11px] text-muted-foreground">
          {nodes.filter((n) => n.type === 'screen').length} screens
        </span>
        <button
          onClick={sendFlowToFigma}
          disabled={!!exporting}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium hover:bg-accent disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Exporting {exporting.done}/{exporting.total}
            </>
          ) : copied ? (
            <>
              <Check className="h-4 w-4" /> Copied — paste in Figma plugin
            </>
          ) : (
            <>
              <Figma className="h-4 w-4" /> Copy flow to Figma
            </>
          )}
        </button>
        <Link
          to={`/p/${prototype.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
        >
          <LayoutGrid className="h-4 w-4" /> Screen view
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <ReactFlow
          key={active}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onlyRenderVisibleElements
          fitView
          minZoom={0.05}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
    </div>
  )
}
