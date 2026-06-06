/**
 * vite.config.js
 * ─────────────────────────────────────────────────────────
 * Vite build configuration for HA.Dev portfolio frontend.
 * Defines: React plugin, path alias (@), dev-server proxy.
 * The proxy forwards all /api/* requests to Flask backend
 * on port 5000 — avoids CORS issues in development.
 * ─────────────────────────────────────────────────────────
 */
import { defineConfig } from 'vite';            // Vite configuration factory
import react            from '@vitejs/plugin-react'; // React HMR + JSX transform
import path             from 'path';             // Node.js path module for alias resolution

export default defineConfig({
  plugins: [react()],                            // React HMR + JSX transform

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),     // '@/components' → 'src/components'
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },

  css: {
    devSourcemap: false,
  },

  build: {
    outDir:                 'dist',
    sourcemap:              false,
    chunkSizeWarningLimit:  600,
    rollupOptions: {
      output: {
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },
});