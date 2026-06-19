import { useMemo } from 'react'
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
import { LayoutGrid } from 'lucide-react'
import { screenUrl } from '@wts/prototype-kit'

import { getPrototype } from '../registry'
import { NotFound } from './NotFound'
import { ScreenNode, type ScreenNodeData } from '../components/flow/ScreenNode'
import { layeredLayout } from '../components/flow/layout'

const nodeTypes = { screen: ScreenNode }

export function PrototypeCanvas() {
  const { prototypeId } = useParams()
  const prototype = getPrototype(prototypeId)
  const navigate = useNavigate()

  const { nodes, edges } = useMemo(() => {
    if (!prototype) return { nodes: [] as Node[], edges: [] as Edge[] }
    const positions = new Map(layeredLayout(prototype.flow).map((p) => [p.id, p]))
    const nodes: Node[] = prototype.flow.screens.map((s) => ({
      id: s.id,
      type: 'screen',
      position: { x: positions.get(s.id)?.x ?? 0, y: positions.get(s.id)?.y ?? 0 },
      data: {
        label: s.label,
        sublabel: s.meta?.role
          ? `${s.meta.role}${s.meta.phase ? ` · ${s.meta.phase}` : ''}`
          : undefined,
        src: screenUrl(prototype, s),
        onOpen: () => navigate(`/p/${prototype.id}`),
      } satisfies ScreenNodeData,
    }))
    const edges: Edge[] = prototype.flow.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.from,
      target: e.to,
      label: e.label,
      animated: true,
      labelStyle: { fontSize: 11 },
    }))
    return { nodes, edges }
  }, [prototype, navigate])

  if (!prototype) return <NotFound />

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          ← All prototypes
        </Link>
        <span className="text-sm font-medium">{prototype.title}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          Flow canvas · {prototype.flow.screens.length} screens
        </span>
        <Link
          to={`/p/${prototype.id}`}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--link))] hover:underline"
        >
          <LayoutGrid className="h-4 w-4" /> Screen view
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onlyRenderVisibleElements
          fitView
          minZoom={0.1}
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
