/**
 * DOM → Scene serializer ("HTML to Figma"). Walks a rendered screen and emits a
 * Scene of frames / text / images with absolute geometry and computed styles,
 * which the companion plugin recreates as EDITABLE Figma nodes.
 *
 * Pragmatic by design: it captures the common cases (boxes with background /
 * border / radius, text leaves, images). It is not a pixel-perfect renderer —
 * the result is meant to be edited in Figma, not to round-trip exactly.
 */
import type { RGBA, Scene, SceneNode } from './scene'

const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 }
const WHITE: RGBA = { r: 1, g: 1, b: 1, a: 1 }

function parseColor(css: string): RGBA | null {
  if (!css || css === 'transparent' || css === 'none') return null
  const m = css.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()))
  const [r, g, b, a = 1] = parts
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r: r / 255, g: g / 255, b: b / 255, a }
}

function radius(style: CSSStyleDeclaration): number {
  return parseFloat(style.borderTopLeftRadius) || 0
}

function primaryFont(family: string): string {
  return (family.split(',')[0] || 'Inter').replace(/['"]/g, '').trim()
}

function textAlign(v: string): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
  if (v === 'center') return 'CENTER'
  if (v === 'right' || v === 'end') return 'RIGHT'
  if (v === 'justify') return 'JUSTIFIED'
  return 'LEFT'
}

function lineHeightPx(style: CSSStyleDeclaration): number | undefined {
  const lh = style.lineHeight
  if (!lh || lh === 'normal') return undefined
  const px = parseFloat(lh)
  return Number.isNaN(px) ? undefined : px
}

/** Concatenated direct (non-element) text of an element, collapsed. */
function directText(el: Element): string {
  let out = ''
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? ''
  })
  return out.replace(/\s+/g, ' ').trim()
}

function walk(el: Element, rootRect: DOMRect, win: Window): SceneNode | null {
  const style = win.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return null
  }
  const rect = el.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null

  const base = {
    x: rect.left - rootRect.left,
    y: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
    name: el.getAttribute('data-name') || el.tagName.toLowerCase(),
  }

  if (el.tagName === 'IMG') {
    return { ...base, type: 'image', src: (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src, cornerRadius: radius(style) }
  }

  const elementChildren = Array.from(el.children).filter(
    (c) => !(c.tagName === 'SCRIPT' || c.tagName === 'STYLE'),
  )
  const text = directText(el)

  // Leaf text node
  if (elementChildren.length === 0 && text) {
    return {
      ...base,
      type: 'text',
      characters: text,
      fontSize: parseFloat(style.fontSize) || 14,
      fontWeight: Number(style.fontWeight) || 400,
      fontFamily: primaryFont(style.fontFamily),
      color: parseColor(style.color) ?? BLACK,
      textAlign: textAlign(style.textAlign),
      lineHeightPx: lineHeightPx(style),
      letterSpacing: parseFloat(style.letterSpacing) || 0,
    }
  }

  // Frame
  const fills: RGBA[] = []
  const bg = parseColor(style.backgroundColor)
  if (bg && bg.a > 0) fills.push(bg)

  const borderWeight = parseFloat(style.borderTopWidth) || 0
  const borderColor = borderWeight > 0 ? parseColor(style.borderTopColor) : null

  const children: SceneNode[] = []
  for (const child of elementChildren) {
    const node = walk(child, rootRect, win)
    if (node) children.push(node)
  }

  return {
    ...base,
    type: 'frame',
    fills,
    cornerRadius: radius(style),
    strokeColor: borderColor ?? undefined,
    strokeWeight: borderColor ? borderWeight : undefined,
    clipsContent: style.overflow !== 'visible',
    opacity: Number(style.opacity) || 1,
    children,
  }
}

/** Serialize a rendered screen (root element) into a Scene. */
export function serializeScreen(
  root: HTMLElement,
  meta: { id: string; name: string },
): Scene {
  const win = root.ownerDocument.defaultView ?? window
  const rootRect = root.getBoundingClientRect()
  const style = win.getComputedStyle(root)
  const children: SceneNode[] = []
  for (const child of Array.from(root.children)) {
    if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue
    const node = walk(child, rootRect, win)
    if (node) children.push(node)
  }
  return {
    id: meta.id,
    name: meta.name,
    width: Math.round(rootRect.width),
    height: Math.round(rootRect.height),
    background: parseColor(style.backgroundColor) ?? WHITE,
    children,
  }
}
