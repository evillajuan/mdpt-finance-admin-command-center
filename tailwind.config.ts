import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0A0A0A',
          900: '#111111',
          800: '#1C1C1E',
          700: '#2C2C2E',
          600: '#3A3A3C',
        },
        gold: {
          DEFAULT: '#C4A96A',
          light: '#E8D9B8',
          muted: '#A08040',
          dark: '#7A6030',
        },
        cream: {
          DEFAULT: '#F7F5F0',
          dark: '#EDE9DF',
          border: '#E2DDD3',
        },
        stone: {
          warm: '#9B9589',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
