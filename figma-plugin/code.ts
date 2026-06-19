/// <reference types="@figma/plugin-typings" />
/**
 * WTS Prototype Bridge — plugin main thread.
 *
 * Receives a FigmaExport (one screen or a whole flow) from the UI and builds
 * REAL, editable Figma nodes: a frame per screen with flattened rect / text /
 * image children positioned absolutely. Fonts fall back to Inter when the
 * prototype font isn't available.
 */
import type { FigmaExport, Scene, SceneNode, RGBA } from '@wts/figma/scene'

figma.showUI(__html__, { width: 340, height: 420 })

function solid(c: RGBA): SolidPaint {
  return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }
}

function weightToStyle(weight: number): string {
  if (weight >= 700) return 'Bold'
  if (weight >= 600) return 'Semi Bold'
  if (weight >= 500) return 'Medium'
  return 'Regular'
}

const fontCache = new Map<string, FontName>()

async function resolveFont(family: string, weight: number): Promise<FontName> {
  const key = `${family}:${weight}`
  const cached = fontCache.get(key)
  if (cached) return cached
  const style = weightToStyle(weight)
  const candidates: FontName[] = [
    { family, style },
    { family: 'Inter', style },
    { family: 'Inter', style: 'Regular' },
  ]
  for (const font of candidates) {
    try {
      await figma.loadFontAsync(font)
      fontCache.set(key, font)
      return font
    } catch {
      // try next
    }
  }
  const fallback: FontName = { family: 'Inter', style: 'Regular' }
  fontCache.set(key, fallback)
  return fallback
}

// Depth-first flatten: parents emitted before children so z-order is preserved.
function flatten(nodes: SceneNode[], out: SceneNode[] = []): SceneNode[] {
  for (const n of nodes) {
    out.push(n)
    if (n.type === 'frame') flatten(n.children, out)
  }
  return out
}

async function buildScene(scene: Scene): Promise<FrameNode> {
  const frame = figma.createFrame()
  frame.name = scene.name
  frame.resize(scene.width, scene.height)
  frame.x = scene.flow?.x ?? 0
  frame.y = scene.flow?.y ?? 0
  frame.fills = [solid(scene.background)]
  frame.clipsContent = true

  for (const node of flatten(scene.children)) {
    if (node.type === 'text') {
      const font = await resolveFont(node.fontFamily, node.fontWeight)
      const t = figma.createText()
      t.fontName = font
      t.characters = node.characters
      t.fontSize = node.fontSize
      t.fills = [solid(node.color)]
      t.textAlignHorizontal = node.textAlign ?? 'LEFT'
      if (node.lineHeightPx) t.lineHeight = { value: node.lineHeightPx, unit: 'PIXELS' }
      if (node.letterSpacing) t.letterSpacing = { value: node.letterSpacing, unit: 'PIXELS' }
      t.textAutoResize = 'NONE'
      t.resize(Math.max(1, node.width), Math.max(1, node.height))
      t.x = node.x
      t.y = node.y
      frame.appendChild(t)
    } else if (node.type === 'image') {
      const rect = figma.createRectangle()
      rect.name = node.name || 'image'
      rect.resize(Math.max(1, node.width), Math.max(1, node.height))
      rect.x = node.x
      rect.y = node.y
      rect.cornerRadius = node.cornerRadius
      rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.92 }, opacity: 1 }]
      frame.appendChild(rect)
    } else {
      // frame -> editable rectangle only when it has a fill or stroke
      const hasFill = node.fills.length > 0
      const hasStroke = node.strokeColor && (node.strokeWeight ?? 0) > 0
      if (!hasFill && !hasStroke) continue
      const rect = figma.createRectangle()
      rect.name = node.name
      rect.resize(Math.max(1, node.width), Math.max(1, node.height))
      rect.x = node.x
      rect.y = node.y
      rect.cornerRadius = node.cornerRadius
      rect.fills = hasFill ? node.fills.map(solid) : []
      if (hasStroke && node.strokeColor) {
        rect.strokes = [solid(node.strokeColor)]
        rect.strokeWeight = node.strokeWeight ?? 1
      }
      frame.appendChild(rect)
    }
  }
  return frame
}

async function importExport(payload: FigmaExport): Promise<void> {
  const frames: FrameNode[] = []
  for (const scene of payload.scenes) {
    frames.push(await buildScene(scene))
  }
  figma.currentPage.selection = frames
  figma.viewport.scrollAndZoomIntoView(frames)
  figma.notify(
    `Imported ${frames.length} ${payload.kind === 'flow' ? 'flow screen(s)' : 'screen'} from ${payload.source}`,
  )
}

figma.ui.onmessage = async (msg: { type: string; payload?: FigmaExport }) => {
  if (msg.type === 'import' && msg.payload) {
    try {
      await importExport(msg.payload)
    } catch (err) {
      figma.notify(`Import failed: ${(err as Error).message}`, { error: true })
    }
  } else if (msg.type === 'close') {
    figma.closePlugin()
  }
}
