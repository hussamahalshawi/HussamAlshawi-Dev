/**
 * Footer.jsx — Bottom strip of the portfolio
 * Shows social links pulled from the profile and a copyright line.
 */
import { useProfile }       from '../../hooks/useProfile';    // Profile hook for social URLs
import { SOCIAL_PLATFORMS } from '../../utils/constants';     // Social platform config array
import '../../styles/components/Footer.css';                  // Component-specific styles

/**
 * Footer — renders a minimal dark strip with:
 * - Social icon links on the left (only links that exist in the profile)
 * - Copyright text on the right
 */
export default function Footer() {
  const { profile } = useProfile();                           // Fetch profile data

  // Build an array of social links that have a URL value
  const activeSocials = SOCIAL_PLATFORMS.filter(
    platform => profile?.social?.[platform.key]               // Only include non-null URLs
  );

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* ── Social links ── */}
        <div className="footer__socials">
          {activeSocials.map(platform => (
            <a
              key={platform.key}
              href={profile.social[platform.key]}             // URL from API
              target="_blank"                                 // Open in new tab
              rel="noopener noreferrer"                       // Security: prevent opener access
              className="footer__soc-link"
              aria-label={platform.label}                     // Accessibility label
            >
              <span className="footer__soc-icon">{platform.icon}</span> {/* Emoji icon */}
              <span className="footer__soc-label">{platform.label}</span> {/* Platform name */}
            </a>
          ))}
        </div>

        {/* ── Copyright ── */}
        <p className="footer__copy">
          © {new Date().getFullYear()} Hussam Alshawi          {/* Dynamic year */}
          <span className="footer__copy-accent"> — Built with Flask & React</span>
        </p>
      </div>
    </footer>
  );
}