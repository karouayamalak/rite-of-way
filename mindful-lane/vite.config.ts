import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Source maps only in development (saves bundle size in production)
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks so browsers cache them
        // independently from your app code — changing a page won't invalidate React.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": ["lucide-react", "sonner"],
        },
      },
    },
  },
}));

