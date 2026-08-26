/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        dark: {
          bg: '#0B0E14',
          card: '#151922',
          border: '#232936',
          hover: '#1D2330'
        },
        upbit: {
          red: '#F84960',
          blue: '#1261C4',
          green: '#00C087'
        }
      }
    },
  },
  plugins: [],
}
