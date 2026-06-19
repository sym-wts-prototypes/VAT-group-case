import { serializeScreen, type FigmaExport, type Scene } from '@wts/figma'
import { type PrototypeManifest, type ScreenDef } from '@wts/prototype-kit'

// Figma canvas slot per screen when exporting a whole flow.
const W = 1280
const H = 800
const GAP = 120
const LANE_GAP = 200

/** Serialize a single already-loaded screen iframe into an export payload. */
export function buildScreenExport(
  prototype: PrototypeManifest,
  screen: ScreenDef,
  doc: Document,
): FigmaExport {
  const scene = serializeScreen(doc.body, { id: screen.id, name: `${prototype.id} · ${screen.label}` })
  return { source: prototype.title, kind: 'screen', scenes: [scene] }
}

/** Lay screens out on the Figma canvas mirroring the gallery's lane/column flow. */
function flowPositions(screens: ScreenDef[]): Map<string, { x: number; y: number }> {
  const lanes: string[] = []
  for (const s of screens) if (s.lane && !lanes.includes(s.lane)) lanes.push(s.lane)
  const out = new Map<string, { x: number; y: number }>()
  let cursorY = 0
  for (const lane of lanes.length ? lanes : ['']) {
    const laneScreens = screens.filter((s) => (s.lane ?? '') === lane)
    const stackByCol = new Map<number, number>()
    let rows = 1
    for (const s of laneScreens) {
      const col = s.col ?? 0
      const stack = stackByCol.get(col) ?? 0
      stackByCol.set(col, stack + 1)
      rows = Math.max(rows, stack + 1)
      out.set(s.id, { x: col * (W + GAP), y: cursorY + stack * (H + GAP) })
    }
    cursorY += rows * (H + GAP) + LANE_GAP
  }
  return out
}

/**
 * Serialize many screens by loading each in an offscreen iframe in turn, so an
 * entire flow can be pushed to Figma at once. `onProgress(done, total)` drives UI.
 */
export async function buildFlowExport(
  prototype: PrototypeManifest,
  screens: ScreenDef[],
  onProgress?: (done: number, total: number) => void,
): Promise<FigmaExport> {
  const positions = flowPositions(screens)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:${H}px;border:0;`
  document.body.appendChild(iframe)

  const scenes: Scene[] = []
  try {
    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i]
      // Cache-bust query forces a full reload (hash-only changes don't refire onload),
      // so the prototype re-reads the hash and renders this screen fresh.
      await loadIframe(iframe, `${prototype.basePath}?b=${i}#${screen.hash}`)
      await delay(500) // allow fonts/layout to settle
      const doc = iframe.contentDocument
      if (doc?.body) {
        const scene = serializeScreen(doc.body, { id: screen.id, name: screen.label })
        scene.flow = positions.get(screen.id) ?? { x: 0, y: 0 }
        scenes.push(scene)
      }
      onProgress?.(i + 1, screens.length)
    }
  } finally {
    iframe.remove()
  }

  const ids = new Set(scenes.map((s) => s.id))
  const connectors = prototype.flow.edges
    .filter((e) => ids.has(e.from) && ids.has(e.to))
    .map((e) => ({ from: e.from, to: e.to, label: e.label }))

  return { source: prototype.title, kind: 'flow', scenes, connectors }
}

function loadIframe(iframe: HTMLIFrameElement, src: string): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve()
    iframe.onload = done
    iframe.src = src
    // Hash-only changes don't refire onload; force a fresh load each time.
    setTimeout(done, 4000) // safety timeout
  })
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Trigger a browser download of the export JSON. */
export function downloadExport(data: FigmaExport, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
