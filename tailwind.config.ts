import type { Config } from "tailwindcss";

// Carvão quente + vermelho do logótipo. O vermelho é reservado à acção (comprar, continuar);
// "sun" (açafrão) sinaliza atenção (últimas unidades). "primary.text" é o vermelho mais claro
// para texto pequeno sobre fundo escuro (o vermelho da marca não tem contraste suficiente aí).
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        elevated: "rgb(var(--c-elevated) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        primary: { DEFAULT: "rgb(var(--c-primary) / <alpha-value>)", hover: "rgb(var(--c-primary-hover) / <alpha-value>)", active: "rgb(var(--c-primary-active) / <alpha-value>)", soft: "rgb(var(--c-primary) / 0.14)", text: "rgb(var(--c-primary-text) / <alpha-value>)" },
        ink: { DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", muted: "rgb(var(--c-ink-muted) / <alpha-value>)", faint: "rgb(var(--c-ink-faint) / <alpha-value>)" },
        sun: "#FFC145",
        success: "rgb(var(--c-success) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)"
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
