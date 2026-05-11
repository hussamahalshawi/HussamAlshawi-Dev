/**
 * App.jsx — Root application component.
 * ─────────────────────────────────────────────────────────
 * Defines all client-side routes using React Router v6.
 *
 * Architecture note:
 *   There is NO Navbar or Footer at this level.
 *   DashboardLayout (inside Home) owns the persistent shell:
 *   fixed sidebar + sticky topbar + scrollable content area.
 *
 * Routes:
 *   /   → Home     (main portfolio dashboard)
 *   *   → NotFound (404 fallback for any unknown path)
 * ─────────────────────────────────────────────────────────
 */
import { Routes, Route } from 'react-router-dom'; // React Router v6 declarative routing
import Home              from '@/pages/Home';      // Main portfolio dashboard page
import NotFound          from '@/pages/NotFound';  // 404 fallback page

/**
 * App — routing shell.
 * Renders the correct page component based on the current URL.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <Routes>
      {/* ── Main portfolio dashboard ── */}
      <Route path="/"  element={<Home />} />

      {/* ── Catch-all 404 — matches any unrecognized path ── */}
      <Route path="*"  element={<NotFound />} />
    </Routes>
  );
}