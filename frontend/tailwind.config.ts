import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EFEDFF',
          100: '#D9D5FF',
          400: '#9B8FFF',
          500: '#7B6EFF',
          600: '#6657FF',
          700: '#5244E8',
          800: '#3D2FCC',
          900: '#1E1870',
          950: '#0D0B3A',
        },
        gray: {
          800: '#1D1C2E',
          900: '#131220',
          950: '#0A0912',
        },
        accent: { 400: '#FBB143', 500: '#F5A623' },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pop-in':        { '0%': { transform: 'scale(0.5)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'slide-up':      { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'confetti-fall': { '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' } },
        'glow-pulse':    { '0%, 100%': { boxShadow: '0 0 20px rgba(102,87,255,0.4)' }, '50%': { boxShadow: '0 0 40px rgba(102,87,255,0.7)' } },
      },
      animation: {
        'pop-in':        'pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up':      'slide-up 0.4s ease-out',
        'confetti-fall': 'confetti-fall 3s ease-in forwards',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
