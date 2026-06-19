// Capture a PNG snapshot of every screen of every prototype, so the flow canvas
// can show lightweight thumbnails when zoomed out. Snapshots are generated FROM
// the built app, so they never drift from the code.
//
//   pnpm build          # prototypes must be built first
//   pnpm snapshots
//
// Requires Playwright's chromium:  npx playwright install chromium
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const prototypesDir = path.join(root, 'prototypes')
const PORT = 4181
const VIEWPORT = { width: 1280, height: 800 }

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
}

// Static server: /prototypes/<id>/<rest> -> prototypes/<id>/dist/<rest> (SPA fallback).
const server = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0].split('#')[0]
  const m = url.match(/^\/prototypes\/([^/]+)\/(.*)$/)
  if (!m) { res.statusCode = 404; return res.end('not found') }
  const [, id, rest] = m
  const distRoot = path.join(prototypesDir, id, 'dist')
  let file = path.join(distRoot, rest || 'index.html')
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distRoot, 'index.html')
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('not built') }
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
})

await new Promise((r) => server.listen(PORT, r))

const ids = fs.readdirSync(prototypesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((id) => fs.existsSync(path.join(prototypesDir, id, 'src', 'flow.generated.json')))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })

let total = 0
for (const id of ids) {
  const flow = JSON.parse(fs.readFileSync(path.join(prototypesDir, id, 'src', 'flow.generated.json'), 'utf8'))
  const outDir = path.join(prototypesDir, id, 'snapshots')
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
  for (const screen of flow.screens) {
    const target = `http://localhost:${PORT}/prototypes/${id}/#${screen.hash}`
    await page.goto(target, { waitUntil: 'networkidle' })
    await page.waitForTimeout(350) // let fonts/layout settle
    await page.screenshot({ path: path.join(outDir, `${screen.id}.png`) })
    total++
  }
  console.log(`[snapshot] ${id}: ${flow.screens.length} screens -> snapshots/`)
}

await browser.close()
server.close()
console.log(`[snapshot] done: ${total} screenshot(s).`)
