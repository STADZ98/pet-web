import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: "dist/stats.html", gzipSize: true }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:5005",
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Temporary: collapse all node_modules into a single vendor chunk to
        // avoid cross-chunk initialization ordering issues during debugging.
        // This is a hotfix; once root cause is confirmed we will reintroduce
        // finer-grained manualChunks splitting.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          return "vendor";
        },
      },
    },
  },
});
