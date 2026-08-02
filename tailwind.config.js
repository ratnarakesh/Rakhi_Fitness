/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Themeable tokens — values come from CSS variables set per theme
        // in globals.css (see [data-theme="…"]). Default is Aurora Glass.
        background: c('--c-bg'),
        surface: c('--c-surface'),
        'surface-alt': c('--c-surface-alt'),
        border: c('--c-border'),
        accent: c('--c-accent'),
        'accent-muted': c('--c-accent-muted'),
        muted: c('--c-muted'),
        faint: c('--c-faint'),
        danger: c('--c-danger'),
        warning: c('--c-warning'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgb(var(--c-accent) / 0.28)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--c-accent) / 0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgb(var(--c-accent) / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(var(--c-accent) / 0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
      },
    },
  },
  plugins: [],
};
