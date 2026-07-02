import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // V4 Brand
        'red-v4':    '#C8102E',
        'red-v4-h':  '#E01235',
        // Backgrounds
        'bg':    '#0B0B0B',
        'bg-s':  '#101010',
        'bg-c':  '#181818',
        'bg-ch': '#212121',
        // Borders
        'br':    '#282828',
        'br-s':  '#1E1E1E',
        // Text
        't1': '#F0F0F0',
        't2': '#909090',
        't3': '#484848',
        // Status
        success: '#10B981',
        info:    '#3B82F6',
        purple:  '#8B5CF6',
        amber:   '#F59E0B',
        // Platforms
        meta:  '#1877F2',
        gads:  '#4285F4',
        ga4:   '#E37400',
        shop:  '#96BF48',
      },
    },
  },
  plugins: [],
}

export default config
