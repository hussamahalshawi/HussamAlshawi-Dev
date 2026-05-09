/**
 * AnalyticsSection.jsx — Portfolio Analytics Overview
 * ─────────────────────────────────────────────────────────
 * Displays: KPI count cards, top skills horizontal bars,
 * goals progress summary, and skills distribution legend.
 * All data comes from the analytics prop (no internal fetching).
 * ─────────────────────────────────────────────────────────
 */
import { useRef, useEffect }  from 'react';                   // Refs for count-up animation
import { CHART_COLORS,
         SKILL_BANDS }        from '../../utils/constants';   // Chart colours + bands
import { SkeletonKPI }        from '../ui/SkeletonLoader';    // KPI loading skeleton
import Badge                  from '../ui/Badge';             // Distribution band badges
import '../../styles/components/AnalyticsSection.css';        // Component-specific styles

/**
 * @param {object}      props
 * @param {object|null} props.analytics - Analytics object from /api/portfolio/analytics
 */
export default function AnalyticsSection({ analytics }) {

  // Show skeletons while loading
  if (!analytics) {
    return (
      <section id="analytics" className="section">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Analytics</span>
            <h2 className="s-title">By the Numbers</h2>
          </div>
          <div className="kpi-grid">
            {Array.from({ length: 6 }, (_, i) => <SkeletonKPI key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  const counts    = analytics.counts             || {};        // Entity counts object
  const topSkills = analytics.top_skills         || [];        // Top 10 skills array
  const radar     = analytics.skills_radar       || [];        // Category averages
  const dist      = analytics.skills_distribution || {};       // Band distribution

  // KPI cards configuration
  const kpis = [
    { key: 'skills',       label: 'Skills',       icon: '⚙',  color: CHART_COLORS[0] },
    { key: 'projects',     label: 'Projects',     icon: '⊡',  color: CHART_COLORS[1] },
    { key: 'courses',      label: 'Courses',      icon: '📚', color: CHART_COLORS[2] },
    { key: 'experience',   label: 'Roles',        icon: '💼', color: CHART_COLORS[3] },
    { key: 'education',    label: 'Degrees',      icon: '🎓', color: CHART_COLORS[4] },
    { key: 'achievements', label: 'Achievements', icon: '🏆', color: CHART_COLORS[5] },
    { key: 'self_study',   label: 'Self Study',   icon: '✍',  color: CHART_COLORS[6] },
    { key: 'goals',        label: 'Goals',        icon: '◈',  color: CHART_COLORS[7] },
  ];

  return (
    <section id="analytics" className="section">
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Analytics</span>
          <h2 className="s-title">By the Numbers</h2>
          <p className="s-sub">
            A data-driven snapshot of the entire portfolio
          </p>
        </div>

        {/* ── KPI count cards ── */}
        <div className="kpi-grid">
          {kpis.map(kpi => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={counts[kpi.key] || 0}                    // Safely access count
              icon={kpi.icon}
              color={kpi.color}
            />
          ))}
        </div>

        {/* ── Two-column layout: top skills + distribution ── */}
        <div className="analytics-bottom">

          {/* ── Top skills horizontal bars ── */}
          <div className="analytics-skills">
            <p className="skill-group__title" style={{ marginBottom: 'var(--s5)' }}>
              Top Skills
            </p>
            {topSkills.slice(0, 8).map((skill, index) => (    // Show top 8
              <div key={skill.skill_name} className="skill-row">
                <span className="skill-row__name">{skill.skill_name}</span>
                <div className="skill-row__track">
                  <div
                    className="skill-row__fill"
                    style={{
                      width: `${skill.score}%`,               // Bar width = score
                      background: skill.color
                        ? `linear-gradient(90deg, ${skill.color}, #4FC3F7)`
                        : `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]}, #4FC3F7)`,
                      transform: 'scaleX(1)',                  // Visible by default in analytics
                    }}
                  />
                </div>
                <span className="skill-row__pct">{skill.score}%</span>
              </div>
            ))}
          </div>

          {/* ── Skill distribution bands ── */}
          <div className="analytics-dist">
            <p className="skill-group__title" style={{ marginBottom: 'var(--s5)' }}>
              Proficiency Distribution
            </p>

            {/* Each proficiency band as a row */}
            {Object.entries(SKILL_BANDS).map(([key, band]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s4)' }}>
                {/* Band label */}
                <div style={{ width: '90px' }}>
                  <Badge label={band.label} style={{ color: band.color }} variant="muted" />
                </div>
                {/* Progress bar */}
                <div style={{
                  flex:         1,
                  height:       '4px',
                  background:   'rgba(255,255,255,0.06)',
                  borderRadius: 'var(--r-full)',
                  overflow:     'hidden',
                }}>
                  <div style={{
                    height:       '100%',
                    width:        `${calcBandWidth(dist[key], counts.skills)}%`,
                    background:   band.color,
                    borderRadius: 'var(--r-full)',
                    transition:   'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                {/* Count */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   '0.68rem',
                  color:      'var(--text-muted)',
                  minWidth:   '28px',
                  textAlign:  'right',
                }}>
                  {dist[key] || 0}
                </span>
              </div>
            ))}

            {/* Category averages summary */}
            {radar.length > 0 && (
              <div style={{ marginTop: 'var(--s6)', paddingTop: 'var(--s5)', borderTop: '1px solid var(--border-subtle)' }}>
                <p className="skill-group__title" style={{ marginBottom: 'var(--s4)' }}>
                  Category Averages
                </p>
                {radar.slice(0, 5).map((cat, i) => (          // Top 5 categories
                  <div key={cat.category} style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    marginBottom:   'var(--s2)',
                    padding:        'var(--s2) 0',
                    borderBottom:   '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
                      {cat.category}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   '0.72rem',
                      color:      CHART_COLORS[i % CHART_COLORS.length],
                      fontWeight: 600,
                    }}>
                      {cat.avg_score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * KpiCard — count card with icon, animated number, and label.
 * @param {{ label, value, icon, color }} props
 */
function KpiCard({ label, value, icon, color }) {
  const numRef = useRef(null);                                // Ref for count-up animation

  // ── Count-up animation on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!numRef.current || value === 0) return;               // Skip if zero

    const duration = 1200;                                    // Animation duration ms
    const start    = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1); // 0 → 1
      const eased    = 1 - Math.pow(1 - progress, 3);         // Cubic ease-out
      const current  = Math.round(eased * value);             // Current value

      if (numRef.current) numRef.current.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);          // Continue animation
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className="kpi-card">
      <div className="kpi-card__icon" style={{ color }}>{icon}</div>
      <div ref={numRef} className="kpi-card__num" style={{ color }}>
        {value}                                               // Animated by useEffect
      </div>
      <div className="kpi-card__label">{label}</div>
    </div>
  );
}

/**
 * Calculates percentage width for a distribution band bar.
 * @param {number} bandCount   - Count in this band
 * @param {number} totalSkills - Total skills count
 * @returns {number} - 0-100
 */
function calcBandWidth(bandCount = 0, totalSkills = 1) {
  if (!totalSkills) return 0;                                 // Avoid division by zero
  return Math.round((bandCount / totalSkills) * 100);
}