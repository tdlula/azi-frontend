import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isDev = process.env.NODE_ENV !== 'production' && process.env.npm_lifecycle_event !== 'build';
const devBackend = 'http://localhost:5000';
const prodBackend = 'http://129.151.191.161:7000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: isDev ? devBackend : prodBackend,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the /api prefix
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Add cache busting to built files
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  // Environment variables for backend
  define: {
    __BACKEND_URL__: JSON.stringify(isDev ? devBackend : prodBackend),
  },
  // Clear cache on dev server restart
  clearScreen: false,
  cacheDir: 'node_modules/.vite'
});
