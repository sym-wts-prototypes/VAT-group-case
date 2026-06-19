/**
 * Shared contract between prototypes and the gallery.
 *
 * A prototype is an independent app (its own Vite build) served under `basePath`.
 * It exports a PURE-DATA manifest (no React imports) describing its screens and
 * the user flow between them. The gallery glob-imports every prototype manifest
 * to build the index grid, lay out the flow canvas, and drive Figma export.
 *
 * A concrete screen is rendered by loading `${basePath}#${screen.hash}` in an
 * iframe — so the canvas shows the real, live screen and never drifts from code.
 */

export interface ScreenDef {
  /** Stable, unique-within-prototype id, e.g. 'cit-creator-case-inPreparation'. */
  id: string
  /** Human-readable label shown on the canvas node and screen list. */
  label: string
  /** Hash route understood by the prototype, e.g. 'cit/creator/case/inPreparation'. */
  hash: string
  /** Optional grouping key for canvas auto-layout (e.g. role or phase). */
  group?: string
  /** Optional canvas layout hints. `lane` = horizontal band label, `col` = column index
   * (e.g. workflow-phase order). When all screens provide them the canvas uses a
   * lane/column layout; otherwise it falls back to an edges-based layered layout. */
  lane?: string
  col?: number
  /** Arbitrary display metadata (process, role, phase…). */
  meta?: Record<string, string>
}

export interface FlowEdgeDef {
  /** Source ScreenDef id. */
  from: string
  /** Target ScreenDef id. */
  to: string
  /** Optional transition label, e.g. the button that triggers it. */
  label?: string
}

export interface FlowGraph {
  screens: ScreenDef[]
  edges: FlowEdgeDef[]
}

export interface PrototypeManifest {
  /** URL-safe unique id. MUST match the folder name and the prototype's Vite `base`. */
  id: string
  title: string
  description: string
  /** Site-root-relative path to the built prototype, e.g. '/prototypes/wts-process-extension/'. */
  basePath: string
  /** Optional thumbnail (site-root-relative path or data URI) for the gallery card. */
  thumbnail?: string
  /** Hash to open by default when entering the prototype. Defaults to the first screen. */
  defaultHash?: string
  /** Figma file key whose frames back this prototype; enables the design-pull tab. */
  figmaFileKey?: string
  flow: FlowGraph
}

/** Build the iframe URL for a given screen. */
export function screenUrl(manifest: PrototypeManifest, screen: ScreenDef): string {
  return `${manifest.basePath}#${screen.hash}`
}

/** Build the iframe URL for the prototype's default/entry screen. */
export function entryUrl(manifest: PrototypeManifest): string {
  const hash = manifest.defaultHash ?? manifest.flow.screens[0]?.hash ?? ''
  return hash ? `${manifest.basePath}#${hash}` : manifest.basePath
}

/** Validate a manifest's structural integrity. Returns a list of problems (empty = ok). */
export function validateManifest(m: PrototypeManifest): string[] {
  const errors: string[] = []
  if (!/^[a-z0-9-]+$/.test(m.id)) errors.push(`id "${m.id}" is not url-safe (a-z 0-9 -)`)
  if (!m.basePath.startsWith('/') || !m.basePath.endsWith('/'))
    errors.push(`basePath "${m.basePath}" must start and end with "/"`)
  const ids = new Set<string>()
  for (const s of m.flow.screens) {
    if (ids.has(s.id)) errors.push(`duplicate screen id "${s.id}"`)
    ids.add(s.id)
  }
  for (const e of m.flow.edges) {
    if (!ids.has(e.from)) errors.push(`edge.from "${e.from}" has no matching screen`)
    if (!ids.has(e.to)) errors.push(`edge.to "${e.to}" has no matching screen`)
  }
  return errors
}
