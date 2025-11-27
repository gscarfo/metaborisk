import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      // API_KEY is intentionally removed from here. 
      // It is accessed server-side in api/ai.ts
    },
    build: {
      chunkSizeWarningLimit: 1600,
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});