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
        // Panel base recolored slightly warmer + used with Tailwind opacity
        // modifiers (bg-panel/60, /80, /90…) throughout the app — this one
        // change is what turns every existing panel into a glass surface.
        panel: "#121318",
        // Thin, elegant glass hairline instead of a solid retro border.
        // Kept as the same "panelBorder" utility (rather than swapped for
        // border-white/5 everywhere) so the high-contrast mode override in
        // globals.css, which targets .border-panelBorder, keeps working.
        panelBorder: "rgba(255,255,255,0.08)",
        signal: "#FF6A3D",
        orbit: "#4FD8EB",
        ink: "#E8ECF3",
        muted: "#8A93A6",
        warn: "#FFB84D",
        // New premium dark-space palette, available for future use.
        spaceDeep: "#090A0C",
        spacePanel: "#121318",
        premiumGold: "#D4AF37",
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
