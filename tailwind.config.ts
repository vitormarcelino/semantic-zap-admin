// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zap: {
          green:   '#00D060',
          'green-dark': '#00A84F',
          slate:   '#0F1117',
          surface: '#181C26',
          card:    '#1F2535',
          border:  'rgba(255,255,255,0.08)',
          muted:   'rgba(255,255,255,0.38)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config