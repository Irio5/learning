/** @type {import('tailwindcss').Config} */

// "Iris on Ink" identity. We remap Tailwind's `zinc` (neutral) and `indigo`
// (accent) scales so the whole app inherits the new palette without touching
// thousands of existing className strings. `zinc` -> deep inky blue-violet
// neutrals; `indigo` -> luminous iris accent. Semantic hues (emerald/amber/
// blue/red) keep Tailwind defaults so the diagrams' color language survives.
const ink = {
  50: "oklch(0.97 0.006 280 / <alpha-value>)",
  100: "oklch(0.92 0.012 280 / <alpha-value>)",
  200: "oklch(0.85 0.016 280 / <alpha-value>)",
  300: "oklch(0.74 0.02 280 / <alpha-value>)",
  400: "oklch(0.63 0.021 280 / <alpha-value>)",
  500: "oklch(0.55 0.02 280 / <alpha-value>)",
  600: "oklch(0.45 0.022 280 / <alpha-value>)",
  700: "oklch(0.34 0.022 280 / <alpha-value>)",
  800: "oklch(0.27 0.022 280 / <alpha-value>)",
  900: "oklch(0.185 0.02 280 / <alpha-value>)",
  950: "oklch(0.14 0.018 280 / <alpha-value>)",
};
const iris = {
  50: "oklch(0.97 0.02 285 / <alpha-value>)",
  100: "oklch(0.93 0.045 285 / <alpha-value>)",
  200: "oklch(0.87 0.08 285 / <alpha-value>)",
  300: "oklch(0.8 0.13 285 / <alpha-value>)",
  400: "oklch(0.72 0.17 285 / <alpha-value>)",
  500: "oklch(0.63 0.2 285 / <alpha-value>)",
  600: "oklch(0.56 0.19 285 / <alpha-value>)",
  700: "oklch(0.48 0.17 285 / <alpha-value>)",
  800: "oklch(0.4 0.14 285 / <alpha-value>)",
  900: "oklch(0.3 0.1 285 / <alpha-value>)",
  950: "oklch(0.22 0.08 285 / <alpha-value>)",
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: { zinc: ink, indigo: iris },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px oklch(0.63 0.2 285 / 0.35), 0 8px 30px -8px oklch(0.63 0.2 285 / 0.45)",
        soft: "0 1px 2px oklch(0.14 0.018 280 / 0.6), 0 8px 24px -12px oklch(0.14 0.018 280 / 0.8)",
      },
    },
  },
  plugins: [],
};
