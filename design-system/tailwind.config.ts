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
      },
      colors: {
        // V4 Brand
        accent: '#F97316',
        'accent-hover': '#FB923C',
        // Surfaces
        'bg-base':   '#0D1117',
        'bg-side':   '#111827',
        'bg-card':   '#161D2E',
        'bg-card-h': '#1C2640',
        // Borders
        border:      '#1F2D45',
        'border-sub':'#192036',
        // Text
        't1': '#E2E8F0',
        't2': '#8FA3BF',
        't3': '#4A5E78',
        // Status
        success: '#10B981',
        info:    '#3B82F6',
        purple:  '#8B5CF6',
        danger:  '#EF4444',
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
        pill: '20px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(.4,0,.2,1)',
      },
      transitionDuration: {
        fast: '180ms',
        med:  '220ms',
      },
    },
  },
  plugins: [],
}

export default config
