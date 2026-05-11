/**
 * vite.config.js — Vite build configuration
 * Defines: React plugin, path aliases (@), and dev-server proxy
 * to avoid CORS when calling the Flask backend on port 5000.
 */
import { defineConfig } from 'vite';           // Vite configuration factory
import react            from '@vitejs/plugin-react'; // React HMR + JSX transform
import path             from 'path';            // Node.js path module for alias resolution

export default defineConfig({

  // ── Plugins ──────────────────────────────────────────────────
  plugins: [react()],                           // Enable React fast-refresh and JSX

  // ── Path aliases ─────────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),    // '@/components' → 'src/components'
    },
  },

  // ── Dev server ───────────────────────────────────────────────
  server: {
    port: 3000,                                 // Run frontend on port 3000
    proxy: {
      '/api': {
        target:       'http://localhost:5000',  // Forward all /api/* to Flask backend
        changeOrigin: true,                     // Rewrite Host header to target
        secure:       false,                    // Allow self-signed certs in dev
      },
    },
  },

  // ── Build output ─────────────────────────────────────────────
  build: {
    outDir:      'dist',                        // Output directory for production build
    sourcemap:   false,                         // Disable sourcemaps in production
    chunkSizeWarningLimit: 600,                 // Suppress warnings under 600 kB
  },
});