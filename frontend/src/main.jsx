/**
 * main.jsx — React 18 application entry point.
 *
 * Render order (outermost → innermost):
 *   StrictMode → ThemeProvider → BrowserRouter → App
 *
 * Also hides the #boot-loader overlay after React mounts,
 * so the user sees the Devoryn glass UI instead of a blank
 * screen during the initial bundle download.
 */
import { StrictMode }    from 'react';            // Highlights potential issues in dev mode
import { createRoot }    from 'react-dom/client'; // React 18 concurrent rendering API
import { BrowserRouter } from 'react-router-dom'; // Client-side routing context

import { ThemeProvider } from '@/context/ThemeContext'; // Global dark / light mode state
import App               from './App.jsx';               // Root application component

import '@/styles/index.css';                            // Global design tokens + reset

// ── Mount React ──────────────────────────────────────────────────
const rootElement = document.getElementById('root');    // Target div in index.html

createRoot(rootElement).render(
  <StrictMode>
    {/* ThemeProvider — sets data-theme on <html>, persists to localStorage */}
    <ThemeProvider>
      {/* BrowserRouter — enables <Routes> and <Link> throughout the tree */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

// ── Dismiss boot loader after React hydrates ─────────────────────
// Uses requestAnimationFrame + setTimeout to ensure the first
// paint of the React UI is visible before the loader fades out.
requestAnimationFrame(() => {
  setTimeout(() => {
    const loader = document.getElementById('boot-loader'); // The inline loader in index.html
    if (loader) {
      loader.classList.add('hidden');                      // Triggers CSS opacity fade-out
      // Remove from DOM after transition ends (500ms) to free memory
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }
  }, 200);                                                 // 200ms delay ensures first frame is painted
});