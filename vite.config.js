import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
// @vitejs/plugin-react usa Babel (esbuild só para transformação rápida, sem SWC nenhum) —
// escolhido de propósito para não depender de nenhum binário nativo por plataforma.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { "@": path.resolve(__dirname, "./src") }
    },
    server: { host: true }
});
