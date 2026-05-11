/**
 * OverviewSection.jsx
 * ─────────────────────────────────────────────────────────
 * Devoryn-style dashboard overview — matches the screenshot:
 *
 *  ┌─────────────────────────────────────────────────────┐
 *  │  Page Header: "Dashboard Overview" + availability   │
 *  ├──────────────────────┬──────────────────────────────┤
 *  │  Profile Card (left) │  KPI Grid (3×2) + TopSkills  │
 *  ├──────────────────────┴──────────────────────────────┤
 *  │  BENTO ROW:                                         │
 *  │  [Performance─tall] [ActiveProjects] [Donut─tall]  │
 *  │  [Performance─tall] [TasksList    ] [Donut─tall]  │
 *  │  [Team Activity ── full width ──────────────────]  │
 *  └─────────────────────────────────────────────────────┘
 *
 * Data flow:
 *   - profile   → profile card avatar / name / stats
 *   - analytics → KPI counts / top skills / counts for donut
 *   - All child panels receive props — no internal fetching
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useCallback } from 'react'; // React hooks
import { formatExperience, getInitials }             from '../../utils/formatters'; // Pure helpers
import { CHART_COLORS, ANIMATION }                   from '../../utils/constants';  // Global tokens
import '../../styles/components/OverviewSection.css';                               // Section styles

/* ── Bar chart data — 7 month-groups of 2 bars (cyan + orange) ── */
const BAR_DATA = [
  { a: 65, b: 45 },
  { a: 80, b: 55 },
  { a: 50, b: 70 },
  { a: 90, b: 40 },
  { a: 60, b: 85 },
  { a: 75, b: 50 },
  { a: 55, b: 65 },
];

/* ── Maximum bar height in px for the chart ──────────────────── */
const BAR_MAX_PX = 48;

/* ── Static activity feed entries (replace with API later) ───── */
const ACTIVITIES = [
  { id: 1, initials: 'HA', text: 'Updated portfolio backend API endpoints',         time: '2m ago',  color: 'var(--cyan)'   },
  { id: 2, initials: 'HA', text: 'Pushed new SkillsSection glassmorphism update',   time: '18m ago', color: 'var(--green)'  },
  { id: 3, initials: 'HA', text: 'Deployed frontend build to production server',    time: '1h ago',  color: 'var(--orange)' },
  { id: 4, initials: 'HA', text: 'Completed MongoDB Atlas schema migration',        time: '3h ago',  color: 'var(--gold)'   },
  { id: 5, initials: 'HA', text: 'Resolved CORS configuration on Flask backend',   time: '5h ago',  color: 'var(--violet)' },
];

/* ── Color palette for task avatars ──────────────────────────── */
const AVATAR_COLORS = [
  CHART_COLORS[0], // cyan
  CHART_COLORS[1], // blue
  CHART_COLORS[2], // violet
  CHART_COLORS[3], // gold
  CHART_COLORS[4], // coral
];

/* ── Donut segment definitions for Tasks Status ─────────────── */
const DONUT_SEGMENTS = [
  { label: 'In Progress', key: 'in_progress', color: '#4FC3F7', defaultPct: 45 }, // cyan
  { label: 'Done',        key: 'done',        color: '#4ECCA3', defaultPct: 30 }, // green
  { label: 'Backlog',     key: 'backlog',      color: '#F5A623', defaultPct: 25 }, // orange
];

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
/**
 * OverviewSection — assembles the full Devoryn overview dashboard.
 * @param {object}      props
 * @param {object|null} props.profile   - Profile data from API
 * @param {object|null} props.analytics - Analytics data from API
 */
