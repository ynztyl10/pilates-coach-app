const { addIconSelectors } = require('@iconify/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lab-bg': '#F8F9F8',
        'lab-green': '#5E7161',
        'lab-dark': '#1C221E',
        'lab-gray': '#8B958E',
        'lab-light': '#F0F2F0',
        'lab-blue': '#DCEEF2'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [addIconSelectors(['ph', 'fluent'])],
}
