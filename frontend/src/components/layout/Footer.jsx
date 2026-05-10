/**
 * Footer.jsx — Bottom Strip of the Portfolio
 * ─────────────────────────────────────────────────────────
 * Shows social links pulled from profile and copyright line.
 * Data is fetched via the useProfile hook (not passed as prop).
 * ─────────────────────────────────────────────────────────
 */
import { useProfile }       from '../../hooks/useProfile';    // Profile hook for social URLs
import { SOCIAL_PLATFORMS } from '../../utils/constants';     // Social platform config array
import '../../styles/components/Footer.css';                  // Component styles

/**
 * Footer — renders a minimal dark strip with:
 * - Social icon links on the left (only non-null URLs)
 * - Copyright text on the right
 */
export default function Footer() {
  const { profile } = useProfile();                           // Profile data

  // Build active social links (only those with a URL in profile.social)
  const activeSocials = SOCIAL_PLATFORMS.filter(
    platform => profile?.social?.[platform.key]
  );

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">

        {/* ── Social links ── */}
        <div className="footer__socials">
          {activeSocials.map(platform => (
            <a
              key={platform.key}
              href={profile.social[platform.key]}             // URL from API
              target="_blank"
              rel="noopener noreferrer"                       // Security: prevent opener access
              className="footer__soc-link"
              aria-label={`Visit ${platform.label} profile`}
            >
              <span className="footer__soc-icon" aria-hidden="true">
                {platform.icon}
              </span>
              <span className="footer__soc-label">{platform.label}</span>
            </a>
          ))}

          {/* Empty state when no socials configured */}
          {activeSocials.length === 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No social links configured
            </span>
          )}
        </div>

        {/* ── Copyright ── */}
        <p className="footer__copy">
          © {new Date().getFullYear()}{' '}
          <span className="footer__copy-name">Hussam Alshawi</span>
          <span className="footer__copy-accent"> — Built with Flask &amp; React</span>
        </p>
      </div>
    </footer>
  );
}