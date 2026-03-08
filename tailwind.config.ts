import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          'red-dark': '#B30500',
          dark: '#000000',
          surface: '#111111',
          'surface-light': '#1A1A1A',
          border: '#222222',
          muted: '#6B7280',
          purple: '#A855F7',
          green: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-audiowide)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
