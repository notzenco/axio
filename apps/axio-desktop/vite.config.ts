import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "ui",
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1430,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
