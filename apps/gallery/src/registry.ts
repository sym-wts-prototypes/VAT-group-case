import { validateManifest, type PrototypeManifest } from '@wts/prototype-kit'

/**
 * Auto-discovery: every `prototypes/<id>/src/manifest.ts` is eagerly imported at
 * build time. Dropping in a new prototype package (and merging to main) makes it
 * appear in the gallery with no edits here. Manifests are pure data, so this does
 * not pull any prototype's React tree into the gallery bundle.
 */
const modules = import.meta.glob('../../../prototypes/*/src/manifest.ts', {
  eager: true,
}) as Record<string, { default: PrototypeManifest }>

function buildRegistry(): PrototypeManifest[] {
  const seen = new Set<string>()
  const manifests: PrototypeManifest[] = []
  for (const [file, mod] of Object.entries(modules)) {
    const manifest = mod.default
    if (!manifest) {
      console.error(`[registry] ${file} has no default export; skipping`)
      continue
    }
    const errors = validateManifest(manifest)
    if (errors.length) {
      console.error(`[registry] invalid manifest in ${file}:`, errors)
      continue
    }
    if (seen.has(manifest.id)) {
      console.error(`[registry] duplicate prototype id "${manifest.id}" (${file}); skipping`)
      continue
    }
    seen.add(manifest.id)
    manifests.push(manifest)
  }
  return manifests.sort((a, b) => a.title.localeCompare(b.title))
}

export const PROTOTYPES = buildRegistry()

export function getPrototype(id: string | undefined): PrototypeManifest | undefined {
  return PROTOTYPES.find((p) => p.id === id)
}