export default function OverviewSection({ profile, analytics }) {

  /* ── Safe display values with fallbacks ──────────────────────── */
  const fullName  = profile?.full_name             || 'Hussam Alshawi';
  const firstName = fullName.split(' ')[0];                   // "Hussam" for greeting
  const title     = profile?.title                 || 'Full Stack Developer';
  const bio       = profile?.bio                   || '';
  const avatar    = profile?.primary_avatar        || null;   // Cloudinary URL or null
  const expYears  = profile?.experience_years       || 0;     // Numeric years
  const score     = profile?.overall_score          || 0;     // 0-100
  const available = profile?.is_available_for_hire  || false; // Boolean

  /* ── Analytics derived values ─────────────────────────────────── */
  const counts    = analytics?.counts    || {};                // { skills, projects, ... }
  const topSkills = analytics?.top_skills || [];               // [{ skill_name, score, color }]

  /* ── KPI card config — icon + label + count key + color ─────── */
  const kpis = [
    { label: 'Skills',       key: 'skills',       icon: '⚙',  color: CHART_COLORS[0] },
    { label: 'Projects',     key: 'projects',     icon: '⊡',  color: CHART_COLORS[1] },
    { label: 'Courses',      key: 'courses',      icon: '📚', color: CHART_COLORS[2] },
    { label: 'Roles',        key: 'experience',   icon: '💼', color: CHART_COLORS[3] },
    { label: 'Goals',        key: 'goals',        icon: '◈',  color: CHART_COLORS[4] },
    { label: 'Achievements', key: 'achievements', icon: '🏆', color: CHART_COLORS[5] },
  ];

  /* ── Build active projects from analytics counts (demo data) ── */
  const activeProjects = [
    { name: 'Portfolio Site',  pct: Math.min(92, 100), color: CHART_COLORS[0] },
    { name: 'API Backend',     pct: Math.min(78, 100), color: CHART_COLORS[2] },
    { name: 'Mobile Dashboard',pct: Math.min(54, 100), color: CHART_COLORS[3] },
  ];

  /* ── Build task rows from goals counts ───────────────────────── */
  const taskRows = topSkills.slice(0, 4).map((skill, i) => ({
    id:      i,
    name:    skill.skill_name,
    pct:     skill.score,
    initial: skill.skill_name.charAt(0).toUpperCase(),
    color:   AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  return (
    <section id="overview" className="overview-section" aria-label="Dashboard Overview">

      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
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
          role="status"
          aria-label={available ? 'Available for hire' : 'Currently employed'}
        >
          <span className="availability-pill__dot" aria-hidden="true" />
          {available ? 'Available for Hire' : 'Currently Employed'}
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW — Profile card (left) + KPIs + skills (right)
      ══════════════════════════════════════ */}
      <div className="overview-row">

        {/* ── PROFILE CARD ─────────────────────────────────────── */}
        <ProfileCard
          fullName={fullName}
          title={title}
          bio={bio}
          avatar={avatar}
          expYears={expYears}
          score={score}
          available={available}
          projectCount={counts.projects || 0}
        />

        {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
        <div className="overview-right">

          {/* KPI bento grid */}
          <div className="kpi-grid" role="list" aria-label="Portfolio statistics">
            {kpis.map((kpi, i) => (
              <AnimatedKpiCard
                key={kpi.key}
                label={kpi.label}
                value={counts[kpi.key] || 0}
                icon={kpi.icon}
                color={kpi.color}
                delay={i * 80}                               /* Staggered entrance */
              />
            ))}
          </div>

          {/* Top skills glass panel */}
          {topSkills.length > 0 && (
            <TopSkillsPanel skills={topSkills} />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          BENTO GRID — Performance / Projects / Donut / Tasks / Activity
      ══════════════════════════════════════ */}
      <div className="ov-bento" aria-label="Dashboard widgets">

        {/* ── 1. PERFORMANCE METRICS — col 1, spans rows 1-2 ─── */}
        <PerformancePanel
          expYears={expYears}
          score={score}
          projectCount={counts.projects || 0}
        />

        {/* ── 2. ACTIVE PROJECTS — col 2, row 1 ───────────────── */}
        <ActiveProjectsPanel projects={activeProjects} />

        {/* ── 3. TASKS STATUS DONUT — col 3, spans rows 1-2 ───── */}
        <TasksDonutPanel analytics={analytics} />

        {/* ── 4. TASKS LIST — col 2, row 2 ─────────────────────── */}
        <TasksListPanel tasks={taskRows} />

        {/* ── 5. TEAM ACTIVITY — full width, row 3 ─────────────── */}
        <TeamActivityPanel />

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: ProfileCard
════════════════════════════════════════════════════════════════ */
/**
 * ProfileCard — left panel with avatar glow ring, stats strip, bio, CTAs.
 * @param {object} props
 */
function ProfileCard({ fullName, title, bio, avatar, expYears, score, available, projectCount }) {

  const initials = getInitials(fullName); // "HA"

  return (
    <div className="profile-card" role="complementary" aria-label="Profile summary">

      {/* ── Avatar with triple ring glow ── */}
      <div className="profile-card__avatar-wrap">
        <div className="profile-card__avatar" aria-hidden="true">
          {avatar
            ? <img src={avatar} alt={`${fullName} profile photo`} />
            : <span>{initials}</span>
          }
        </div>
        {/* Pulsing online indicator */}
        <div
          className="profile-card__online"
          title="Online"
          aria-label="Status: online"
        />
      </div>

      {/* ── Name + role ── */}
      <div className="profile-card__info">
        <div className="profile-card__name">{fullName}</div>
        <div className="profile-card__title">{title}</div>
      </div>

      {/* ── Stats strip: exp / score / projects ── */}
      <div className="profile-card__stats" role="list" aria-label="Key stats">

        <div className="profile-stat" role="listitem">
          <div className="profile-stat__num" style={{ color: 'var(--cyan)' }}>
            {formatExperience(expYears)}
          </div>
          <div className="profile-stat__label">Yrs Exp</div>
        </div>

        <div className="profile-stat__divider" aria-hidden="true" />

        <div className="profile-stat" role="listitem">
          <div className="profile-stat__num" style={{ color: 'var(--blue)' }}>
            {Math.round(score)}
          </div>
          <div className="profile-stat__label">Score</div>
        </div>

        <div className="profile-stat__divider" aria-hidden="true" />

        <div className="profile-stat" role="listitem">
          <div className="profile-stat__num" style={{ color: 'var(--green)' }}>
            {projectCount}
          </div>
          <div className="profile-stat__label">Projects</div>
        </div>
      </div>

      {/* ── Bio text — max 160 chars ── */}
      {bio && (
        <p className="profile-card__bio">
          {bio.length > 160 ? `${bio.slice(0, 160)}…` : bio}
        </p>
      )}

      {/* ── CTA buttons ── */}
      <div className="profile-card__actions">
        <a href="#contact" className="btn btn--primary btn--sm profile-card__btn">
          Hire Me
        </a>
        <a href="#projects" className="btn btn--ghost btn--sm profile-card__btn">
          Projects →
        </a>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: AnimatedKpiCard
   Count-up animation from 0 → value on mount with stagger delay
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ label, value, icon, color, delay }} props
 */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {

  const numRef = useRef(null); // DOM ref to update text content directly (perf)

  useEffect(() => {
    if (!numRef.current || value === 0) return; // Skip if no element or zero value

    const duration = ANIMATION.COUNTER_DURATION;             // 1800ms from constants
    const start    = performance.now();                      // High-res timestamp

    /** Recursive RAF tick — updates number every frame */
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1); // 0 → 1
      const eased    = 1 - Math.pow(1 - progress, 3);         // Cubic ease-out
      const current  = Math.round(eased * value);             // Interpolated value

      if (numRef.current) numRef.current.textContent = current; // Direct DOM update
      if (progress < 1)   requestAnimationFrame(tick);          // Continue until done
    };

    /* Delay start to create stagger effect between cards */
    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);                          // Cleanup on unmount
  }, [value, delay]);

  return (
    <div
      className="kpi-card"
      role="listitem"
      style={{
        '--kpi-color': color,                                  // CSS custom prop for glow
        animation:     `fadeUp 0.45s ease ${delay}ms both`,   // Staggered entrance
      }}
      aria-label={`${label}: ${value}`}
    >
      {/* Icon */}
      <div className="kpi-card__icon" aria-hidden="true">{icon}</div>

      {/* Animated count-up number */}
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

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: TopSkillsPanel
   Glass panel with animated horizontal skill bars
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ skills: Array }} props
 */
function TopSkillsPanel({ skills }) {

  const listRef = useRef(null); // Ref to trigger bar animations via IntersectionObserver

  /* Animate bars when panel scrolls into view */
  useEffect(() => {
    if (!listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          /* Set scaleX(1) on all fill bars to trigger CSS transition */
          entry.target
            .querySelectorAll('.skill-row__fill')
            .forEach(fill => { fill.style.transform = 'scaleX(1)'; });
          observer.unobserve(entry.target);                   // Animate once only
        });
      },
      { threshold: 0.3 }                                      // 30% visible trigger
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [skills]);

  return (
    <div className="top-skills-panel" aria-label="Top skills">

      {/* Header row */}
      <div className="top-skills-panel__header">
        <span className="top-skills-panel__title">Top Skills</span>
        <a href="#skills" className="btn btn--ghost btn--sm">View All →</a>
      </div>

      {/* Skill bar rows — top 5 */}
      <div className="top-skills-panel__list" ref={listRef}>
        {skills.slice(0, 5).map((skill, i) => (
          <div key={skill.skill_name} className="skill-row">

            {/* Skill name */}
            <span className="skill-row__name">{skill.skill_name}</span>

            {/* Progress track + animated fill */}
            <div className="skill-row__track">
              <div
                className="skill-row__fill"
                style={{
                  width:      `${skill.score}%`,
                  background: skill.color
                    ? `linear-gradient(90deg, ${skill.color}, var(--cyan))`
                    : `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, var(--cyan))`,
                }}
              />
            </div>

            {/* Score percentage */}
            <span className="skill-row__pct">{skill.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BENTO PANEL 1: PerformancePanel
   SVG line chart + animated bar chart + 3 KPI numbers
   Matches "Performance Metrics" in screenshot (left tall panel)
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ expYears, score, projectCount }} props
 */
function PerformancePanel({ expYears, score, projectCount }) {

  const barsRef = useRef(null); // Ref for bar height animation

  /* Animate bar heights upward after mount */
  useEffect(() => {
    if (!barsRef.current) return;

    const bars = barsRef.current.querySelectorAll('.ov-bar'); // Get all bar elements

    bars.forEach((bar, i) => {
      const targetH = bar.dataset.height;                     // Read from data attribute
      bar.style.height = '0px';                               // Start collapsed

      /* Stagger each bar's growth by 80ms */
      setTimeout(() => {
        bar.style.transition = 'height 0.9s cubic-bezier(0.16,1,0.3,1)';
        bar.style.height     = targetH;                       // Animate to target height
      }, 450 + i * 80);
    });
  }, []);

  return (
    <div className="ov-panel ov-panel--perf" aria-label="Performance metrics">

      {/* Water drop decorations */}
      <div className="ov-drops" aria-hidden="true">
        <div className="ov-drop ov-drop--a" />
        <div className="ov-drop ov-drop--b" />
        <div className="ov-drop ov-drop--c" />
        <div className="ov-drop ov-drop--d" />
      </div>

      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Performance Metrics</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* ── SVG Line Chart ── */}
      <div className="ov-chart-area" role="img" aria-label="Performance trend line">
        <svg
          className="ov-chart-svg"
          viewBox="0 0 400 110"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient fill under the trend line */}
            <linearGradient id="ovGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--cyan)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0"    />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            className="ov-chart-fill"
            d="M0,88 C30,82 55,68 80,63
               C105,58 130,48 160,36
               C190,24 215,28 240,23
               C265,18 290,33 320,26
               C350,20 375,15 400,10
               L400,110 L0,110 Z"
          />

          {/* Animated trend line — draws via stroke-dashoffset */}
          <path
            className="ov-chart-line"
            d="M0,88 C30,82 55,68 80,63
               C105,58 130,48 160,36
               C190,24 215,28 240,23
               C265,18 290,33 320,26
               C350,20 375,15 400,10"
          />
        </svg>
      </div>

      {/* ── Bar Chart — 7 groups of cyan + orange ── */}
      <div
        className="ov-bars"
        ref={barsRef}
        role="img"
        aria-label="Monthly performance bars"
      >
        {BAR_DATA.map((group, i) => (
          <div key={i} className="ov-bar-group">
            {/* Cyan bar */}
            <div
              className="ov-bar ov-bar--cyan"
              data-height={`${Math.round((group.a / 100) * BAR_MAX_PX)}px`}
              style={{ height: '0px' }}
              aria-hidden="true"
            />
            {/* Orange bar */}
            <div
              className="ov-bar ov-bar--orange"
              data-height={`${Math.round((group.b / 100) * BAR_MAX_PX)}px`}
              style={{ height: '0px' }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {/* ── KPI Numbers row ── */}
      <div className="ov-kpis" role="list">

        {/* Experience years */}
        <div className="ov-kpi" role="listitem">
          <div className="ov-kpi__num" style={{ color: 'var(--cyan)' }}>
            {expYears > 0 ? `${expYears}+` : '—'}
          </div>
          <div className="ov-kpi__label">Yrs Exp</div>
        </div>

        <div className="ov-kpi__sep" aria-hidden="true" />

        {/* Overall score */}
        <div className="ov-kpi" role="listitem">
          <div className="ov-kpi__num" style={{ color: 'var(--blue)' }}>
            {score > 0 ? `${Math.round(score)}%` : '—'}
          </div>
          <div className="ov-kpi__label">Score</div>
        </div>

        <div className="ov-kpi__sep" aria-hidden="true" />

        {/* Total projects */}
        <div className="ov-kpi" role="listitem">
          <div className="ov-kpi__num" style={{ color: 'var(--green)' }}>
            {projectCount}
          </div>
          <div className="ov-kpi__label">Projects</div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BENTO PANEL 2: ActiveProjectsPanel
   Horizontal progress bars for top 3 active projects
   Matches "Active Projects" in screenshot (center top)
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ projects: Array }} props
 */
function ActiveProjectsPanel({ projects }) {

  const listRef = useRef(null); // Ref for IntersectionObserver trigger

  /* Animate bar widths when panel enters viewport */
  useEffect(() => {
    if (!listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          /* Set each fill bar's width from its data attribute */
          entry.target
            .querySelectorAll('.ov-proj-row__fill')
            .forEach(fill => {
              fill.style.width = fill.dataset.pct;            // Trigger CSS transition
            });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [projects]);

  return (
    <div className="ov-panel ov-panel--projects" aria-label="Active projects">

      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Active Projects</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* Project bar rows */}
      <div ref={listRef}>
        {projects.map((project, i) => (
          <div key={i} className="ov-proj-row">

            {/* Project name */}
            <span className="ov-proj-row__name">{project.name}</span>

            {/* Animated progress track */}
            <div className="ov-proj-row__track">
              <div
                className="ov-proj-row__fill"
                data-pct={`${project.pct}%`}                 /* Used by IntersectionObserver */
                style={{
                  width:      '0%',                          /* Starts at 0, animated to data-pct */
                  background: project.color,
                  transition: 'width 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>

            {/* Percentage label */}
            <span className="ov-proj-row__pct">{project.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BENTO PANEL 3: TasksDonutPanel
   SVG donut chart with legend rows
   Matches "Tasks Status" donut in screenshot (right tall panel)
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ analytics: object|null }} props
 */
function TasksDonutPanel({ analytics }) {

  /* Extract goals-by-status from analytics or use defaults */
  const goalsByStatus = analytics?.goals_by_status || null;

  /* Build segment data with real or default percentages */
  const segments = DONUT_SEGMENTS.map(seg => ({
    ...seg,
    pct: goalsByStatus?.[seg.key] ?? seg.defaultPct,          // Real data or fallback
  }));

  /* Total for normalizing */
  const total = segments.reduce((sum, s) => sum + s.pct, 0) || 100;

  /* SVG donut math */
  const RADIUS      = 54;                                      // px — donut ring radius
  const CIRCUMF     = 2 * Math.PI * RADIUS;                   // Full circle circumference

  let cumulativePct = 0; // Running total for segment offset calculation

  return (
    <div className="ov-panel ov-panel--donut" aria-label="Tasks status distribution">

      {/* Water drop decorations */}
      <div className="ov-drops" aria-hidden="true">
        <div className="ov-drop ov-drop--a" />
        <div className="ov-drop ov-drop--c" />
      </div>

      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Tasks Status</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* ── SVG Donut ── */}
      <div className="ov-donut-wrap" aria-hidden="true">
        <svg
          className="ov-donut-svg"
          viewBox="0 0 120 120"
        >
          {/* Track ring — full circle in background */}
          <circle
            className="ov-donut-track"
            cx="60" cy="60"
            r={RADIUS}
          />

          {/* Colored segments */}
          {segments.map((seg, i) => {
            const segPct    = (seg.pct / total);               // Fraction of circle
            const dashArr   = segPct * CIRCUMF;                // Filled length
            const dashOff   = CIRCUMF - (cumulativePct / total) * CIRCUMF; // Start offset
            const offset    = cumulativePct;                   // Track running total

            cumulativePct += seg.pct;                          // Advance for next segment

            return (
              <circle
                key={seg.key}
                className="ov-donut-ring"
                cx="60" cy="60"
                r={RADIUS}
                stroke={seg.color}
                strokeDasharray={`${dashArr} ${CIRCUMF}`}
                strokeDashoffset={dashOff}
                style={{
                  /* Animate segment draw-in with stagger */
                  transition: `stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.2}s`,
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="ov-donut-center" aria-label={`${total} total tasks`}>
          <div className="ov-donut-center__num">{total}</div>
          <div className="ov-donut-center__sub">Total</div>
        </div>
      </div>

      {/* ── Legend rows — In Progress / Done / Backlog ── */}
      <div className="ov-donut-legend" role="list">
        {segments.map(seg => (
          <div key={seg.key} className="ov-legend-row" role="listitem">
            {/* Color dot */}
            <div
              className="ov-legend-dot"
              style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }}
              aria-hidden="true"
            />
            {/* Label */}
            <span className="ov-legend-label">{seg.label}</span>
            {/* Percentage */}
            <span className="ov-legend-pct" style={{ color: seg.color }}>
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BENTO PANEL 4: TasksListPanel
   Avatar + name + percentage + status dot rows
   Matches "Tasks Status" list in screenshot (center bottom)
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ tasks: Array }} props
 */
function TasksListPanel({ tasks }) {

  /* Fallback demo tasks if no real data */
  const displayTasks = tasks.length > 0 ? tasks : [
    { id: 1, name: 'Portfolio Site',   pct: 92, initial: 'P', color: CHART_COLORS[0] },
    { id: 2, name: 'API Integration',  pct: 78, initial: 'A', color: CHART_COLORS[1] },
    { id: 3, name: 'Mobile UI',        pct: 45, initial: 'M', color: CHART_COLORS[2] },
    { id: 4, name: 'Testing Suite',    pct: 30, initial: 'T', color: CHART_COLORS[3] },
  ];

  return (
    <div className="ov-panel ov-panel--tasks" aria-label="Tasks list">

      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Tasks Status</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* Task rows */}
      <div role="list">
        {displayTasks.map(task => {
          /* Status dot color: green ≥ 60, orange ≥ 30, red < 30 */
          const dotColor = task.pct >= 60
            ? 'var(--green)'
            : task.pct >= 30
              ? 'var(--orange)'
              : 'var(--red)';

          return (
            <div key={task.id} className="ov-task-row" role="listitem">

              {/* Avatar circle with initial */}
              <div
                className="ov-task-avatar"
                style={{ background: task.color }}
                aria-hidden="true"
              >
                {task.initial}
              </div>

              {/* Task name */}
              <span className="ov-task-name" title={task.name}>
                {task.name}
              </span>

              {/* Progress percentage */}
              <span className="ov-task-pct">{task.pct}%</span>

              {/* Status dot */}
              <div
                className="ov-task-dot"
                style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
                aria-label={`Progress: ${task.pct}%`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BENTO PANEL 5: TeamActivityPanel
   Full-width slider with prev/next + dot indicators
   Auto-advances every 5 seconds — matches screenshot bottom bar
════════════════════════════════════════════════════════════════ */
function TeamActivityPanel() {

  const [current,     setCurrent]     = useState(0);       // Active slide index
  const [isAnimating, setIsAnimating] = useState(false);   // Lock during transition

  /* Navigate to a specific slide index */
  const goTo = useCallback((index) => {
    if (isAnimating) return;                                 // Block rapid clicks
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 380);           // Unlock after animation
  }, [isAnimating]);

  /* Advance to next slide (wraps around) */
  const goNext = useCallback(() => {
    goTo((current + 1) % ACTIVITIES.length);
  }, [current, goTo]);

  /* Go to previous slide */
  const goPrev = useCallback(() => {
    goTo((current - 1 + ACTIVITIES.length) % ACTIVITIES.length);
  }, [current, goTo]);

  /* Auto-advance every 5 seconds */
  useEffect(() => {
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);                       // Cleanup on unmount
  }, [goNext]);

  const active = ACTIVITIES[current];                        // Current slide data

  return (
    <div className="ov-panel ov-panel--activity" aria-label="Team activity feed">

      {/* ── Panel header with slider controls ── */}
      <div className="ov-activity-header">
        <span className="ov-activity-title">Team Activity</span>

        {/* Navigation controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}
          role="group" aria-label="Slide navigation"
        >
          {/* Previous button */}
          <button
            className="ov-slider-btn"
            onClick={goPrev}
            aria-label="Previous activity"
            disabled={isAnimating}
          >
            ‹
          </button>

          {/* Dot indicators */}
          <div className="ov-slider-dots" role="tablist">
            {ACTIVITIES.map((_, i) => (
              <button
                key={i}
                className={`ov-slider-dot ${i === current ? 'ov-slider-dot--active' : ''}`}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={`Activity ${i + 1}`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            className="ov-slider-btn"
            onClick={goNext}
            aria-label="Next activity"
            disabled={isAnimating}
          >
            ›
          </button>
        </div>

        {/* Three-dot menu */}
        <button className="ov-panel__menu" aria-label="Activity options">···</button>
      </div>

      {/* ── Slide content — key forces re-mount = re-animation ── */}
      <div
        className="ov-activity-content"
        key={current}
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Avatar square with gradient */}
        <div
          className="ov-activity-avatar"
          style={{
            background: `linear-gradient(135deg, ${active.color}, var(--blue))`,
          }}
          aria-hidden="true"
        >
          {active.initials}
        </div>

        {/* Activity description */}
        <p className="ov-activity-text">{active.text}</p>

        {/* Timestamp */}
        <span className="ov-activity-time">{active.time}</span>
      </div>
    </div>
  );
}