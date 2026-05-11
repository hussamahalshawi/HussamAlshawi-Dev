/**
 * main.jsx — React 18 application entry point.
 * ─────────────────────────────────────────────────────────
 * Import order is critical:
 *   1. boot.css     → First — paints body background before JS runs
 *   2. index.css    → Global design tokens + CSS reset
 *   3. ThemeProvider → Reads saved theme from localStorage immediately
 *   4. BrowserRouter → Provides routing context to all pages
 *   5. App          → Root component with route definitions
 *
 * Boot loader dismissal strategy:
 *   requestAnimationFrame waits for browser to commit first React paint,
 *   then a 200ms timeout ensures the glass UI is visible before
 *   the boot loader starts fading out (500ms CSS transition).
 * ─────────────────────────────────────────────────────────
 */

// ── CSS imports — ORDER MATTERS ───────────────────────────────────
import '@/styles/boot.css';              // Boot loader styles — MUST be first
import '@/styles/index.css';             // Design tokens + CSS reset

// ── React 18 core ────────────────────────────────────────────────
import { StrictMode }    from 'react';           // Dev mode: double-render checks
import { createRoot }    from 'react-dom/client'; // React 18 concurrent API

// ── Routing ──────────────────────────────────────────────────────
import { BrowserRouter } from 'react-router-dom'; // Enables useNavigate, Link, Routes

// ── App providers ────────────────────────────────────────────────
import { ThemeProvider } from '@/context/ThemeContext'; // Dark/light mode global state
import App               from './App.jsx';              // Root routing component

// ── Mount React to the DOM ───────────────────────────────────────
const rootEl = document.getElementById('root');   // Target <div id="root"> in index.html

createRoot(rootEl).render(
  <StrictMode>
    {/* ThemeProvider: sets data-theme on <html>, persists to localStorage */}
    <ThemeProvider>
      {/* BrowserRouter: wraps the whole app with client-side routing context */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

// ── Dismiss boot loader after React hydrates ─────────────────────
/**
 * Two-step delay strategy:
 *   Step 1: requestAnimationFrame — waits for first React paint commit
 *   Step 2: setTimeout(200ms)     — small buffer so glass UI is visible
 *
 * After the CSS fade transition ends (500ms in boot.css),
 * the element is removed from DOM entirely to free memory.
 * The { once: true } option auto-removes the event listener.
 */
requestAnimationFrame(() => {
  setTimeout(() => {
    const loader = document.getElementById('boot-loader'); // The overlay div

    if (loader) {
      loader.classList.add('hidden');             // Triggers opacity/visibility fade-out

      // Remove from DOM after CSS transition completes
      loader.addEventListener(
        'transitionend',
        () => loader.remove(),                    // Full DOM removal after fade
        { once: true }                            // Auto-removes this listener after firing
      );
    }
  }, 200);                                        // 200ms: enough for first React frame
});