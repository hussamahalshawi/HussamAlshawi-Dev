/**
 * NotFound.jsx — 404 error page
 * Shown when the user navigates to a non-existent route.
 * Matches the dark, techy aesthetic of the portfolio.
 */
import Button from '../components/ui/Button';                 // Reusable button component
import '../styles/pages/NotFound.css';                        // Component-specific styles

/**
 * NotFound — renders a full-viewport 404 page with:
 * - Giant outlined 404 number
 * - Short message
 * - CTA button back to home
 */
export default function NotFound() {
  return (
    <div className="not-found">

      {/* Background glow blob */}
      <div className="not-found__bg" aria-hidden="true" />

      <div className="not-found__content">

        {/* ── Giant 404 ── */}
        <h1 className="not-found__code" aria-label="404">
          404
        </h1>

        {/* ── Heading ── */}
        <h2 className="not-found__title">Page Not Found</h2>

        {/* ── Sub-text ── */}
        <p className="not-found__sub">
          The route you're looking for doesn't exist or has been moved.
          Head back to the portfolio.
        </p>

        {/* ── Actions ── */}
        <div className="not-found__actions">
          <Button variant="primary" size="lg" href="/">
            ← Back to Portfolio
          </Button>
          <Button variant="ghost" size="lg" href="#contact">
            Contact Me
          </Button>
        </div>
      </div>
    </div>
  );
}