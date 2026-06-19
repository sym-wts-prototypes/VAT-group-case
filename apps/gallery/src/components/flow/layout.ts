import type { FlowGraph, ScreenDef } from '@wts/prototype-kit'

export interface NodePosition {
  id: string
  x: number
  y: number
}

export interface LaneBand {
  label: string
  y: number
  height: number
}

export interface LaidOutFlow {
  positions: NodePosition[]
  lanes: LaneBand[]
  width: number
}

export const COL_WIDTH = 380
const ROW_HEIGHT = 300
const LANE_PAD = 28
const LANE_LABEL_GUTTER = 220

/**
 * Lane/column layout: x = `col` (e.g. workflow-phase order), y = horizontal band
 * per `lane`. Screens sharing a lane+col stack vertically. Returns null unless
 * every screen carries `lane` + `col` (then the caller falls back to layered).
 */
export function laneLayout(screens: ScreenDef[]): LaidOutFlow | null {
  if (!screens.length) return { positions: [], lanes: [], width: 0 }
  if (!screens.every((s) => s.lane && typeof s.col === 'number')) return null

  const laneOrder: string[] = []
  for (const s of screens) if (!laneOrder.includes(s.lane!)) laneOrder.push(s.lane!)

  const maxCol = Math.max(...screens.map((s) => s.col ?? 0))
  const positions: NodePosition[] = []
  const lanes: LaneBand[] = []
  let cursorY = 0

  for (const lane of laneOrder) {
    const laneScreens = screens.filter((s) => s.lane === lane)
    // stack index within each (lane,col)
    const stackByCol = new Map<number, number>()
    let laneRows = 1
    for (const s of laneScreens) {
      const col = s.col ?? 0
      const stack = stackByCol.get(col) ?? 0
      stackByCol.set(col, stack + 1)
      laneRows = Math.max(laneRows, stack + 1)
      positions.push({ id: s.id, x: LANE_LABEL_GUTTER + col * COL_WIDTH, y: cursorY + stack * ROW_HEIGHT })
    }
    const height = laneRows * ROW_HEIGHT
    lanes.push({ label: lane, y: cursorY - LANE_PAD / 2, height: height + LANE_PAD })
    cursorY += height + LANE_PAD
  }

  return { positions, lanes, width: LANE_LABEL_GUTTER + (maxCol + 1) * COL_WIDTH }
}

/**
 * Fallback for prototypes without lane/col hints: x = longest-path depth from a
 * root, y = stacking order within that depth.
 */
export function layeredLayout(flow: FlowGraph): LaidOutFlow {
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
  const rowByCol = new Map<number, number>()
  let maxCol = 0
  const positions = flow.screens.map((s) => {
    const col = depth.get(s.id)!
    maxCol = Math.max(maxCol, col)
    const row = rowByCol.get(col) ?? 0
    rowByCol.set(col, row + 1)
    return { id: s.id, x: col * COL_WIDTH, y: row * ROW_HEIGHT }
  })
  return { positions, lanes: [], width: (maxCol + 1) * COL_WIDTH }
}
