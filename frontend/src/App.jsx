/**
 * App.jsx — Root application component
 * Defines all client-side routes using React Router v6.
 * Each page is a lazy-loaded or direct import to keep the bundle lean.
 */
import { Routes, Route }  from 'react-router-dom';            // Declarative routing primitives
import Navbar             from './components/layout/Navbar';  // Fixed top navigation bar
import Footer             from './components/layout/Footer';  // Bottom footer strip
import Home               from './pages/Home';                // Main portfolio landing page
import NotFound           from './pages/NotFound';            // 404 fallback page

/**
 * App — the routing shell.
 * Navbar and Footer are rendered on every route.
 * The <Routes> block swaps the page content based on the URL.
 */
export default function App() {
  return (
    <>
      {/* ── Persistent navigation ── */}
      <Navbar />

      {/* ── Page content area ── */}
      <main>
        <Routes>
          <Route path="/"  element={<Home />} />              {/* Portfolio home page */}
          <Route path="*"  element={<NotFound />} />          {/* Catch-all 404 route */}
        </Routes>
      </main>

      {/* ── Persistent footer ── */}
      <Footer />
    </>
  );
}