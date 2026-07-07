/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rakhi Fitness dark design language
        background: '#000000',
        surface: '#111111',
        'surface-alt': '#1A1A1A',
        border: '#242424',
        accent: '#00FFCC',
        'accent-muted': '#0B8C77',
        muted: '#8A8A8A',
        faint: '#5A5A5A',
        danger: '#FF5A5F',
        warning: '#FFB020',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 255, 204, 0.25)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(0,255,204,0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgba(0,255,204,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0,255,204,0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
      },
    },
  },
  plugins: [],
};
