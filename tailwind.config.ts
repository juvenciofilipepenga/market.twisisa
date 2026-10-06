import type { Config } from "tailwindcss";

// Carvão quente + vermelho do logótipo. O vermelho é reservado à acção (comprar, continuar);
// "sun" (açafrão) sinaliza atenção (últimas unidades). "primary.text" é o vermelho mais claro
// para texto pequeno sobre fundo escuro (o vermelho da marca não tem contraste suficiente aí).
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#140F0E",
        surface: "#1D1716",
        elevated: "#271F1D",
        border: "#3A2E2B",
        primary: { DEFAULT: "rgb(var(--c-primary) / <alpha-value>)", hover: "rgb(var(--c-primary-hover) / <alpha-value>)", active: "rgb(var(--c-primary-active) / <alpha-value>)", soft: "rgb(var(--c-primary) / 0.14)", text: "rgb(var(--c-primary-text) / <alpha-value>)" },
        ink: { DEFAULT: "#F8F2ED", muted: "#B9ADA6", faint: "#948782" },
        sun: "#FFC145",
        success: "#3DDC84",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6"
      },
      fontFamily: {
        sans: ["Figtree", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Bricolage Grotesque", "Figtree", "-apple-system", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
