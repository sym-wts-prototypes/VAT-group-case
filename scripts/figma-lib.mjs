// Shared helpers for the Figma sync scripts (tokens pull, drift check).
export const FILE_KEY = process.env.FIGMA_FILE_KEY || 'UZi1uoOiqQtd0cE40PUzi6'

export function requireToken() {
  const t = process.env.FIGMA_TOKEN || process.env.FIGMA_ACCESS_TOKEN
  if (!t) {
    console.error(
      'Missing token. Set FIGMA_TOKEN (or FIGMA_ACCESS_TOKEN) — needs file_content:read; tokens also need file_variables:read.',
    )
    process.exit(2)
  }
  return t
}

export async function figma(path) {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { 'X-Figma-Token': requireToken() },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(`Figma API ${res.status} for ${path}: ${body.slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

/** Figma {r,g,b,a} floats (0..1) -> "H S% L%" string for our CSS custom properties. */
export function rgbaToHsl({ r, g, b }) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
