import type { FlowGraph } from '@wts/prototype-kit'

export interface NodePosition {
  id: string
  x: number
  y: number
}

const COL_WIDTH = 380
const ROW_HEIGHT = 300

/**
 * Deterministic layered layout: x = longest-path depth from a root (no incoming
 * edge), y = stacking order within that depth. Good enough for a readable flow
 * without pulling in a graph-layout dependency; Phase 2 can swap in dagre/elk.
 */
export function layeredLayout(flow: FlowGraph): NodePosition[] {
  const incoming = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  for (const s of flow.screens) {
    incoming.set(s.id, 0)
    adjacency.set(s.id, [])
  }
  for (const e of flow.edges) {
    if (!incoming.has(e.from) || !incoming.has(e.to)) continue
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1)
    adjacency.get(e.from)!.push(e.to)
  }

  // Longest-path depth via repeated relaxation (graph is small; cycles are clamped).
  const depth = new Map<string, number>()
  for (const s of flow.screens) depth.set(s.id, 0)
  const order = flow.screens.map((s) => s.id)
  for (let i = 0; i < order.length; i++) {
    for (const id of order) {
      const d = depth.get(id)!
      for (const next of adjacency.get(id)!) {
        if (depth.get(next)! < d + 1) depth.set(next, Math.min(d + 1, order.length))
      }
    }
  }

  // Stack within each column in declaration order.
  const rowByCol = new Map<number, number>()
  return flow.screens.map((s) => {
    const col = depth.get(s.id)!
    const row = rowByCol.get(col) ?? 0
    rowByCol.set(col, row + 1)
    return { id: s.id, x: col * COL_WIDTH, y: row * ROW_HEIGHT }
  })
}
