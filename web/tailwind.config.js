/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        ink: {
          950: "#030712",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
        },
        sea: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        sand: {
          100: "#fef3c7",
          200: "#fde68a",
        },
      },
      backgroundImage: {
        "grid-slate":
          "linear-gradient(to right, rgb(30 41 59 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(30 41 59 / 0.35) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
