// Pull Figma Variables and align @wts/ui base tokens to them.
//   node scripts/figma-tokens.mjs          # dry-run: print what would change
//   node scripts/figma-tokens.mjs --write  # update packages/ui/src/styles/tokens.css
//
// Needs FIGMA_TOKEN with file_variables:read (Variables REST API is Enterprise-gated;
// the script reports clearly if it's unavailable). Only the shadcn "base/*" tokens are
// managed — WTS semantic tokens (link, badges…) are left untouched.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { figma, rgbaToHsl, FILE_KEY } from './figma-lib.mjs'

const TOKENS_CSS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages/ui/src/styles/tokens.css',
)

// Figma variable name -> our CSS custom property.
const MAP = {
  'base/background': '--background',
  'base/foreground': '--foreground',
  'base/card': '--card',
  'base/card-foreground': '--card-foreground',
  'base/popover': '--popover',
  'base/popover-foreground': '--popover-foreground',
  'base/primary': '--primary',
  'base/primary-foreground': '--primary-foreground',
  'base/secondary': '--secondary',
  'base/secondary-foreground': '--secondary-foreground',
  'base/muted': '--muted',
  'base/muted-foreground': '--muted-foreground',
  'base/accent': '--accent',
  'base/accent-foreground': '--accent-foreground',
  'base/destructive': '--destructive',
  'base/destructive-foreground': '--destructive-foreground',
  'base/border': '--border',
  'base/input': '--input',
  'base/ring': '--ring',
}

const write = process.argv.includes('--write')

async function main() {
  let data
  try {
    data = await figma(`/files/${FILE_KEY}/variables/local`)
  } catch (err) {
    if (err.status === 403) {
      console.error(
        '\nVariables REST API not available for this token/plan (403).\n' +
          'It requires file_variables:read scope and an Enterprise plan.\n' +
          'Until then, tokens can be aligned manually from Figma Dev Mode variable values.',
      )
      process.exit(1)
    }
    throw err
  }

  const vars = data.meta?.variables ?? {}
  const byName = new Map()
  for (const v of Object.values(vars)) byName.set(v.name, v)

  const resolve = (variable) => {
    const mode = Object.keys(variable.valuesByMode)[0]
    let val = variable.valuesByMode[mode]
    if (val && val.type === 'VARIABLE_ALIAS') {
      const ref = vars[val.id]
      if (ref) val = ref.valuesByMode[Object.keys(ref.valuesByMode)[0]]
    }
    return val
  }

  let css = fs.readFileSync(TOKENS_CSS, 'utf8')
  const changes = []
  for (const [figmaName, cssVar] of Object.entries(MAP)) {
    const v = byName.get(figmaName)
    if (!v || v.resolvedType !== 'COLOR') continue
    const color = resolve(v)
    if (!color || typeof color.r !== 'number') continue
    const hsl = rgbaToHsl(color)
    const re = new RegExp(`(${cssVar}:\\s*)([^;]+)(;)`)
    const m = css.match(re)
    if (!m) continue
    const current = m[2].trim()
    if (current !== hsl) {
      changes.push({ cssVar, from: current, to: hsl })
      css = css.replace(re, `$1${hsl}$3`)
    }
  }

  if (!changes.length) {
    console.log('Tokens already in sync with Figma. No changes.')
    return
  }
  console.log(`${changes.length} token(s) ${write ? 'updated' : 'differ'}:`)
  for (const c of changes) console.log(`  ${c.cssVar}: ${c.from}  ->  ${c.to}`)
  if (write) {
    fs.writeFileSync(TOKENS_CSS, css)
    console.log('\nWrote packages/ui/src/styles/tokens.css. Review the diff and commit.')
  } else {
    console.log('\nRun with --write to apply.')
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
