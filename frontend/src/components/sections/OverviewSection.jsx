/**
 * OverviewSection.jsx — Dashboard Overview (Hero replacement)
 * ─────────────────────────────────────────────────────────
 * Replaces the old full-page hero with a dashboard-style
 * overview panel: welcome header, KPI cards, top projects
 * preview, and performance metrics panel.
 * Matches the Devoryn-style glassmorphism panel layout.
 * Matches the Devoryn-style glassmorphism panel layout.
 * ─────────────────────────────────────────────────────────
 */
import { useRef, useEffect }  from 'react';
import {
  formatExperience,
  getInitials,
}                             from '../../utils/formatters';       // Pure display formatters
import { CHART_COLORS }       from '../../utils/constants';        // Consistent color palette
import { SkeletonKPI }        from '../ui/SkeletonLoader';         // Loading skeleton

/**
 * @param {object}      props
 * @param {object|null} props.profile   - Profile object from /api/portfolio/profile
 * @param {object|null} props.analytics - Analytics object from /api/portfolio/analytics
 */
export default function OverviewSection({ profile, analytics }) {

  // ── Derive display data with safe fallbacks ──────────────────────────────
  const fullName    = profile?.full_name        || 'Hussam Alshawi';
  const title       = profile?.title            || 'Full Stack Developer';
  const bio         = profile?.bio              || '';
  const avatar      = profile?.primary_avatar   || null;
  const expYears    = profile?.experience_years  || 0;
  const score       = profile?.overall_score     || 0;
  const available   = profile?.is_available_for_hire || false;

  // Count data from analytics
  const counts      = analytics?.counts          || {};
  const topSkills   = analytics?.top_skills      || [];

  // KPI card definitions
  const kpis = [
    { label: 'Skills',      value: counts.skills       || 0, icon: '⚙',  color: CHART_COLORS[0] },
    { label: 'Projects',    value: counts.projects      || 0, icon: '⊡', color: CHART_COLORS[1] },
    { label: 'Courses',     value: counts.courses       || 0, icon: '📚', color: CHART_COLORS[2] },
    { label: 'Roles',       value: counts.experience    || 0, icon: '💼', color: CHART_COLORS[3] },
    { label: 'Goals',       value: counts.goals         || 0, icon: '◈',  color: CHART_COLORS[4] },
    { label: 'Achievemts',  value: counts.achievements  || 0, icon: '🏆', color: CHART_COLORS[5] },
  ];

  return (
    <section id="overview" style={{ marginBottom: 'var(--s8)' }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ animationDelay: '0.1s' }}>
        <div className="page-header__left">
          <h1 className="page-header__title">Dashboard Overview</h1>
          <p className="page-header__sub">
            {title} • Portfolio Analytics
          </p>
        </div>

        {/* Availability badge */}
        <div className="page-header__actions">
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s2)',
            padding: 'var(--s2) var(--s4)',
            background: available ? 'rgba(78,204,163,0.12)' : 'var(--glass-light)',
            border: `1px solid ${available ? 'rgba(78,204,163,0.25)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            letterSpacing: '0.08em',
            color: available ? 'var(--green)' : 'var(--text-muted)',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: available ? 'var(--green)' : 'var(--text-muted)',
              boxShadow: available ? '0 0 8px var(--green)' : 'none',
              animation: available ? 'pulseDot 2s ease infinite' : 'none',
            }} />
            {available ? 'Available for Hire' : 'Currently Employed'}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 1: Profile card + KPI grid
      ══════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 'var(--s5)',
        marginBottom: 'var(--s5)',
      }}>

        {/* ── Profile Card (left) ── */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--s4)' }}>

          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px',
            borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem', fontWeight: '800', color: '#fff',
            boxShadow: '0 0 30px rgba(79,195,247,0.25)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {avatar
              ? <img src={avatar} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(fullName)
            }
          </div>

          {/* Name */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem', fontWeight: '700',
              color: 'var(--text-white)', marginBottom: 'var(--s1)',
            }}>
              {fullName}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {title}
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 'var(--s4)', width: '100%',
            padding: 'var(--s4) 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {/* Experience stat */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', color: 'var(--cyan)' }}>
                {formatExperience(expYears)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Yrs Exp
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', background: 'var(--border-subtle)', alignSelf: 'stretch' }} />

            {/* Score stat */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', color: 'var(--blue)' }}>
                {Math.round(score)}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Skill Score
              </div>
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', lineHeight: '1.7', textAlign: 'left' }}>
              {bio.length > 150 ? bio.slice(0, 150) + '...' : bio}
            </p>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 'var(--s2)', width: '100%' }}>
            <a href="#contact" className="btn btn--cta btn--sm" style={{ flex: 1, justifyContent: 'center' }}>
              Hire Me
            </a>
            <a href="#projects" className="btn btn--ghost btn--sm" style={{ flex: 1, justifyContent: 'center' }}>
              Projects
            </a>
          </div>
        </div>

        {/* ── KPI Grid (right) ── */}
        <div>
          <div className="kpi-grid">
            {kpis.map((kpi, i) => (
              <AnimatedKpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                delay={i * 80}                               /* Staggered entrance */
              />
            ))}
          </div>

          {/* Top skills quick view */}
          {topSkills.length > 0 && (
            <div className="panel" style={{ marginTop: 0 }}>
              <div className="panel__header">
                <span className="panel__title">Top Skills</span>
                <a href="#skills" className="btn btn--ghost btn--sm">View All →</a>
              </div>
              <div>
                {topSkills.slice(0, 5).map((skill, i) => (
                  <div key={skill.skill_name} className="skill-row">
                    <span className="skill-row__name">{skill.skill_name}</span>
                    <div className="skill-row__track">
                      <div
                        className="skill-row__fill"
                        style={{
                          width: `${skill.score}%`,
                          background: skill.color
                            ? `linear-gradient(90deg, ${skill.color}, var(--blue))`
                            : `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, var(--blue))`,
                          transform: 'scaleX(1)',             /* Already animated by CSS above */
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
 * AnimatedKpiCard — individual KPI count card with count-up animation.
 * @param {{ label, value, icon, color, delay }} props
 */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {
  const numRef = useRef(null);                                // DOM ref for animated number

  // Count-up animation using requestAnimationFrame
  useEffect(() => {
    if (!numRef.current || value === 0) return;

    const duration = 1400;                                    // Animation length in ms
    const start    = performance.now();                       // Starting timestamp

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1); // Normalize 0→1
      const eased    = 1 - Math.pow(1 - progress, 3);         // Cubic ease-out
      const current  = Math.round(eased * value);             // Current display value

      if (numRef.current) numRef.current.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);          // Continue until done
    };

    // Respect stagger delay before starting animation
    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);                         // Cleanup timeout
  }, [value, delay]);

  return (
    <div
      className="kpi-card"
      style={{
        '--kpi-color': color,                                 /* CSS variable for glow color */
        animation: `fadeUp 0.5s ease ${delay}ms both`,       /* Staggered entrance */
      }}
    >
      <div className="kpi-card__icon" style={{ color }}>{icon}</div>
      <div ref={numRef} className="kpi-card__num" style={{ color }}>
        {value}                                               {/* Will be animated */}
      </div>
      <div className="kpi-card__label">{label}</div>
    </div>
  );
}