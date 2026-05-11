/**
 * main.jsx — React 18 application entry point.
 *
 * Import order matters here:
 *   1. boot.css     → First import — prevents FOUC by styling
 *                     #boot-loader and body background before
 *                     any component renders.
 *   2. index.css    → Global design tokens, resets, shared classes.
 *   3. ThemeProvider → Reads saved theme from localStorage and
 *                      sets data-theme on <html> immediately.
 *   4. BrowserRouter → Provides routing context to all pages.
 *   5. App          → Root component with route definitions.
 *
 * Boot loader dismissal:
 *   After React's first render, we use requestAnimationFrame +
 *   setTimeout(200ms) to ensure the glass UI is visible before
 *   fading out the boot loader overlay.
 */

// ── CSS imports (order matters) ───────────────────────────────────
import '@/styles/boot.css';                     // Boot loader + body background (FIRST)
import '@/styles/index.css';                    // Global design tokens + CSS reset

// ── React core ───────────────────────────────────────────────────
import { StrictMode }    from 'react';          // Dev-mode double-render checks
import { createRoot }    from 'react-dom/client'; // React 18 concurrent API

// ── Router ───────────────────────────────────────────────────────
import { BrowserRouter } from 'react-router-dom'; // Enables <Routes>, <Link>, useNavigate

// ── App providers ────────────────────────────────────────────────
import { ThemeProvider } from '@/context/ThemeContext'; // Dark / light mode global state
import App               from './App.jsx';              // Root routing component

// ── Mount React ──────────────────────────────────────────────────
const rootEl = document.getElementById('root');         // Target <div id="root"> in index.html

createRoot(rootEl).render(
  <StrictMode>
    {/* ThemeProvider — sets data-theme="light|dark" on <html>, persists to localStorage */}
    <ThemeProvider>
      {/* BrowserRouter — wraps the whole app with routing context */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

// ── Dismiss boot loader after React hydrates ─────────────────────
/**
 * We use a two-step delay:
 *   1. requestAnimationFrame — waits for browser to commit first React paint
 *   2. setTimeout(200ms)     — small buffer so the glass UI is visible
 *                              before the loader starts fading
 *
 * After transition ends (500ms per boot.css), the element is removed
 * from the DOM entirely to free memory.
 */
requestAnimationFrame(() => {
  setTimeout(() => {
    const loader = document.getElementById('boot-loader'); // The overlay div in index.html

    if (loader) {
      loader.classList.add('hidden');                      // Triggers opacity/visibility fade

      // Remove from DOM after CSS transition completes (500ms in boot.css)
      loader.addEventListener(
        'transitionend',
        () => loader.remove(),
        { once: true }                                     // Auto-removes this listener after firing
      );
    }
  }, 200);                                                 // 200ms: enough for first React frame
});