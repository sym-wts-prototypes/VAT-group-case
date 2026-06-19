import type { Config } from 'tailwindcss'
import wtsPreset from '@wts/ui/tailwind-preset'

const config: Config = {
  presets: [wtsPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
}

export default config
