import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f7f7f8",
          100: "#efeff2",
          200: "#d8d9df",
          300: "#b8bac5",
          400: "#8b8f9d",
          500: "#696e7c",
          600: "#505561",
          700: "#383c45",
          800: "#202226",
          900: "#111214",
        },
        accent: {
          DEFAULT: "#d8dee8",
          foreground: "#121417",
        },
      },
      boxShadow: {
        glow: "0 18px 60px rgba(8, 10, 14, 0.22)",
        card: "0 16px 40px rgba(15, 18, 24, 0.16)",
      },
      backgroundImage: {
        chrome:
          "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(214,218,226,0.84) 26%, rgba(129,134,143,0.55) 48%, rgba(247,248,250,0.92) 72%, rgba(111,115,124,0.45) 100%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
    },
  },
  plugins: [],
};

export default config;
