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
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react")) return "vendor-react";
          if (/node_modules\/(chart\.js|react-chartjs-2)/.test(id))
            return "vendor-chartjs";
          if (/node_modules\/(swiper)/.test(id)) return "vendor-swiper";
          if (/node_modules\/(lodash|moment|numeral)/.test(id))
            return "vendor-utils";
          if (/node_modules\/(recharts|d3|victory)/.test(id))
            return "vendor-charts";
          return "vendor";
        },
      },
    },
  },
});
