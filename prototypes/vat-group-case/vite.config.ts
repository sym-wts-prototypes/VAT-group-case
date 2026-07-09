import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Served by the gallery/worker under this subpath (and iframed by the canvas).
// Hash-based screen navigation (#process/role/headerType/phase) works under any base.
export default defineConfig({
  base: '/prototypes/vat-group-case/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5176,
    strictPort: true,
  },
})
