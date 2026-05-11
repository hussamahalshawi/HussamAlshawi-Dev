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

  // ── Plugins ──────────────────────────────────────────────────
  plugins: [react()],                            // Enable React fast-refresh and JSX support

  // ── Path aliases ─────────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),     // '@/components' → 'src/components'
    },
  },

  // ── Dev server ───────────────────────────────────────────────
  server: {
    port: 3000,                                  // Run frontend on port 3000
    proxy: {
      '/api': {
        target:       'http://localhost:5000',   // Forward all /api/* to Flask backend
        changeOrigin: true,                      // Rewrite Host header to match target
        secure:       false,                     // Allow self-signed certs in dev
      },
    },
  },

  // ── Build output ─────────────────────────────────────────────
  build: {
    outDir:                 'dist',              // Production output directory
    sourcemap:              false,               // Disable sourcemaps in production
    chunkSizeWarningLimit:  600,                 // Suppress warnings under 600 kB
  },
});