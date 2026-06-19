// Assemble the deployable asset tree for the worker:
//   worker/public/                     <- apps/gallery/dist  (the gallery SPA at root)
//   worker/public/prototypes/<id>/     <- prototypes/<id>/dist (each prototype, served under its base)
//
// Run after `turbo build`. Used by `pnpm assemble`, the worker preview, and CI.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'worker', 'public')
const galleryDist = path.join(root, 'apps', 'gallery', 'dist')
const prototypesDir = path.join(root, 'prototypes')
const storybookDist = path.join(root, 'packages', 'ui', 'storybook-static')

function requireDir(dir, hint) {
  if (!fs.existsSync(dir)) {
    console.error(`[assemble] missing ${path.relative(root, dir)} — run \`pnpm build\` first. ${hint ?? ''}`)
    process.exit(1)
  }
}

requireDir(galleryDist, '(gallery not built)')

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })

// 1) gallery at root
fs.cpSync(galleryDist, out, { recursive: true })
console.log('[assemble] gallery -> worker/public')

// 2) each prototype under /prototypes/<id>/
const ids = fs
  .readdirSync(prototypesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

let count = 0
for (const id of ids) {
  const dist = path.join(prototypesDir, id, 'dist')
  if (!fs.existsSync(dist)) {
    console.warn(`[assemble] skip "${id}" (no dist; not built?)`)
    continue
  }
  const dest = path.join(out, 'prototypes', id)
  fs.mkdirSync(dest, { recursive: true })
  fs.cpSync(dist, dest, { recursive: true })
  console.log(`[assemble] prototype "${id}" -> worker/public/prototypes/${id}`)
  count++
}

// 3) Storybook under /storybook/
if (fs.existsSync(storybookDist)) {
  const dest = path.join(out, 'storybook')
  fs.mkdirSync(dest, { recursive: true })
  fs.cpSync(storybookDist, dest, { recursive: true })
  console.log('[assemble] storybook -> worker/public/storybook')
} else {
  console.warn('[assemble] skip storybook (not built)')
}

console.log(`[assemble] done: gallery + ${count} prototype(s) + storybook.`)
