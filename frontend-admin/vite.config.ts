import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const backendTarget = env.VITE_APP_ENV === 'prod' ? env.VITE_API_URL_REMOTE : env.VITE_API_URL_LOCAL;
  console.log(`[ViteConfig] Backend target set to: ${backendTarget} (Env: ${env.VITE_APP_ENV || 'local'})`);

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/sh-token': {
          target: 'https://identity.dataspace.copernicus.eu',
          changeOrigin: true,
          rewrite: (path: string) => '/auth/realms/CDSE/protocol/openid-connect/token',
          secure: false,
        },
        '/sh-process': {
          target: 'https://sh.dataspace.copernicus.eu',
          changeOrigin: true,
          rewrite: (path: string) => '/api/v1/process',
          secure: false,
        },
      },
    },
  };
});
