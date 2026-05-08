/**
 * AnalyticsSection.jsx — Portfolio analytics overview
 * Displays: KPI count cards, top skills horizontal bars,
 * goals progress summary, and skills distribution legend.
 * All data comes from the analytics prop (no internal fetching).
 */
import { useRef, useEffect }  from 'react';                   // Refs for count-up animation
import { CHART_COLORS,
         SKILL_BANDS }        from '../../utils/constants';   // Chart colour palette
import { SkeletonKPI }        from '../ui/SkeletonLoader';    // KPI loading skeleton
import Badge                  from '../ui/Badge';             // Distribution band badges

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
            {Array.from({ length: 6 }, (_, i) => <SkeletonKPI key={i} />)} {/* 6 KPI placeholders */}
          </div>
        </div>
      </section>
    );
  }

  const counts     = analytics.counts          || {};         // Entity counts object
  const topSkills  = analytics.top_skills      || [];         // Top 10 skills array
  const radar      = analytics.skills_radar    || [];         // Category averages
  const dist       = analytics.skills_distribution || {};     // Band distribution

  // KPI cards config — each maps a count field to a label and icon
  const kpis = [
    { key: 'skills',       label: 'Skills',        icon: '⚙',  color: CHART_COLORS[0] },
    { key: 'projects',     label: 'Projects',      icon: '🗂',  color: CHART_COLORS[1] },
    { key: 'courses',      label: 'Courses',        icon: '📚', color: CHART_COLORS[2] },
    { key: 'experience',   label: 'Roles',          icon: '💼', color: CHART_COLORS[3] },
    { key: 'education',    label: 'Degrees',        icon: '🎓', color: CHART_COLORS[4] },
    { key: 'achievements', label: 'Achievements',   icon: '🏆', color: CHART_COLORS[5] },
    { key: 'self_study',   label: 'Self Study',     icon: '✍',  color: CHART_COLORS[6] },
    { key: 'goals',        label: 'Goals',          icon: '🎯', color: CHART_COLORS[7] },
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
              value={counts[kpi.key] || 0}                    /* Safely access count */
              icon={kpi.icon}
              color={kpi.color}
            />
          ))}
        </div>

        {/* ── Two-column layout: top skills + distribution ── */}
        <div className="analytics-bottom">

          {/* ── Top skills horizontal bars ── */}
          <div className="analytics-skills">
            <p className="skill-group__title" style={{ marginBottom: '1.2rem' }}>
              Top Skills
            </p>
            {topSkills.slice(0, 8).map((skill, index) => (    /* Show top 8 */}
              <div key={skill.skill_name} className="skill-row">
                <span className="skill-row__name">{skill.skill_name}</span>
                <div className="skill-row__track">
                  <div
                    className="skill-row__fill"
                    style={{
                      width:     `${skill.score}%`,            /* Bar width = score */
                      background: skill.color                  /* API-provided colour */
                        ? `linear-gradient(90deg, ${skill.color}, #00E5FF)`
                        : `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]}, #00E5FF)`,
                      transform: 'scaleX(1)',                  /* Already visible — no scroll trigger */
                    }}
                  />
                </div>
                <span className="skill-row__pct">{skill.score}%</span>
              </div>
            ))}
          </div>

          {/* ── Skill distribution bands ── */}
          <div className="analytics-dist">
            <p className="skill-group__title" style={{ marginBottom: '1.2rem' }}>
              Proficiency Distribution
            </p>

            {/* Each band as a labelled row */}
            {Object.entries(SKILL_BANDS).map(([key, band]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                <div style={{ width: '90px' }}>
                  <Badge label={band.label} style={{ color: band.color }} variant="muted" />
                </div>
                <div style={{ flex: 1, height: '4px', background: 'var(--color-faint)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height:        '100%',
                    width:         `${calcBandWidth(dist[key], counts.skills)}%`, /* Proportion */
                    background:    band.color,
                    borderRadius:  '2px',
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted)', minWidth: '28px' }}>
                  {dist[key] || 0}                              {/* Count in this band */}
                </span>
              </div>
            ))}

            {/* Category averages summary */}
            {radar.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <p className="skill-group__title" style={{ marginBottom: '1rem' }}>
                  Category Averages
                </p>
                {radar.slice(0, 5).map((cat, i) => (           /* Show top 5 categories */}
                  <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{cat.category}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: CHART_COLORS[i % CHART_COLORS.length] }}>
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
 * KpiCard — a single count card with icon, value, and label.
 * @param {{ label, value, icon, color }} props
 */
function KpiCard({ label, value, icon, color }) {
  const numRef = useRef(null);                                // Ref for count-up animation target

  // ── Count-up animation on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!numRef.current || value === 0) return;               // Skip if zero

    const duration = 1200;                                    // Animation duration in ms
    const start    = performance.now();                       // Start timestamp

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1); // 0 → 1
      const eased    = 1 - Math.pow(1 - progress, 3);         // Ease-out cubic
      const current  = Math.round(eased * value);             // Current count value

      if (numRef.current) numRef.current.textContent = current; // Update DOM

      if (progress < 1) requestAnimationFrame(tick);          // Continue animation
    };

    requestAnimationFrame(tick);                              // Kick off animation
  }, [value]);

  return (
    <div className="kpi-card">
      <div className="kpi-card__icon" style={{ color }}>
        {icon}                                                {/* Coloured emoji icon */}
      </div>
      <div
        ref={numRef}
        className="kpi-card__num"
        style={{ color }}
      >
        {value}                                               {/* Animated count-up target */}
      </div>
      <div className="kpi-card__label">{label}</div>
    </div>
  );
}

/**
 * Calculates the percentage width for a distribution band bar.
 * @param {number} bandCount   - Count in this band
 * @param {number} totalSkills - Total skills count
 * @returns {number} - Percentage 0-100
 */
function calcBandWidth(bandCount = 0, totalSkills = 1) {
  if (!totalSkills) return 0;                                 // Avoid division by zero
  return Math.round((bandCount / totalSkills) * 100);         // Percentage proportion
}