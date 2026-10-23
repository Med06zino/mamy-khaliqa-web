/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: "#F7E8E8",
        plum: { DEFAULT: "#713F52", dark: "#5A3242" },
        champagne: "#C6A36A",
        ivory: "#FFFDF9",
        ink: "#292329",
        muted: "#746B72",
        line: "#E9DDE1",
        danger: "#9B2C2C",
        success: "#2F6B4F",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
