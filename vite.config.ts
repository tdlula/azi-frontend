import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Always use .env variables directly, no dev/prod switching
  const backendUrl = `http://${env.VITE_BACKEND_SERVER}:${env.VITE_BACKEND_PORT}`;
  const frontendPort = env.VITE_FRONTEND_PORT;
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(frontendPort) || 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      }
    },
    define: {
      'process.env': {
        BACKEND_PORT: env.VITE_PROD_BACKEND_PORT
      }
    }
  };
});
