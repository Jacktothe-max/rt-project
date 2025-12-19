/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070A12",
          900: "#0B1220",
          800: "#111B2E",
          700: "#182545"
        }
      }
    }
  },
  plugins: []
};


