/**
 * AnalyticsSection.jsx
 * ─────────────────────────────────────────────────────────
 * Devoryn-style analytics dashboard section.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  Section Header: "By the Numbers"                │
 *   ├──────────────────────────────────────────────────┤
 *   │  KPI Bento Grid (8 animated count-up cards)      │
 *   ├────────────────────────┬─────────────────────────┤
 *   │  Top Skills (bars)     │  Distribution Bands     │
 *   │                        │  ─────────────────────  │
 *   │                        │  Category Averages      │
 *   └────────────────────────┴─────────────────────────┘
 *
 * Props:
 *   analytics — from /api/portfolio/analytics
 *     .counts              — entity counts object
 *     .top_skills          — [{ skill_name, score, color }]
 *     .skills_radar        — [{ category, avg_score }]
 *     .skills_distribution — { expert, advanced, intermediate, beginner }
 *
 * All animations are triggered by IntersectionObserver (scroll-based).
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { CHART_COLORS, SKILL_BANDS, ANIMATION, ANALYTICS_TABS, KPI_CONFIG }       from '../../utils/constants'; // Global tokens + centralized config
import { SkeletonKPI }                                                from '../ui/SkeletonLoader'; // Loading skeleton
import Badge                                                          from '../ui/Badge';         // Badge component
import AllChartsDashboard                                             from './AllChartsDashboard';
import chartsService                                                  from '../../services/chartsService';
import '../../styles/components/AnalyticsSection.css';

/* ── Lazy-loaded chart components (deferred until tab is active) ── */
const SankeyChart         = lazy(() => import('../charts/SankeyChart'));
const RadarSkillsChart    = lazy(() => import('../charts/RadarSkillsChart'));
const MultiRadarChart     = lazy(() => import('../charts/MultiRadarChart'));
const TimelineAreaChart   = lazy(() => import('../charts/TimelineAreaChart'));
const GoalsBulletChart    = lazy(() => import('../charts/GoalsBulletChart'));
const SourceTreemapChart  = lazy(() => import('../charts/SourceTreemapChart'));

/* ── Lazy-loaded tab content components ───────────────────────── */
const CareerTab   = lazy(() => import('./tabs/CareerTab'));
const SkillsTab   = lazy(() => import('./tabs/SkillsTab'));
const LearningTab = lazy(() => import('./tabs/LearningTab'));
const GoalsTab    = lazy(() => import('./tabs/GoalsTab'));

