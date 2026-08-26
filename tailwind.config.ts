import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        workcofy: { black: '#0a0a0a', gray: '#6b7280' },
      },
    },
  },
  plugins: [],
}

export default config
