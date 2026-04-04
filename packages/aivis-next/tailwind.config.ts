import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'toolbar-enter': 'toolbarEnter 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards',
        'cycle-text-in': 'cycleTextIn 0.2s ease-out forwards',
      },
      keyframes: {
        toolbarEnter: {
          from: { opacity: '0', transform: 'scale(0.5) rotate(90deg)' },
          to: { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        cycleTextIn: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
