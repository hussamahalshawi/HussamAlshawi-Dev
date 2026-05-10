/**
 * Navbar.jsx — Fixed Top Navigation Bar
 * ─────────────────────────────────────────────────────────
 * Features: scroll-aware glassmorphism background,
 * active link highlight via IntersectionObserver,
 * availability badge from profile data.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect }  from 'react';                 // React hooks
import { NAV_LINKS }            from '../../utils/constants'; // Centralised nav links
import { useProfile }           from '../../hooks/useProfile'; // Profile hook
import '../../styles/components/Navbar.css';                  // Component styles

/**
 * Navbar — renders a fixed floating pill navigation bar with:
 * - Logo on the left
 * - Navigation links in the center
 * - Availability badge on the right (when is_available_for_hire)
 */
export default function Navbar() {
  const [stuck,         setStuck]         = useState(false);  // Scrolled-down state
  const [activeSection, setActiveSection] = useState('');     // Currently visible section ID

  const { profile } = useProfile();                           // Fetch profile for badge

  // ── Scroll listener: adds 'stuck' style after 20px ──────────────────────
  useEffect(() => {
    const handleScroll = () => setStuck(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── IntersectionObserver: tracks visible section ─────────────────────────
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href.replace('#', ''));  // Strip '#' prefix

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }                    // Trigger near viewport center
    );

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`navbar ${stuck ? 'navbar--stuck' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Logo ── */}
      <a href="#" className="navbar__logo" aria-label="Home">
        HA<em>.</em>Dev
      </a>

      {/* ── Navigation links ── */}
      <ul className="navbar__menu" role="list">
        {NAV_LINKS.map(link => (
          <li key={link.href}>
            <a
              href={link.href}
              className={`navbar__link ${
                activeSection === link.href.replace('#', '')
                  ? 'navbar__link--active'
                  : ''
              }`}
              aria-current={
                activeSection === link.href.replace('#', '')
                  ? 'page'
                  : undefined
              }
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* ── Availability badge (only when available for hire) ── */}
      {profile?.is_available_for_hire && (
        <span className="navbar__badge" aria-label="Status: Available for hire">
          Available for hire
        </span>
      )}
    </nav>
  );
}