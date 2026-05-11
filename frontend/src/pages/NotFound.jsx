/**
 * NotFound.jsx — 404 Page
 * ─────────────────────────────────────────────────────────
 * Full-screen 404 error page with:
 *   - ParticleBackground canvas (lime green network animation)
 *   - Radial vignette overlay to focus the center
 *   - Glitch-animated "404" large display number
 *   - Mono label + heading + subtitle
 *   - Primary CTA (back to home) + Ghost CTA (contact)
 *   - Decorative CSS corner brackets
 *   - Decorative coordinate strip at bottom
 *
 * Design: Dark-only — intentionally ignores light/dark theme.
 * The lime #c8ff57 accent matches ParticleBackground's color.
 * ─────────────────────────────────────────────────────────
 */

import ParticleBackground from '../components/ui/ParticleBackground'; // Generative canvas bg
import '../styles/pages/NotFound.css';                                 // Page-specific styles

/**
 * NotFound — renders the full 404 error experience.
 * No props required — self-contained page component.
 * @returns {JSX.Element}
 */
export default function NotFound() {
  return (
    <div className="nf" role="main" aria-label="404 Page Not Found">

      {/* ── Particle canvas — fills the entire background ── */}
      {/* z-index: 0 — sits below all other layers            */}
      <ParticleBackground />

      {/* ── Radial vignette — darkens edges, focuses center ── */}
      <div className="nf__vignette" aria-hidden="true" />

      {/* ── Ambient lime glow blob behind 404 text ── */}
      <div className="nf__glow" aria-hidden="true" />

      {/* ── Decorative CSS corner brackets ── */}
      <div className="nf__corner nf__corner--tl" aria-hidden="true" /> {/* Top-left     */}
      <div className="nf__corner nf__corner--tr" aria-hidden="true" /> {/* Top-right    */}
      <div className="nf__corner nf__corner--bl" aria-hidden="true" /> {/* Bottom-left  */}
      <div className="nf__corner nf__corner--br" aria-hidden="true" /> {/* Bottom-right */}

      {/* ── Main content — above all decorative layers ── */}
      <div className="nf__content">

        {/* Status label — flanked by decorative lines */}
        <div className="nf__label" aria-hidden="true">
          ERROR · NODE UNAVAILABLE
        </div>

        {/* Giant glitch "404" — data-text used by CSS ::before glitch clone */}
        <div
          className="nf__code"
          data-text="404"
          role="heading"
          aria-level={1}
          aria-label="404"
        >
          404
        </div>

        {/* Page title */}
        <h2 className="nf__title">
          Connection Lost
        </h2>

        {/* Descriptive subtitle */}
        <p className="nf__sub">
          The node you're looking for has been moved,<br />
          decommissioned, or never existed in this cluster.
        </p>

        {/* CTA buttons */}
        <div className="nf__actions">

          {/* Primary — go home */}
          <a
            href="/"
            className="nf__btn--primary"
            aria-label="Return to home page"
          >
            ← Re-establish Home
          </a>

          {/* Ghost — go to contact section */}
          <a
            href="/#contact"
            className="nf__btn--ghost"
            aria-label="Go to contact section"
          >
            Contact Support
          </a>

        </div>
      </div>

      {/* ── Decorative coordinate strip — bottom center ── */}
      <div className="nf__coords" aria-hidden="true">
        <span className="nf__coord">LAT 33.5138° N</span>
        <span className="nf__coord-sep" />
        <span className="nf__coord">LNG 36.2765° E</span>
        <span className="nf__coord-sep" />
        <span className="nf__coord">NODE · NULL</span>
        <span className="nf__coord-sep" />
        <span className="nf__coord">STATUS · 404</span>
      </div>

    </div>
  );
}