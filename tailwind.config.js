/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      utilities: {
        '.glow-green-500/30': {
          'box-shadow': '0 0 20px rgba(34, 197, 94, 0.3)',
        },
        '.glow-blue-500/30': {
          'box-shadow': '0 0 20px rgba(59, 130, 246, 0.3)',
        },
        '.glow-purple-500/30': {
          'box-shadow': '0 0 20px rgba(168, 85, 247, 0.3)',
        },
      },
    },
  },
  plugins: [],
}

