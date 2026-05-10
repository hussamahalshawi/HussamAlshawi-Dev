/**
 * AnalyticsSection.jsx
 * ─────────────────────────────────────────────────────────
 * Devoryn-style analytics dashboard:
 * - Animated bento KPI grid (count-up numbers)
 * - Top skills horizontal bars (glass panel)
 * - Skill proficiency distribution bands
 * - Category score averages list
 * All data from analytics prop — no internal fetching.
 * ─────────────────────────────────────────────────────────
 */
import { useRef, useEffect } from 'react';
import {
  CHART_COLORS,
  SKILL_BANDS,
}                            from '../../utils/constants';
import { SkeletonKPI }       from '../ui/SkeletonLoader';
import Badge                 from '../ui/Badge';
import '../../styles/components/AnalyticsSection.css';

/**
 * @param {object}      props
 * @param {object|null} props.analytics - From /api/portfolio/analytics
 */
export default function AnalyticsSection({ analytics }) {

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (!analytics) {
    return (
      <section id="analytics" className="section">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Analytics</span>
            <h2 className="s-title">By the Numbers</h2>
          </div>
          <div className="analytics-kpi-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonKPI key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Data extraction ──────────────────────────────────────────── */
  const counts    = analytics.counts              || {};
  const topSkills = analytics.top_skills          || [];
  const radar     = analytics.skills_radar        || [];
  const dist      = analytics.skills_distribution || {};

  /* ── KPI config ───────────────────────────────────────────────── */
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

        {/* ── KPI bento grid ── */}
        <div className="analytics-kpi-grid" role="list">
          {kpis.map((kpi, i) => (
            <AnimatedKpiCard
              key={kpi.key}
              label={kpi.label}
              value={counts[kpi.key] || 0}
              icon={kpi.icon}
              color={kpi.color}
              delay={i * 70}
            />
          ))}
        </div>

        {/* ── Bottom two-column ── */}
        <div className="analytics-bottom">

          {/* ── Top skills bars panel ── */}
          <div className="analytics-glass-panel analytics-skills">
            {/* Panel title */}
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Top Skills
              </p>
            </div>

            {/* Skill rows — top 8 */}
            <SkillBarList
              skills={topSkills.slice(0, 8)}
              colors={CHART_COLORS}
            />
          </div>

          {/* ── Distribution + category averages panel ── */}
          <div className="analytics-glass-panel analytics-dist">
            {/* Title */}
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Proficiency Distribution
              </p>
            </div>

            {/* Band rows */}
            {Object.entries(SKILL_BANDS).map(([key, band]) => {
              const count = dist[key] || 0;
              const total = counts.skills || 1;
              const pct   = Math.round((count / total) * 100);

              return (
                <div key={key} className="dist-row">
                  {/* Band badge */}
                  <div className="dist-row__label">
                    <Badge
                      label={band.label}
                      style={{ color: band.color }}
                      variant="muted"
                    />
                  </div>

                  {/* Progress track */}
                  <div className="dist-row__track">
                    <div
                      className="dist-row__fill"
                      style={{
                        width:      `${pct}%`,
                        background: band.color,
                      }}
                    />
                  </div>

                  {/* Count */}
                  <span className="dist-row__count">{count}</span>
                </div>
              );
            })}

            {/* Divider */}
            <div className="analytics-divider" aria-hidden="true" />

            {/* Category averages */}
            {radar.length > 0 && (
              <>
                <p className="skill-group__title" style={{ marginBottom: 'var(--space-4)' }}>
                  Category Averages
                </p>
                {radar.slice(0, 5).map((cat, i) => (
                  <div key={cat.category} className="cat-avg-row">
                    <span className="cat-avg-row__name">{cat.category}</span>
                    <span
                      className="cat-avg-row__score"
                      style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {cat.avg_score}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SkillBarList — animated horizontal skill bars
───────────────────────────────────────────────────────────── */
/**
 * @param {{ skills: Array, colors: Array }} props
 */
function SkillBarList({ skills, colors }) {
  const listRef = useRef(null);

  /* Trigger fill animation on scroll-into-view */
  useEffect(() => {
    if (!listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const fills = entry.target.querySelectorAll('.analytics-skill-row__fill');
          fills.forEach(fill => {
            fill.style.width = fill.dataset.pct; /* Set to data-pct value */
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [skills]);

  return (
    <div ref={listRef}>
      {skills.map((skill, i) => {
        const gradient = skill.color
          ? `linear-gradient(90deg, ${skill.color}, var(--accent-cyan))`
          : `linear-gradient(90deg, ${colors[i % colors.length]}, var(--accent-cyan))`;

        return (
          <div key={skill.skill_name} className="analytics-skill-row">
            {/* Name */}
            <span className="analytics-skill-row__name">
              {skill.skill_name}
            </span>

            {/* Track */}
            <div className="analytics-skill-row__track">
              <div
                className="analytics-skill-row__fill"
                data-pct={`${skill.score}%`}  /* Used by IntersectionObserver */
                style={{
                  width:      '0%',           /* Starts at 0, animated to data-pct */
                  background: gradient,
                  transition: 'width 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>

            {/* Score */}
            <span className="analytics-skill-row__pct">{skill.score}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AnimatedKpiCard — count-up on mount with stagger delay
───────────────────────────────────────────────────────────── */
/**
 * @param {{ label, value, icon, color, delay }} props
 */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {
  const numRef = useRef(null);

  useEffect(() => {
    if (!numRef.current || value === 0) return;

    const duration = 1300;
    const start    = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); /* Cubic ease-out */
      const current  = Math.round(eased * value);

      if (numRef.current) numRef.current.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      className="analytics-kpi-card"
      role="listitem"
      style={{
        '--kpi-color': color,
        animation:     `fadeUp 0.45s ease ${delay}ms both`,
      }}
      aria-label={`${label}: ${value}`}
    >
      {/* Icon */}
      <div className="analytics-kpi-card__icon" aria-hidden="true">
        {icon}
      </div>

      {/* Animated number */}
      <div
        ref={numRef}
        className="analytics-kpi-card__num"
        style={{ color }}
        aria-live="polite"
      >
        {value}
      </div>

      {/* Label */}
      <div className="analytics-kpi-card__label">{label}</div>
    </div>
  );
}