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

          // Put React and core React packages together (use stricter regex to avoid substring matches)
          if (/node_modules\/(react|react-dom|scheduler)(\/|$)/.test(id))
            return "vendor-react";

          // Keep framer-motion/motion in the React vendor chunk to ensure React's runtime
          // (createContext, scheduler, etc.) is initialized before motion's runtime runs.
          if (/node_modules\/(framer-motion|motion)(\/|$)/.test(id))
            return "vendor-react";

          // Also co-locate react-router and related packages with React to avoid
          // circular-init issues where router's modules expect React APIs to exist.
          if (
            /node_modules\/(react-router|react-router-dom|@remix-run|@react-router)(\/|$)/.test(
              id
            )
          )
            return "vendor-react";

          if (/node_modules\/(chart\.js|react-chartjs-2)(\/|$)/.test(id))
            return "vendor-chartjs";

          if (/node_modules\/(swiper)(\/|$)/.test(id)) return "vendor-swiper";

          if (/node_modules\/(lodash|moment|numeral)(\/|$)/.test(id))
            return "vendor-utils";

          if (/node_modules\/(recharts|d3|victory)(\/|$)/.test(id))
            return "vendor-charts";

          return "vendor";
        },
      },
    },
  },
});
