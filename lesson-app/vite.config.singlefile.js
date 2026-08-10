import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build "standalone": impacchetta JS + CSS + font in un unico index.html
// apribile col doppio click (nessun server necessario).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist-standalone",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
  },
});
