import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: process.env.VITE_API_BASE_URL
          ? (p) => p  // Production: no rewrite needed (app at root)
          : (p) => p.replace(/^\/api/, '/AOT-SMS/api'),  // Local: Tomcat deploys as /AOT-SMS/
      },
    },
  },
  build: {
    // Slightly more generous limit, but real win is the manualChunks split below.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy libs that change rarely → their own chunks for browser caching.
          react:    ['react', 'react-dom', 'react-router-dom'],
          query:    ['@tanstack/react-query', '@tanstack/react-table'],
          charts:   ['recharts'],
          motion:   ['framer-motion'],
          forms:    ['react-hook-form', 'zod', '@hookform/resolvers'],
          radix: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
});
