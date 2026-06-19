// Scaffold a new prototype: `pnpm gen:prototype <id>` (id must be a-z 0-9 -).
// Creates prototypes/<id>/ wired to @wts/ui + @wts/prototype-kit with a minimal
// hash-routed screen and a manifest, so it appears in the gallery after install.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const id = (process.argv[2] || '').trim()

if (!/^[a-z0-9-]+$/.test(id)) {
  console.error('Usage: pnpm gen:prototype <id>   (id: lowercase letters, digits, hyphens)')
  process.exit(1)
}
const dir = path.join(root, 'prototypes', id)
if (fs.existsSync(dir)) {
  console.error(`prototypes/${id} already exists`)
  process.exit(1)
}

const titleCase = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const base = `/prototypes/${id}/`
const write = (rel, content) => {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

write('package.json', JSON.stringify({
  name: `@wts/proto-${id}`,
  private: true,
  version: '0.1.0',
  type: 'module',
  scripts: { dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview', lint: 'tsc --noEmit' },
  dependencies: {
    '@wts/prototype-kit': 'workspace:*',
    '@wts/ui': 'workspace:*',
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  },
  devDependencies: {
    '@types/react': '^18.3.12',
    '@types/react-dom': '^18.3.1',
    '@vitejs/plugin-react': '^4.3.3',
    autoprefixer: '^10.4.20',
    postcss: '^8.4.47',
    tailwindcss: '^3.4.14',
    'tailwindcss-animate': '^1.0.7',
    typescript: '^5.6.3',
    vite: '^5.4.10',
  },
}, null, 2) + '\n')

write('vite.config.ts', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: '${base}',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
`)

write('tailwind.config.ts', `import type { Config } from 'tailwindcss'
import wtsPreset from '@wts/ui/tailwind-preset'

const config: Config = {
  presets: [wtsPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
}

export default config
`)

write('postcss.config.js', `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`)

write('tsconfig.json', JSON.stringify({
  extends: '../../tsconfig.base.json',
  compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] }, types: ['node'] },
  include: ['src', 'vite.config.ts'],
}, null, 2) + '\n')

write('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${titleCase}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`)

write('src/index.css', `@import '@wts/ui/styles/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { @apply border-border; }
  html, body, #root { @apply h-full; }
  body { @apply bg-background text-foreground font-sans antialiased; }
}
`)

write('src/main.tsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`)

write('src/App.tsx', `import { useSyncExternalStore } from 'react'
import { Button } from '@wts/ui'

// Screens are addressed by URL hash so the gallery can deep-link each one.
function useHash() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    () => window.location.hash.replace(/^#/, '') || 'home',
  )
}

export function App() {
  const screen = useHash()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="font-display text-xl font-semibold">${titleCase}</h1>
      <p className="text-sm text-muted-foreground">Current screen: <code>{screen}</code></p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => (window.location.hash = 'home')}>Home</Button>
        <Button onClick={() => (window.location.hash = 'detail')}>Detail</Button>
      </div>
    </div>
  )
}
`)

write('src/manifest.ts', `import type { PrototypeManifest } from '@wts/prototype-kit'

const manifest: PrototypeManifest = {
  id: '${id}',
  title: '${titleCase}',
  description: 'TODO: describe this prototype.',
  basePath: '${base}',
  defaultHash: 'home',
  flow: {
    screens: [
      { id: 'home', label: 'Home', hash: 'home' },
      { id: 'detail', label: 'Detail', hash: 'detail' },
    ],
    edges: [{ from: 'home', to: 'detail', label: 'Open detail' }],
  },
}

export default manifest
`)

console.log(`Created prototypes/${id}.
Next:
  pnpm install
  pnpm --filter @wts/proto-${id} dev
It will appear in the gallery automatically once installed.`)
