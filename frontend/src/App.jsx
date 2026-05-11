/**
 * App.jsx — Root application component.
 *
 * Defines all client-side routes using React Router v6.
 * The Devoryn dashboard uses DashboardLayout (sidebar + topbar)
 * as the persistent shell — there is NO separate Navbar or Footer
 * at this level. Both are embedded inside DashboardLayout.
 *
 * Routes:
 *   /       → Home    (main portfolio dashboard — Devoryn style)
 *   *       → NotFound (404 fallback)
 */
import { Routes, Route } from 'react-router-dom'; // Declarative routing primitives
import Home              from '@/pages/Home';      // Main dashboard page
import NotFound          from '@/pages/NotFound';  // 404 fallback page

/**
 * App — routing shell.
 * No Navbar / Footer here; DashboardLayout owns the persistent UI.
 */
export default function App() {
  return (
    <Routes>
      {/* ── Main portfolio dashboard ── */}
      <Route path="/"  element={<Home />} />

      {/* ── Catch-all 404 ── */}
      <Route path="*"  element={<NotFound />} />
    </Routes>
  );
}