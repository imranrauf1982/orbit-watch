import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#05070D",
        // Panel base — used with Tailwind opacity modifiers (bg-panel/60,
        // /80, /90…) throughout the app.
        panel: "#121318",
        // FIX: this used to be an rgba(...) string, which breaks Tailwind's
        // own opacity modifiers (e.g. border-panelBorder/80 silently fails
        // to apply any alpha on top of an already-rgba base color — that's
        // why some borders weren't rendering as intended). Solid hex again,
        // low-contrast so it still reads as a thin hairline against the
        // panel background.
        panelBorder: "#20242C",
        signal: "#FF6A3D",
        orbit: "#4FD8EB",
        ink: "#E8ECF3",
        muted: "#8A93A6",
        warn: "#FFB84D",
        // Literal glass-space palette for panels/cards, per spec.
        space: {
          950: "#090A0C", // deep obsidian background
          900: "#121318", // sleek panel background
          800: "#1A1D24", // subtle hover/card borders
        },
      },
      fontFamily: {
        // Single premium humanist sans, aliased under every family name the
        // app already references so existing font-display/font-body
        // classNames upgrade without touching every component.
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-sans)", "sans-serif"],
        body: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        premium: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