/* ── Suspense fallback for lazy tabs ──────────────────────────── */
function TabFallback() {
  return (
    <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading...</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: AnalyticsSection
════════════════════════════════════════════════════════════════ */
/**
 * AnalyticsSection — Renders the full analytics dashboard section.
 *
 * @param {object}      props
 * @param {object|null} props.analytics - Analytics data from API
 *
 * @returns {JSX.Element}
 */
export default function AnalyticsSection({ analytics, portfolio }) {

  /* ── Chart composite data (shared with AllChartsDashboard) ── */
  const [chartData, setChartData] = useState({
    careerData: null,
    goalsData: null,
    skillsData: null,
    learningData: null,
    domainCoverage: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      chartsService.composite.allCareerCharts(),
      chartsService.composite.allGoalsCharts(),
      chartsService.composite.allSkillsCharts(),
      chartsService.composite.allLearningCharts(),
      chartsService.skills.domainCoverage(),
    ]).then(([career, goals, skills, learning, dc]) => {
      if (cancelled) return;
      setChartData({
        careerData:   career.status === 'fulfilled'   ? career.value   : null,
        goalsData:    goals.status === 'fulfilled'    ? goals.value    : null,
        skillsData:   skills.status === 'fulfilled'   ? skills.value   : null,
        learningData: learning.status === 'fulfilled' ? learning.value : null,
        domainCoverage: dc.status === 'fulfilled'     ? dc.data        : null,
      });
    });
    return () => { cancelled = true; };
  }, []);

  /* ── Hash-based tab routing ─────────────────────────────────── */
  const getTabFromHash = useCallback(() => {
    const hash = window.location.hash.replace('#analytics/', '').replace('#analytics', '');
    const valid = ANALYTICS_TABS.find(t => t.id === hash);
    return valid ? hash : 'overview';
  }, []);

  const [activeTab, setActiveTab] = useState(getTabFromHash);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    const hash = tabId === 'overview' ? '#analytics' : `#analytics/${tabId}`;
    window.history.replaceState(null, '', hash);
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [getTabFromHash]);

  /* ── Loading skeleton — mirrors the real layout ─────────────── */
  if (!analytics) {
    return (
      <section id="analytics" className="section section--alt">
        <div className="container">

          {/* Section header skeleton */}
          <div className="s-head">
            <span className="s-tag">Analytics</span>
            <h2 className="s-title">By the Numbers</h2>
          </div>

          {/* KPI grid skeleton — 8 cards */}
          <div className="analytics-kpi-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonKPI key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Safe data extraction with fallbacks ────────────────────── */
  const counts    = analytics.counts              || {}; // Entity counts object
  const topSkills = analytics.top_skills          || []; // Top skills array
  const radar     = analytics.skills_radar        || []; // Category radar data
  const dist      = analytics.skills_distribution || {}; // Distribution bands

  return (
    <section
      id="analytics"
      className="section section--alt"
      aria-label="Analytics dashboard"
    >
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Analytics</span>
          <h2 className="s-title">By the Numbers</h2>
          <p className="s-sub">
            A data-driven snapshot of the entire portfolio
          </p>
        </div>

        {/* ── Tab navigation ── */}
        <div className="analytics-tabs" role="tablist" aria-label="Analytics sections">
          {ANALYTICS_TABS.map(tab => (
            <button
              key={tab.id}
              className={`analytics-tab ${activeTab === tab.id ? 'analytics-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`analytics-panel-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB: Overview
        ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* ── KPI bento grid — 8 animated count-up cards ── */}
            <div
              className="analytics-kpi-grid"
              role="list"
              aria-label="Portfolio statistics"
            >
              {KPI_CONFIG.map((kpi, i) => (
                <AnimatedKpiCard
                  key={kpi.key}
                  label={kpi.label}
                  value={counts[kpi.key] || 0}
                  icon={kpi.icon}
                  color={CHART_COLORS[i % CHART_COLORS.length]}
                  delay={i * 70}
                />
              ))}
            </div>

            {/* ── Bottom two-column: skills + distribution ── */}
            <div className="analytics-bottom">

              {/* ── LEFT: Top skills bars panel ── */}
              <div className="analytics-glass-panel analytics-skills">

                {/* Panel title */}
                <div className="analytics-panel__header">
                  <p className="skill-group__title" style={{ margin: 0 }}>
                    Top Skills
                  </p>
                </div>

                {/* Skill bar rows — top 8 */}
                <SkillBarList
                  skills={topSkills.slice(0, 8)}
                  colors={CHART_COLORS}
                />

                {/* Empty state */}
                {topSkills.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No skills data available.
                  </p>
                )}
              </div>

              {/* ── RIGHT: Distribution + category averages panel ── */}
              <div className="analytics-glass-panel analytics-dist">

                {/* Panel title */}
                <div className="analytics-panel__header">
                  <p className="skill-group__title" style={{ margin: 0 }}>
                    Proficiency Distribution
                  </p>
                </div>

                {/* Band rows — loop over SKILL_BANDS constant */}
                {Object.entries(SKILL_BANDS).map(([key, band]) => {
                  const count = dist[key]     || 0;          // Skills in this band
                  const total = counts.skills || 1;          // Avoid division by zero
                  const pct   = Math.round((count / total) * 100); // Percentage

                  return (
                    <div key={key} className="dist-row">

                      {/* Band badge label */}
                      <div className="dist-row__label">
                        <Badge
                          label={band.label}
                          style={{ color: band.color }}
                          variant="muted"
                        />
                      </div>

                      {/* Animated progress track */}
                      <div className="dist-row__track">
                        <div
                          className="dist-row__fill"
                          style={{
                            width:      `${pct}%`,           /* Width = percentage */
                            background: band.color,          /* Band color */
                          }}
                        />
                      </div>

                      {/* Count number */}
                      <span className="dist-row__count">{count}</span>
                    </div>
                  );
                })}

                {/* Divider between distribution and category averages */}
                <div className="analytics-divider" aria-hidden="true" />

                {/* Category averages list — top 5 */}
                {radar.length > 0 && (
                  <>
                    <p className="skill-group__title" style={{ marginBottom: 'var(--s4)' }}>
                      Category Averages
                    </p>

                    {radar.slice(0, 5).map((cat, i) => (
                      <div key={cat.category} className="cat-avg-row">
                        {/* Category name */}
                        <span className="cat-avg-row__name">
                          {cat.category}
                        </span>

                        {/* Average score — colored by chart palette */}
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

            {/* ── PORTFOLIO DASHBOARD ── */}
            {portfolio ? (
              <div className="portfolio-dashboard">

                {/* ROW 1: Sankey — Learning → Skills → Goals */}
                <div className="analytics-glass-panel portfolio-sankey-panel">
                  <div className="analytics-panel__header">
                    <p className="skill-group__title" style={{ margin: 0 }}>
                      Learning Flow
                    </p>
                    <span className="portfolio-sankey-sub">
                      Sources → Skills → Goals
                    </span>
                  </div>
                  <Suspense fallback={<p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--s4)' }}>Loading...</p>}>
                    <SankeyChart
                      skillsWithSources={portfolio.skills_with_sources}
                      goals={portfolio.goals}
                    />
                  </Suspense>
                </div>

                {/* ROW 2: Domain Coverage — Multi-series Radar */}
                <div className="analytics-glass-panel portfolio-chart-panel">
                  <Suspense fallback={<p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--s4)' }}>Loading...</p>}>
                    <MultiRadarChart data={chartData.domainCoverage} />
                  </Suspense>
                </div>

                {/* ROW 3: Radar + Treemap (2-col) */}
                <div className="portfolio-row-2col">
                  <div className="analytics-glass-panel portfolio-chart-panel">
                    <div className="analytics-panel__header">
                      <p className="skill-group__title" style={{ margin: 0 }}>
                        Skills Radar
                      </p>
                      <span className="portfolio-chart-sub">
                        {portfolio.skills_by_type?.length || 0} categories
                      </span>
                    </div>
                    <Suspense fallback={<p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--s4)' }}>Loading...</p>}>
                      <RadarSkillsChart skillsByType={portfolio.skills_by_type} />
                    </Suspense>
                  </div>
                  <div className="analytics-glass-panel portfolio-chart-panel">
                    <div className="analytics-panel__header">
                      <p className="skill-group__title" style={{ margin: 0 }}>
                        Source Weight
                      </p>
                      <span className="portfolio-chart-sub">
                        Skills by learning source
                      </span>
                    </div>
                    <Suspense fallback={<p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--s4)' }}>Loading...</p>}>
                      <SourceTreemapChart sourceContribution={portfolio.learning_overview?.source_contribution} />
                    </Suspense>
                  </div>
                </div>

                {/* ROW 4: Learning Timeline — Stacked Area */}
                <div className="analytics-glass-panel portfolio-chart-panel">
                  <div className="analytics-panel__header">
                    <p className="skill-group__title" style={{ margin: 0 }}>
                      Learning Timeline
                    </p>
                    <span className="portfolio-chart-sub">
                      Skills acquired per year by source
                    </span>
                  </div>
                  <Suspense fallback={<p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--s4)' }}>Loading...</p>}>
                    <TimelineAreaChart timeline={portfolio.learning_timeline} />
                  </Suspense>
                </div>

                {/* ROW 5: Goals — Bullet Chart */}
                <div className="analytics-glass-panel portfolio-chart-panel">
                  <div className="analytics-panel__header">
                    <p className="skill-group__title" style={{ margin: 0 }}>
                      Goals Progress
                    </p>
                    <span className="portfolio-chart-sub">
                      Current vs Target
                    </span>
                  </div>
                  <Suspense fallback={<p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--s4)' }}>Loading...</p>}>
                    <GoalsBulletChart goals={portfolio.goals} />
                  </Suspense>
                </div>

              </div>
            ) : (
              <div className="portfolio-dashboard">
                <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Loading portfolio data...
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Career Journey (lazy-loaded)
        ══════════════════════════════════════════════ */}
        {activeTab === 'career' && (
          <Suspense fallback={<TabFallback />}>
            <CareerTab />
          </Suspense>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Skills Deep Dive (lazy-loaded)
        ══════════════════════════════════════════════ */}
        {activeTab === 'skills' && (
          <Suspense fallback={<TabFallback />}>
            <SkillsTab />
          </Suspense>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Learning (lazy-loaded)
        ══════════════════════════════════════════════ */}
        {activeTab === 'learning' && (
          <Suspense fallback={<TabFallback />}>
            <LearningTab />
          </Suspense>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Goals (lazy-loaded)
        ══════════════════════════════════════════════ */}
        {activeTab === 'goals' && (
          <Suspense fallback={<TabFallback />}>
            <GoalsTab />
          </Suspense>
        )}

        {/* ══════════════════════════════════════════════
            ALL CHARTS DASHBOARD — Visible under all tabs
        ══════════════════════════════════════════════ */}
        <AllChartsDashboard
          analytics={analytics}
          portfolio={portfolio}
          careerData={chartData.careerData}
          goalsData={chartData.goalsData}
          skillsData={chartData.skillsData}
          learningData={chartData.learningData}
          domainCoverage={chartData.domainCoverage}
        />

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SkillBarList
   Animated horizontal skill bars — triggered by scroll
════════════════════════════════════════════════════════════════ */
/**
 * SkillBarList — Renders a list of animated skill bar rows.
 * Uses IntersectionObserver to trigger bar fill animations.
 *
 * @param {object} props
 * @param {Array}  props.skills - Array of skill objects { skill_name, score, color }
 * @param {Array}  props.colors - Fallback color palette from CHART_COLORS
 *
 * @returns {JSX.Element}
 */
function SkillBarList({ skills, colors }) {

  const listRef = useRef(null);                            // Ref to the skill list container

  /* ── Trigger fill animation when list enters viewport ─────── */
  useEffect(() => {
    if (!listRef.current) return;                          // Guard: element not mounted

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;               // Skip if not visible

          /* Select all fill bars inside this list */
          const fills = entry.target.querySelectorAll('.analytics-skill-row__fill');

          fills.forEach((fill, i) => {
            /* Stagger each bar by BAR_DELAY ms */
            setTimeout(() => {
              fill.style.width = fill.dataset.pct;         /* Animate to data-pct width */
            }, i * ANIMATION.BAR_DELAY);
          });

          observer.unobserve(entry.target);                /* Animate once only */
        });
      },
      { threshold: ANIMATION.REVEAL_THRESHOLD }            /* Trigger at 12% visible */
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();                    /* Cleanup on unmount */
  }, [skills]);                                            /* Re-run if skills change */

  return (
    <div ref={listRef} role="list" aria-label="Top skills">
      {skills.map((skill, i) => {

        /* Build gradient from skill color or fallback chart palette */
        const gradient = skill.color
          ? `linear-gradient(90deg, ${skill.color}, var(--cyan))`
          : `linear-gradient(90deg, ${colors[i % colors.length]}, var(--cyan))`;

        return (
          <div
            key={skill.skill_name}
            className="analytics-skill-row"
            role="listitem"
          >
            {/* Skill name */}
            <span
              className="analytics-skill-row__name"
              title={skill.skill_name}
            >
              {skill.skill_name}
            </span>

            {/* Progress track */}
            <div className="analytics-skill-row__track">
              <div
                className="analytics-skill-row__fill"
                data-pct={`${skill.score}%`}               /* Target width for observer */
                style={{
                  width:      '0%',                        /* Start at 0 */
                  background: gradient,                    /* Gradient fill */
                  transition: `width 1.3s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms`, /* Stagger */
                }}
                role="progressbar"
                aria-valuenow={skill.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${skill.skill_name}: ${skill.score}%`}
              />
            </div>

            {/* Score percentage */}
            <span className="analytics-skill-row__pct">
              {skill.score}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: AnimatedKpiCard
   Count-up animation from 0 → value with staggered delay
════════════════════════════════════════════════════════════════ */
/**
 * AnimatedKpiCard — KPI card with animated count-up number.
 * Uses requestAnimationFrame for smooth GPU-accelerated counting.
 *
 * @param {object} props
 * @param {string} props.label  - Display label (e.g., "Skills")
 * @param {number} props.value  - Target number to count up to
 * @param {string} props.icon   - Emoji or symbol for the card
 * @param {string} props.color  - CSS color for the number and glow
 * @param {number} props.delay  - Milliseconds to delay start (stagger)
 *
 * @returns {JSX.Element}
 */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {

  const numRef = useRef(null);                             // Direct DOM ref for performance

  /* ── Count-up animation on mount ───────────────────────────── */
  useEffect(() => {
    if (!numRef.current || value === 0) return;            // Skip if no element or zero

    const duration = 1300;                                 // Animation duration in ms
    const start    = performance.now();                    // High-res timestamp

    /** RAF tick — updates counter each frame */
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1); // 0 → 1
      const eased    = 1 - Math.pow(1 - progress, 3);         // Cubic ease-out
      const current  = Math.round(eased * value);             // Current displayed value

      if (numRef.current) numRef.current.textContent = current; // Update DOM directly
      if (progress < 1)   requestAnimationFrame(tick);          // Continue until done
    };

    /* Delay start for stagger effect */
    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);                      /* Cleanup on unmount */
  }, [value, delay]);

  return (
    <div
      className="analytics-kpi-card"
      role="listitem"
      style={{
        '--kpi-color': color,                              /* Custom prop for glow color */
        animation:     `fadeUp 0.45s ease ${delay}ms both`, /* Staggered entrance */
      }}
      aria-label={`${label}: ${value}`}
    >
      {/* Icon */}
      <div className="analytics-kpi-card__icon" aria-hidden="true">
        {icon}
      </div>

      {/* Animated count-up number */}
      <div
        ref={numRef}
        className="analytics-kpi-card__num"
        style={{ color }}
        aria-live="polite"
      >
        {value}
      </div>

      {/* Label */}
      <div className="analytics-kpi-card__label">
        {label}
      </div>
    </div>
  );
}
