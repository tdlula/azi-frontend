import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = env.ENVIRONMENT !== 'production';
  const backendUrl = isDev ? `http://localhost:${env.BACKEND_PORT}` : `http://${env.BACKEND_SERVER}:${env.BACKEND_PORT}`;
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(env.FRONTEND_PORT) || 7001,
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
        BACKEND_PORT: env.BACKEND_PORT,
        BACKEND_SERVER: env.BACKEND_SERVER,
        ENVIRONMENT: env.ENVIRONMENT,
      },
      __BACKEND_URL__: JSON.stringify(backendUrl),
    },
    clearScreen: false,
    cacheDir: 'node_modules/.vite',
  };
});
