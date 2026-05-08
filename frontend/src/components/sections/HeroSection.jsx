/**
 * HeroSection.jsx — Main hero / landing section
 * Displays name, title, bio, CTA buttons, avatar with rings,
 * floating info chips, and bottom stats bar.
 * All data comes from the profile prop (no internal fetching).
 */
import { useState }          from 'react';                    // State for avatar load tracking
import Button                from '../ui/Button';             // Reusable button component
import {
  formatExperience,
  getInitials,
}                            from '../../utils/formatters';   // Pure formatting helpers
import { SOCIAL_PLATFORMS }  from '../../utils/constants';    // Social platform config

/**
 * @param {object}      props
 * @param {object|null} props.profile - Profile object from /api/portfolio/profile
 */
export default function HeroSection({ profile }) {

  const [imgLoaded, setImgLoaded] = useState(false);          // Track avatar image load state

  // ── Derive display values safely (guard against null profile) ────────────
  const fullName   = profile?.full_name       || 'Hussam Alshawi';     // Fallback name
  const title      = profile?.title           || 'Full Stack Developer'; // Fallback title
  const bio        = profile?.bio             || '';                     // Bio text
  const avatar     = profile?.primary_avatar  || '';                    // Cloudinary URL
  const expYears   = profile?.experience_years || 0;                    // Years of experience
  const score      = profile?.overall_score    || 0;                    // Overall skill score
  const available  = profile?.is_available_for_hire || false;           // Hire availability
  const social     = profile?.social           || {};                    // Social links object

  // Split name into two lines for the staggered rise-up animation
  const nameParts  = fullName.trim().split(' ');                // ['Hussam', 'Alshawi']
  const firstName  = nameParts[0]  || '';                       // First name
  const lastName   = nameParts.slice(1).join(' ') || '';        // Rest of name

  // Find the first available social link for the "Connect" button
  const firstSocial = SOCIAL_PLATFORMS.find(p => social[p.key]);

  return (
    <section id="about" className="hero">                       {/* Section ID for nav highlighting */}

      {/* ── Background blobs + grid overlay ── */}
      <div className="hero__bg"         aria-hidden="true" />  {/* Radial gradient blobs */}
      <div className="hero__grid-lines" aria-hidden="true" />  {/* Subtle grid texture */}

      {/* ═══════════════════════════════════════
          LEFT COLUMN — text content
      ═══════════════════════════════════════ */}
      <div className="hero__left">

        {/* ── Eyebrow line ── */}
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-line" aria-hidden="true" />  {/* Animated line */}
          {available ? 'Available for hire' : 'Portfolio'}    {/* Dynamic availability text */}
        </div>

        {/* ── Name with staggered animation ── */}
        <h1 className="hero__name">
          <span className="hero__name-line">
            <span>{firstName}</span>                           {/* Animates in first */}
          </span>
          <span className="hero__name-line">
            <span className="hero__accent">{lastName}</span>  {/* Outline accent style */}
          </span>
        </h1>

        {/* ── Title ── */}
        <p className="hero__title">
          <strong>{title}</strong>                             {/* Bold job title */}
        </p>

        {/* ── Bio ── */}
        {bio && (
          <p className="hero__bio">{bio}</p>
        )}

        {/* ── CTA buttons ── */}
        <div className="hero__btns">
          <Button
            variant="primary"
            size="lg"
            href="#contact"                                    /* Scroll to contact section */
          >
            Hire Me
          </Button>

          {/* Show social link button only if a social URL exists */}
          {firstSocial && (
            <Button
              variant="ghost"
              size="lg"
              href={social[firstSocial.key]}                  /* First available social URL */
            >
              {firstSocial.icon} {firstSocial.label}          {/* Icon + label */}
            </Button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT COLUMN — avatar
      ═══════════════════════════════════════ */}
      <div className="hero__right">
        <div className="avatar-wrap">

          {/* ── Decorative spinning rings ── */}
          <div className="avatar-ring--outer" aria-hidden="true" />
          <div className="avatar-ring--inner" aria-hidden="true" />

          {/* ── Photo frame ── */}
          <div className="avatar-frame">

            {/* Initials placeholder — visible until image loads */}
            {!imgLoaded && (
              <div className="avatar-placeholder">
                {getInitials(fullName)}                        {/* "HA" initials */}
              </div>
            )}

            {/* Avatar image — hidden until loaded to prevent flash */}
            {avatar && (
              <img
                src={avatar}
                alt={`${fullName} — portfolio avatar`}        /* Descriptive alt text */
                className={`avatar-img ${imgLoaded ? 'avatar-img--loaded' : ''}`}
                onLoad={() => setImgLoaded(true)}             /* Show image when ready */
                onError={() => setImgLoaded(false)}           /* Keep placeholder on error */
              />
            )}
          </div>

          {/* ── Floating chip: experience years ── */}
          <div className="avatar-chip">
            <div className="avatar-chip__label">Experience</div>
            <div className="avatar-chip__value">
              {formatExperience(expYears)}                     {/* "5+" or "5.2" */}
              <span style={{ fontSize: '0.65rem', color: '#9BA3C0' }}> yrs</span>
            </div>
          </div>

          {/* ── Floating chip: overall score ── */}
          <div className="avatar-chip2">
            <div className="avatar-chip__label">Score</div>
            <div className="avatar-chip__value">
              {Math.round(score)}
              <span style={{ fontSize: '0.65rem', color: '#9BA3C0' }}>/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          BOTTOM STATS BAR
      ═══════════════════════════════════════ */}
      <div className="hero__stats" role="list">

        {/* Stat: Years of experience */}
        <div className="stat-box" role="listitem">
          <div className="stat-box__num">
            {formatExperience(expYears)}                       {/* Dynamic value */}
          </div>
          <div className="stat-box__label">Years Experience</div>
        </div>

        {/* Stat: Overall skill score */}
        <div className="stat-box" role="listitem">
          <div className="stat-box__num">
            <span>{Math.round(score)}</span>                   {/* Lime-coloured number */}
            <span style={{ fontSize: '1.4rem', color: '#9BA3C0' }}>/100</span>
          </div>
          <div className="stat-box__label">Skill Score</div>
        </div>

        {/* Stat: Remote preference */}
        <div className="stat-box" role="listitem">
          <div className="stat-box__num" style={{ fontSize: '1.4rem' }}>
            {profile?.remote_preference ? '🌍' : '🏢'}       {/* Emoji indicator */}
          </div>
          <div className="stat-box__label">
            {profile?.remote_preference ? 'Remote Ready' : 'On-site'}
          </div>
        </div>

        {/* Stat: Availability */}
        <div className="stat-box" role="listitem">
          <div className="stat-box__num" style={{ fontSize: '1.1rem', color: available ? '#C8FF57' : '#9BA3C0' }}>
            {available ? 'OPEN' : 'BUSY'}                     {/* Availability status */}
          </div>
          <div className="stat-box__label">For Hire</div>
        </div>
      </div>
    </section>
  );
}