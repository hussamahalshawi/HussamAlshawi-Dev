/**
 * OverviewSection.jsx — Dashboard Overview (Hero Replacement)
 * ─────────────────────────────────────────────────────────
 * Replaces the old full-page hero with a dashboard-style
 * overview: welcome header, profile card, KPI grid,
 * top skills quick-view, and performance panel.
 * Matches the Devoryn-style glassmorphism layout.
 * ─────────────────────────────────────────────────────────
 */
import { useRef, useEffect }  from 'react';
import {
  formatExperience,
  getInitials,
}                             from '../../utils/formatters';       // Pure display formatters
import { CHART_COLORS }       from '../../utils/constants';        // Consistent color palette
import { SkeletonKPI }        from '../ui/SkeletonLoader';         // Loading skeleton
import '../../styles/components/OverviewSection.css';              // Component styles

/**
 * @param {object}      props
 * @param {object|null} props.profile   - Profile object from API
 * @param {object|null} props.analytics - Analytics object from API
 */
export default function OverviewSection({ profile, analytics }) {

  // ── Safe fallbacks for all display values ───────────────────────────────
  const fullName  = profile?.full_name              || 'Hussam Alshawi';
  const title     = profile?.title                  || 'Full Stack Developer';
  const bio       = profile?.bio                    || '';
  const avatar    = profile?.primary_avatar         || null;
  const expYears  = profile?.experience_years        || 0;
  const score     = profile?.overall_score           || 0;
  const available = profile?.is_available_for_hire   || false;

  // Analytics counts
  const counts    = analytics?.counts   || {};
  const topSkills = analytics?.top_skills || [];

  // KPI cards config
  const kpis = [
    { label: 'Skills',      value: counts.skills       || 0, icon: '⚙',  color: CHART_COLORS[0] },
    { label: 'Projects',    value: counts.projects      || 0, icon: '⊡',  color: CHART_COLORS[1] },
    { label: 'Courses',     value: counts.courses       || 0, icon: '📚', color: CHART_COLORS[2] },
    { label: 'Roles',       value: counts.experience    || 0, icon: '💼', color: CHART_COLORS[3] },
    { label: 'Goals',       value: counts.goals         || 0, icon: '◈',  color: CHART_COLORS[4] },
    { label: 'Achievemts',  value: counts.achievements  || 0, icon: '🏆', color: CHART_COLORS[5] },
  ];

  return (
    <section id="overview" className="overview-section">

      {/* ── Page header ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">Dashboard Overview</h1>
          <p className="page-header__sub">
            {title} · Portfolio Analytics
          </p>
        </div>

        {/* Availability pill */}
        <div className="page-header__actions">
          <div className={`availability-pill ${available ? 'availability-pill--open' : ''}`}>
            <span className={`availability-pill__dot ${available ? 'availability-pill__dot--pulse' : ''}`} />
            {available ? 'Available for Hire' : 'Currently Employed'}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 1: Profile card + KPI grid
      ══════════════════════════════════════ */}
      <div className="overview-row">

        {/* ── Profile Card ── */}
        <div className="profile-card">

          {/* Avatar with glow ring */}
          <div className="profile-card__avatar-wrap">
            <div className="profile-card__avatar">
              {avatar
                ? <img src={avatar} alt={fullName} />
                : <span>{getInitials(fullName)}</span>
              }
            </div>
            {/* Online indicator */}
            <div className="profile-card__online" title="Online" />
          </div>

          {/* Name and title */}
          <div className="profile-card__info">
            <div className="profile-card__name">{fullName}</div>
            <div className="profile-card__title">{title}</div>
          </div>

          {/* Stats row */}
          <div className="profile-card__stats">
            <div className="profile-stat">
              <div className="profile-stat__num" style={{ color: 'var(--cyan)' }}>
                {formatExperience(expYears)}
              </div>
              <div className="profile-stat__label">Yrs Exp</div>
            </div>
            <div className="profile-stat__divider" />
            <div className="profile-stat">
              <div className="profile-stat__num" style={{ color: 'var(--blue)' }}>
                {Math.round(score)}
              </div>
              <div className="profile-stat__label">Score</div>
            </div>
            <div className="profile-stat__divider" />
            <div className="profile-stat">
              <div className="profile-stat__num" style={{ color: 'var(--green)' }}>
                {counts.projects || 0}
              </div>
              <div className="profile-stat__label">Projects</div>
            </div>
          </div>

          {/* Bio text */}
          {bio && (
            <p className="profile-card__bio">
              {bio.length > 160 ? bio.slice(0, 160) + '…' : bio}
            </p>
          )}

          {/* CTA buttons */}
          <div className="profile-card__actions">
            <a href="#contact" className="btn btn--cta btn--sm profile-card__btn">
              Hire Me
            </a>
            <a href="#projects" className="btn btn--ghost btn--sm profile-card__btn">
              Projects →
            </a>
          </div>
        </div>

        {/* ── Right column: KPI grid + top skills ── */}
        <div className="overview-right">

          {/* KPI Cards */}
          <div className="kpi-grid">
            {kpis.map((kpi, i) => (
              <AnimatedKpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                delay={i * 90}                               // Staggered entrance
              />
            ))}
          </div>

          {/* Top skills quick view panel */}
          {topSkills.length > 0 && (
            <div className="top-skills-panel">
              <div className="top-skills-panel__header">
                <span className="top-skills-panel__title">Top Skills</span>
                <a href="#skills" className="btn btn--ghost btn--sm">View All →</a>
              </div>
              <div className="top-skills-panel__list">
                {topSkills.slice(0, 5).map((skill, i) => (
                  <div key={skill.skill_name} className="skill-row">
                    <span className="skill-row__name">{skill.skill_name}</span>
                    <div className="skill-row__track">
                      <div
                        className="skill-row__fill"
                        style={{
                          width:      `${skill.score}%`,
                          background: skill.color
                            ? `linear-gradient(90deg, ${skill.color}, var(--cyan))`
                            : `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, var(--cyan))`,
                          transform:  'scaleX(1)',           // Already visible in overview
                        }}
                      />
                    </div>
                    <span className="skill-row__pct">{skill.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * AnimatedKpiCard — count card with count-up animation.
 * @param {{ label, value, icon, color, delay }} props
 */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {
  const numRef = useRef(null);                                // DOM ref for number

  useEffect(() => {
    if (!numRef.current || value === 0) return;

    const duration = 1400;
    const start    = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1); // Normalize 0→1
      const eased    = 1 - Math.pow(1 - progress, 3);          // Cubic ease-out
      const current  = Math.round(eased * value);

      if (numRef.current) numRef.current.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);                          // Cleanup timer
  }, [value, delay]);

  return (
    <div
      className="kpi-card"
      style={{
        '--kpi-color': color,
        animation:     `fadeUp 0.5s ease ${delay}ms both`,
      }}
    >
      <div className="kpi-card__icon" style={{ color }}>{icon}</div>
      <div ref={numRef} className="kpi-card__num" style={{ color }}>{value}</div>
      <div className="kpi-card__label">{label}</div>
    </div>
  );
}