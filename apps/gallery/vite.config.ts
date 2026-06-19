import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

const PROTOTYPES_DIR = path.resolve(__dirname, '../../prototypes')

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

/**
 * Dev-only: serve each prototype's built `dist/` under `/prototypes/<id>/` so the
 * gallery's iframes (screen access + canvas) resolve during `pnpm gallery`.
 * Run `pnpm build` once to populate the prototype dist folders.
 */
function serveBuiltPrototypes(): Plugin {
  return {
    name: 'serve-built-prototypes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        const m = url.match(/^\/prototypes\/([^/]+)\/(.*)$/)
        if (!m) return next()
        const [, id, rest] = m
        // canvas thumbnails live outside dist, in the prototype's snapshots/ dir
        if (rest.startsWith('snapshots/')) {
          const snapPath = path.join(PROTOTYPES_DIR, id, rest)
          if (fs.existsSync(snapPath)) {
            res.setHeader('Content-Type', MIME[path.extname(snapPath)] || 'application/octet-stream')
            return fs.createReadStream(snapPath).pipe(res)
          }
          res.statusCode = 404
          return res.end('snapshot not generated')
        }
        const distRoot = path.join(PROTOTYPES_DIR, id, 'dist')
        let filePath = path.join(distRoot, rest || 'index.html')
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          // SPA-style fallback to the prototype's own index.html
          filePath = path.join(distRoot, 'index.html')
        }
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end(
            `Prototype "${id}" not built yet. Run \`pnpm build\` (or build that prototype) first.`,
          )
          return
        }
        const ext = path.extname(filePath)
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveBuiltPrototypes()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // allow importing prototype manifests from outside the app root
      allow: [path.resolve(__dirname, '../..')],
    },
  },
})
