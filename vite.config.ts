import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = env.VITE_ENV !== 'production';
  const backendUrl = isDev ? `http://localhost:${env.DEV_BACKEND_PORT}` : `http://${env.PROD_BACKEND_SERVER}:${env.PROD_BACKEND_PORT}`;
  const frontendPort = isDev ? env.DEV_FRONTEND_PORT : env.PROD_FRONTEND_PORT;
  
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
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },
    define: {
      'process.env': {
        BACKEND_PORT: isDev ? env.DEV_BACKEND_PORT : env.PROD_BACKEND_PORT,
        BACKEND_SERVER: isDev ? 'localhost' : env.PROD_BACKEND_SERVER,
        ENVIRONMENT: env.VITE_ENV,
      },
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
    clearScreen: false,
    cacheDir: 'node_modules/.vite',
  };
});
