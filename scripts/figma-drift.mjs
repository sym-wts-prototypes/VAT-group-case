// Detect drift between the WTS-ShadCn design system and @wts/ui.
//   node scripts/figma-drift.mjs           # report only (exit 0)
//   node scripts/figma-drift.mjs --strict  # exit 1 if DS has components code hasn't mapped
//
// "Coverage" = the component has a *.figma.tsx Code Connect mapping in packages/ui/src.
// Needs FIGMA_TOKEN with file_content:read.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { figma, FILE_KEY } from './figma-lib.mjs'

const UI_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../packages/ui/src')

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
// DS entries that aren't app component families we'd build in @wts/ui.
const IGNORE = [/^icon/, /^_/, /docs/, /^slot$/, /^ring$/, /logo/, /^pattern/, /^sign$/, /cover/]

function codeComponents() {
  return fs
    .readdirSync(UI_SRC)
    .filter((f) => f.endsWith('.figma.tsx'))
    .map((f) => norm(f.replace('.figma.tsx', '')))
}

/** Top-level family name, e.g. "Table / Cell" -> "Table", "DropdownMenu / Item" -> "DropdownMenu". */
const family = (name) => name.split('/')[0].split('=')[0].trim()

async function dsFamilies() {
  const families = new Set()
  for (const ep of ['component_sets', 'components']) {
    let data
    try {
      data = await figma(`/files/${FILE_KEY}/${ep}`)
    } catch (e) {
      console.error(`(${ep}) ${e.message}`)
      continue
    }
    const list = data.meta?.[ep] ?? []
    for (const c of list) {
      const fam = family(c.name)
      if (!fam) continue
      if (IGNORE.some((re) => re.test(norm(fam)))) continue
      families.add(fam)
    }
  }
  return [...families]
}

async function main() {
  const code = new Set(codeComponents())
  const families = await dsFamilies()
  const missing = families.filter((f) => !code.has(norm(f))).sort()

  console.log(`Design system families: ${families.length}`)
  console.log(`Mapped in @wts/ui: ${code.size}`)
  if (missing.length === 0) {
    console.log('\n✓ No drift — every DS component family has a Code Connect mapping in code.')
    return
  }
  console.log(`\n⚠ ${missing.length} DS component(s) not yet mapped in @wts/ui:`)
  for (const m of missing) console.log(`  - ${m}`)
  console.log('\nBuild them with: pnpm gen:component <Name> <figma-node-id>')
  if (process.argv.includes('--strict')) process.exit(1)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
