/**
 * Navbar.jsx — Fixed top navigation bar
 * Features: scroll-aware background, active link highlight,
 * availability badge pulled from profile data.
 */
import { useState, useEffect }  from 'react';                 // React state and lifecycle hooks
import { NAV_LINKS }            from '../../utils/constants'; // Centralised navigation links array
import { useProfile }           from '../../hooks/useProfile'; // Profile hook for availability badge
import '../../styles/components/Navbar.css';                  // Component-specific styles

/**
 * Navbar — renders a fixed top bar with:
 * - Logo on the left
 * - Navigation links in the center
 * - Availability badge on the right (shown only when is_available_for_hire is true)
 */
export default function Navbar() {
  const [stuck,         setStuck]         = useState(false);  // true when page is scrolled down
  const [activeSection, setActiveSection] = useState('');     // ID of the currently visible section

  const { profile } = useProfile();                           // Fetch profile for availability badge

  // ── Scroll listener — adds 'stuck' class after 20px scroll ──────────────
  useEffect(() => {
    const handleScroll = () => setStuck(window.scrollY > 20); // Toggle stuck state on scroll
    window.addEventListener('scroll', handleScroll);          // Attach listener
    return () => window.removeEventListener('scroll', handleScroll); // Cleanup on unmount
  }, []);

  // ── IntersectionObserver — tracks which section is in viewport ───────────
  useEffect(() => {
    // Build an array of section IDs from NAV_LINKS (strip the '#' prefix)
    const ids = NAV_LINKS.map(l => l.href.replace('#', ''));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id); // Mark as active
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }                    // Trigger near center of viewport
    );

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);                           // Observe each section element
    });

    return () => observer.disconnect();                       // Cleanup observer on unmount
  }, []);

  return (
    <nav className={`navbar ${stuck ? 'navbar--stuck' : ''}`}> {/* Apply blur on scroll */}

      {/* ── Logo ── */}
      <a href="#" className="navbar__logo">
        HA<em>.</em>Dev                                       {/* Lime accent on the dot */}
      </a>

      {/* ── Navigation links ── */}
      <ul className="navbar__menu">
        {NAV_LINKS.map(link => (
          <li key={link.href}>
            <a
              href={link.href}
              className={`navbar__link ${
                activeSection === link.href.replace('#', '')   // Highlight active section
                  ? 'navbar__link--active'
                  : ''
              }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* ── Availability badge (only shown when profile says available) ── */}
      {profile?.is_available_for_hire && (
        <span className="navbar__badge">
          Available for hire                                  {/* Pulsing dot via CSS */}
        </span>
      )}
    </nav>
  );
}