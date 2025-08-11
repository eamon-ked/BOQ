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
        gray: {
          25: '#fafafa',
          950: '#0a0a0a',
        },
        blue: {
          25: '#f8faff',
        },
      },
    },
  },
  plugins: [],
}