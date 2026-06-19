import type { Config } from 'tailwindcss'
import wtsPreset from './tailwind-preset'

const config: Config = {
  presets: [wtsPreset],
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
}

export default config
