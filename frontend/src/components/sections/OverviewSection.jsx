/**
 * OverviewSection.jsx
 * ─────────────────────────────────────────────────────────
 * Dashboard Overview — Devoryn-style bento layout:
 * - Page header with availability pill
 * - Profile card: avatar glow ring + online dot + stats strip + bio + CTA
 * - KPI bento grid: animated count-up numbers
 * - Top skills glass panel with animated bars
 * ─────────────────────────────────────────────────────────
 */
import { useRef, useEffect } from 'react';
import {
  formatExperience,
  getInitials,
}                            from '../../utils/formatters';
import { CHART_COLORS }      from '../../utils/constants';
import '../../styles/components/OverviewSection.css';

/**
 * @param {object}      props
 * @param {object|null} props.profile   - Profile from /api/portfolio/profile
 * @param {object|null} props.analytics - Analytics from /api/portfolio/analytics
 */
export default function OverviewSection({ profile, analytics }) {

  /* ── Safe display values ────────────────────────────────────── */
  const fullName  = profile?.full_name             || 'Hussam Alshawi';
  const title     = profile?.title                 || 'Full Stack Developer';
  const bio       = profile?.bio                   || '';
  const avatar    = profile?.primary_avatar        || null;
  const expYears  = profile?.experience_years       || 0;
  const score     = profile?.overall_score          || 0;
  const available = profile?.is_available_for_hire  || false;

  /* ── Analytics ──────────────────────────────────────────────── */
  const counts    = analytics?.counts    || {};
  const topSkills = analytics?.top_skills || [];

  /* ── KPI card config ────────────────────────────────────────── */
  const kpis = [
    { label: 'Skills',       value: counts.skills      || 0, icon: '⚙',  color: CHART_COLORS[0] },
    { label: 'Projects',     value: counts.projects     || 0, icon: '⊡',  color: CHART_COLORS[1] },
    { label: 'Courses',      value: counts.courses      || 0, icon: '📚', color: CHART_COLORS[2] },
    { label: 'Roles',        value: counts.experience   || 0, icon: '💼', color: CHART_COLORS[3] },
    { label: 'Goals',        value: counts.goals        || 0, icon: '◈',  color: CHART_COLORS[4] },
    { label: 'Achievements', value: counts.achievements || 0, icon: '🏆', color: CHART_COLORS[5] },
  ];

  return (
    <section id="overview" className="overview-section">

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard Overview</h1>
          <p className="page-header__sub">
            {title} · Portfolio Analytics
          </p>
        </div>

        {/* Availability status pill */}
        <div
          className={`availability-pill ${available ? 'availability-pill--open' : ''}`}
          aria-label={available ? 'Available for hire' : 'Not currently available'}
        >
          <span className="availability-pill__dot" aria-hidden="true" />
          {available ? 'Available for Hire' : 'Currently Employed'}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW — Profile card left, KPI + skills right
      ══════════════════════════════════════════════ */}
      <div className="overview-row">

        {/* ── Profile Card ── */}
        <div className="profile-card">

          {/* Avatar with triple glow ring + online dot */}
          <div className="profile-card__avatar-wrap">
            <div className="profile-card__avatar">
              {avatar
                ? <img src={avatar} alt={`${fullName} profile photo`} />
                : <span aria-hidden="true">{getInitials(fullName)}</span>
              }
            </div>
            {/* Live green indicator */}
            <div
              className="profile-card__online"
              title="Online"
              aria-label="Status: online"
            />
          </div>

          {/* Name + role */}
          <div className="profile-card__info">
            <div className="profile-card__name">{fullName}</div>
            <div className="profile-card__title">{title}</div>
          </div>

          {/* Stats strip: exp / score / projects */}
          <div className="profile-card__stats" role="list">
            <div className="profile-stat" role="listitem">
              <div
                className="profile-stat__num"
                style={{ color: 'var(--accent-cyan)' }}
              >
                {formatExperience(expYears)}
              </div>
              <div className="profile-stat__label">Yrs Exp</div>
            </div>

            <div className="profile-stat__divider" aria-hidden="true" />

            <div className="profile-stat" role="listitem">
              <div
                className="profile-stat__num"
                style={{ color: 'var(--accent-blue)' }}
              >
                {Math.round(score)}
              </div>
              <div className="profile-stat__label">Score</div>
            </div>

            <div className="profile-stat__divider" aria-hidden="true" />

            <div className="profile-stat" role="listitem">
              <div
                className="profile-stat__num"
                style={{ color: 'var(--accent-green)' }}
              >
                {counts.projects || 0}
              </div>
              <div className="profile-stat__label">Projects</div>
            </div>
          </div>

          {/* Bio text — truncated to 160 chars */}
          {bio && (
            <p className="profile-card__bio">
              {bio.length > 160 ? `${bio.slice(0, 160)}…` : bio}
            </p>
          )}

          {/* CTA row */}
          <div className="profile-card__actions">
            <a
              href="#contact"
              className="btn btn--primary btn--sm profile-card__btn"
            >
              Hire Me
            </a>
            <a
              href="#projects"
              className="btn btn--ghost btn--sm profile-card__btn"
            >
              Projects →
            </a>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="overview-right">

          {/* Bento KPI grid */}
          <div className="kpi-grid" role="list">
            {kpis.map((kpi, i) => (
              <AnimatedKpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                delay={i * 80}        /* Staggered entrance */
              />
            ))}
          </div>

          {/* Top skills glass panel */}
          {topSkills.length > 0 && (
            <TopSkillsPanel
              skills={topSkills}
              chartColors={CHART_COLORS}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   AnimatedKpiCard — count-up animation on mount
───────────────────────────────────────────────────────────── */
/**
 * @param {{ label, value, icon, color, delay }} props
 */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {
  const numRef = useRef(null); /* DOM ref for number element */

  useEffect(() => {
    if (!numRef.current || value === 0) return;

    const duration = 1400; /* ms */
    const start    = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); /* Cubic ease-out */
      const current  = Math.round(eased * value);

      if (numRef.current) numRef.current.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    };

    /* Delay the start so stagger is visible */
    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      className="kpi-card"
      role="listitem"
      style={{
        '--kpi-color': color,
        animation:     `fadeUp 0.45s ease ${delay}ms both`,
      }}
      aria-label={`${label}: ${value}`}
    >
      {/* Icon */}
      <div className="kpi-card__icon" aria-hidden="true">{icon}</div>

      {/* Animated number */}
      <div
        ref={numRef}
        className="kpi-card__num"
        style={{ color }}
        aria-live="polite"
      >
        {value}
      </div>

      {/* Label */}
      <div className="kpi-card__label">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TopSkillsPanel — glass panel with animated skill bars
───────────────────────────────────────────────────────────── */
/**
 * @param {{ skills: Array, chartColors: Array }} props
 */
function TopSkillsPanel({ skills, chartColors }) {
  const listRef = useRef(null); /* Ref to trigger bar animations */

  /* Animate bars when panel scrolls into view */
  useEffect(() => {
    if (!listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const fills = entry.target.querySelectorAll('.skill-row__fill');
          fills.forEach(fill => { fill.style.transform = 'scaleX(1)'; });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [skills]);

  return (
    <div className="top-skills-panel">
      {/* Header */}
      <div className="top-skills-panel__header">
        <span className="top-skills-panel__title">Top Skills</span>
        <a href="#skills" className="btn btn--ghost btn--sm">
          View All →
        </a>
      </div>

      {/* Skill bars */}
      <div className="top-skills-panel__list" ref={listRef}>
        {skills.slice(0, 5).map((skill, i) => (
          <div key={skill.skill_name} className="skill-row">
            {/* Name */}
            <span className="skill-row__name">{skill.skill_name}</span>

            {/* Track + fill */}
            <div className="skill-row__track">
              <div
                className="skill-row__fill"
                style={{
                  width:      `${skill.score}%`,
                  background: skill.color
                    ? `linear-gradient(90deg, ${skill.color}, var(--accent-cyan))`
                    : `linear-gradient(90deg, ${chartColors[i % chartColors.length]}, var(--accent-cyan))`,
                }}
              />
            </div>

            {/* Percentage */}
            <span className="skill-row__pct">{skill.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}