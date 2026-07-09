import type { Config } from 'tailwindcss'
import wtsPreset from '@wts/ui/tailwind-preset'

const config: Config = {
  presets: [wtsPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // include the shared component library so its utility classes are generated
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/app-shell/src/**/*.{ts,tsx}',
  ],
}

export default config
