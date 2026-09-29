import type { Config } from "tailwindcss";

// Paleta extraída do logótipo (vermelho) e pensada para o tema escuro que o pedido exige.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B0D",
        surface: "#17171B",
        elevated: "#1E1E23",
        border: "#2A2A30",
        primary: { DEFAULT: "#EE0006", hover: "#FF2A2F", active: "#C40005", soft: "rgba(238,0,6,0.12)" },
        ink: { DEFAULT: "#F5F5F7", muted: "#A0A0A8", faint: "#6B6B73" },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6"
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
