/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          600: "#1e3a8a",
          700: "#1e3a8a",
          800: "#1e3a8a",
          DEFAULT: "#1e40af",
        },
        ensmg: {
          blue: "#1e3a8a",
          green: "#065f46",
          gold: "#b45309",
        },
      },
    },
  },
  plugins: [],
};
