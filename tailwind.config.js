/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1a2f',
        },
        teal: {
          50: '#effcf6',
          100: '#cbf4e6',
          200: '#99e9cf',
          300: '#5fe0b8',
          400: '#2dcd9f',
          500: '#14b88a',
          600: '#0d9773',
          700: '#0c7964',
          800: '#0e6053',
          900: '#0d4a43',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,42,67,0.08), 0 4px 16px rgba(16,42,67,0.06)',
      },
    },
  },
  plugins: [],
};
