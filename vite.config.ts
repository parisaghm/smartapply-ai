// @ts-ignore - Type definitions may not be resolved by language server
import { defineConfig } from "vite";
// @ts-ignore
import react from "@vitejs/plugin-react-swc";
// @ts-ignore
import path from "path";
// @ts-ignore
import { fileURLToPath } from "url";
// @ts-ignore
import { componentTagger } from "lovable-tagger";

// @ts-expect-error - import.meta.url is valid in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["jspdf", "pdfjs-dist"],
    exclude: ["pdfjs-dist/build/pdf.worker.min.mjs"],
  },
}));
