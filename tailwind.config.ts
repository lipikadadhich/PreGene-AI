/// <reference types="node" />
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1140px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: "#ecfaf5",
          100: "#d1f2e4",
          200: "#a3e5cb",
          300: "#6dd1ad",
          400: "#3ab68e",
          500: "#1e9873",
          600: "#0f7a5c",
          700: "#0d614a",
          800: "#0e4d3d",
          900: "#0a3129",
          950: "#051d18",
        },
        ink: {
          900: "#0b1220",
          700: "#1f2937",
          500: "#5b6679",
          300: "#94a0b3",
        },
        muted: {
          DEFAULT: "#f4f6f7",
          foreground: "#5b6679",
        },
        primary: {
          DEFAULT: "#0f7a5c",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0b1220",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Source Serif 4",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        float: "0 12px 32px -8px rgb(16 24 40 / 0.18)",
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;