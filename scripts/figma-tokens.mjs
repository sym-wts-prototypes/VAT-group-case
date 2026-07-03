// Pull Figma Variables and align @wts/ui base tokens to them.
//   node scripts/figma-tokens.mjs          # dry-run: print what would change
//   node scripts/figma-tokens.mjs --write  # update packages/ui/src/styles/tokens.css
//
// Needs FIGMA_TOKEN with file_variables:read (Variables REST API is Enterprise-gated;
// the script reports clearly if it's unavailable). Only the shadcn "base/*" tokens are
// managed — WTS semantic tokens (link, badges…) are left untouched.
//
// Coverage:
//   - Colors           → HSL "H S% L%"        (e.g. base/background -> --background)
//   - Sizes / radius   → "Xrem"               (e.g. typography/base sizes/small/font-size -> --text-sm)
//   - Font family      → 'Name', <stack>      (e.g. typography/font family/font-sans -> --font-sans)
//
// Shadows are Figma Effect Styles (not Variables) and are NOT synced by this script.
// They live separately under /files/:key/styles and are aligned manually for now.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { figma, rgbaToHsl, FILE_KEY } from './figma-lib.mjs'

const TOKENS_CSS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages/ui/src/styles/tokens.css',
)

/**
 * Figma variable name -> { css: CSS custom property, format: how to render the value }.
 * Format: 'color' (default for COLOR vars), 'rem' (FLOAT px -> rem), 'fontFamily' (STRING).
 */
const MAP = {
  // ── Base colors (shadcn semantic palette) ──
  'base/background': { css: '--background', format: 'color' },
  'base/foreground': { css: '--foreground', format: 'color' },
  'base/card': { css: '--card', format: 'color' },
  'base/card-foreground': { css: '--card-foreground', format: 'color' },
  'base/popover': { css: '--popover', format: 'color' },
  'base/popover-foreground': { css: '--popover-foreground', format: 'color' },
  'base/primary': { css: '--primary', format: 'color' },
  'base/primary-foreground': { css: '--primary-foreground', format: 'color' },
  'base/secondary': { css: '--secondary', format: 'color' },
  'base/secondary-foreground': { css: '--secondary-foreground', format: 'color' },
  'base/muted': { css: '--muted', format: 'color' },
  'base/muted-foreground': { css: '--muted-foreground', format: 'color' },
  'base/accent': { css: '--accent', format: 'color' },
  'base/accent-foreground': { css: '--accent-foreground', format: 'color' },
  'base/destructive': { css: '--destructive', format: 'color' },
  'base/destructive-foreground': { css: '--destructive-foreground', format: 'color' },
  'base/border': { css: '--border', format: 'color' },
  'base/input': { css: '--input', format: 'color' },
  'base/ring': { css: '--ring', format: 'color' },
  'base/sidebar-ring': { css: '--sidebar-ring', format: 'color' },

  // ── Typography ──
  'typography/base sizes/extra small/font-size': { css: '--text-xs', format: 'rem' },
  'typography/base sizes/small/font-size': { css: '--text-sm', format: 'rem' },
  'typography/font family/font-sans': { css: '--font-sans', format: 'fontFamily' },

  // ── Border radius ──
  // Figma border radius/lg (8) is the base; --radius derives all other levels.
  'border radius/lg': { css: '--radius', format: 'rem' },
}

const SANS_STACK = `, ui-sans-serif, system-ui, -apple-system, sans-serif`
const FONT_FAMILY_STACKS = {
  '--font-sans': SANS_STACK,
}

const write = process.argv.includes('--write')

function pxToRem(px) {
  if (typeof px !== 'number') return null
  // Trim trailing zeros for clean output (e.g. 0.5rem, not 0.5000rem).
  const rem = +(px / 16).toFixed(4)
  return `${rem}rem`
}

function formatFontFamily(name, cssVar) {
  const stack = FONT_FAMILY_STACKS[cssVar] ?? ', sans-serif'
  return `'${name}'${stack}`
}

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
    if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
      const ref = vars[val.id]
      if (ref) val = ref.valuesByMode[Object.keys(ref.valuesByMode)[0]]
    }
    return val
  }

  let css = fs.readFileSync(TOKENS_CSS, 'utf8')
  const changes = []
  const missing = []

  for (const [figmaName, entry] of Object.entries(MAP)) {
    const v = byName.get(figmaName)
    if (!v) {
      missing.push(figmaName)
      continue
    }

    const raw = resolve(v)
    let next = null
    if (entry.format === 'color') {
      if (v.resolvedType !== 'COLOR' || !raw || typeof raw.r !== 'number') continue
      next = rgbaToHsl(raw)
    } else if (entry.format === 'rem') {
      if (v.resolvedType !== 'FLOAT' || typeof raw !== 'number') continue
      next = pxToRem(raw)
    } else if (entry.format === 'fontFamily') {
      if (v.resolvedType !== 'STRING' || typeof raw !== 'string') continue
      next = formatFontFamily(raw, entry.css)
    }
    if (next == null) continue

    const re = new RegExp(`(${entry.css}:\\s*)([^;]+)(;)`)
    const m = css.match(re)
    if (!m) continue
    const current = m[2].trim()
    if (current !== next) {
      changes.push({ cssVar: entry.css, from: current, to: next, source: figmaName })
      css = css.replace(re, `$1${next}$3`)
    }
  }

  if (missing.length) {
    console.log(`\nNot present in Figma file (skipped, kept current value):`)
    for (const name of missing) console.log(`  ${name}`)
  }

  if (!changes.length) {
    console.log('\nTokens already in sync with Figma. No changes.')
    return
  }
  console.log(`\n${changes.length} token(s) ${write ? 'updated' : 'differ'}:`)
  for (const c of changes) {
    console.log(`  ${c.cssVar.padEnd(28)} ${c.from}  ->  ${c.to}   (from ${c.source})`)
  }
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
