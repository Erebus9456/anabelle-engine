/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anabelle: {
          cyan: '#00f2ff',
          magenta: '#ff00ea',
          dark: '#050505',
          panel: 'rgba(10, 10, 10, 0.85)'
        }
      }
    },
  },
  plugins: [],
}