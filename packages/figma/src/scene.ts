/**
 * Scene IR — the framework-agnostic description of a screen that travels from
 * the gallery (serializer) to the Figma plugin (node builder). Geometry is in
 * CSS pixels; colors are 0..1 RGBA (Figma's native form).
 */

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export interface SceneNodeBase {
  /** Absolute position within the screen frame, in px. */
  x: number
  y: number
  width: number
  height: number
  name: string
}

export interface FrameNode extends SceneNodeBase {
  type: 'frame'
  fills: RGBA[]
  cornerRadius: number
  strokeColor?: RGBA
  strokeWeight?: number
  clipsContent?: boolean
  opacity?: number
  children: SceneNode[]
}

export interface TextNode extends SceneNodeBase {
  type: 'text'
  characters: string
  fontSize: number
  fontWeight: number
  fontFamily: string
  color: RGBA
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
  lineHeightPx?: number
  letterSpacing?: number
}

export interface ImageNode extends SceneNodeBase {
  type: 'image'
  /** Data URL or remote URL of the image (plugin fetches/decodes). */
  src: string
  cornerRadius: number
}

export type SceneNode = FrameNode | TextNode | ImageNode

/** A single screen: the top-level frame plus metadata for layout in Figma. */
export interface Scene {
  /** Stable id (matches the prototype ScreenDef id). */
  id: string
  name: string
  width: number
  height: number
  background: RGBA
  children: SceneNode[]
  /** Optional flow position so a whole flow lays out on the Figma canvas. */
  flow?: { x: number; y: number }
}

/** Payload the plugin ingests: one or many screens + connectors for flow export. */
export interface FigmaExport {
  source: string
  kind: 'screen' | 'flow'
  scenes: Scene[]
  connectors?: { from: string; to: string; label?: string }[]
}
