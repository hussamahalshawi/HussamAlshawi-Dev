/**
 * AnalyticsSection.jsx
 * ─────────────────────────────────────────────────────────
 * Analytics dashboard with tab-based navigation.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  Section Header: "By the Numbers"                │
 *   ├──────────────────────────────────────────────────┤
 *   │  Tab Bar: Overview | Career | Skills | Learning | Goals │
 *   ├──────────────────────────────────────────────────┤
 *   │  Tab Content (each tab has its own charts)       │
 *   └──────────────────────────────────────────────────┘
 *
 * Tabs:
 *   Overview  — KPI bento grid + summary stats
 *   Career    — Gantt, Employment Mix, Treemap, Heatmap, Achievements
 *   Skills    — Heatmap, Distribution, Top Skills, Sources, Domain Coverage
 *   Learning  — Courses, Providers, Word Cloud, Study Types, Tracks
 *   Goals     — Gauge, Status/Priority Donuts, Year Progress, Skill Gap
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { CHART_COLORS, SKILL_BANDS, ANIMATION, ANALYTICS_TABS, KPI_CONFIG } from '../../utils/constants';
import { SkeletonKPI }                                                from '../ui/SkeletonLoader';
import Badge                                                          from '../ui/Badge';
import CareerTab                                                      from './tabs/CareerTab';
import SkillsTab                                                      from './tabs/SkillsTab';
import LearningTab                                                    from './tabs/LearningTab';
import GoalsTab                                                       from './tabs/GoalsTab';
import '../../styles/components/AnalyticsSection.css';

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: AnalyticsSection
════════════════════════════════════════════════════════════════ */
export default function AnalyticsSection({ analytics }) {

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

  /* ── Loading skeleton ─────────────────────────────────────── */
  if (!analytics) {
    return (
      <section id="analytics" className="section section--alt">
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

  /* ── Safe data extraction ────────────────────────────────── */
  const counts    = analytics.counts              || {};
  const topSkills = analytics.top_skills          || [];
  const radar     = analytics.skills_radar        || [];
  const dist      = analytics.skills_distribution || {};

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
            TAB: Overview — KPI cards + summary stats
        ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* ── KPI bento grid ── */}
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

            {/* ── Summary panels: skills + distribution ── */}
            <div className="analytics-bottom">

              {/* LEFT: Top skills bars */}
              <div className="analytics-glass-panel analytics-skills">
                <div className="analytics-panel__header">
                  <p className="skill-group__title" style={{ margin: 0 }}>
                    Top Skills
                  </p>
                </div>
                <SkillBarList
                  skills={topSkills.slice(0, 8)}
                  colors={CHART_COLORS}
                />
                {topSkills.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No skills data available.
                  </p>
                )}
              </div>

              {/* RIGHT: Distribution + category averages */}
              <div className="analytics-glass-panel analytics-dist">
                <div className="analytics-panel__header">
                  <p className="skill-group__title" style={{ margin: 0 }}>
                    Proficiency Distribution
                  </p>
                </div>

                {Object.entries(SKILL_BANDS).map(([key, band]) => {
                  const count = dist[key]     || 0;
                  const total = counts.skills || 1;
                  const pct   = Math.round((count / total) * 100);

                  return (
                    <div key={key} className="dist-row">
                      <div className="dist-row__label">
                        <Badge
                          label={band.label}
                          style={{ color: band.color }}
                          variant="muted"
                        />
                      </div>
                      <div className="dist-row__track">
                        <div
                          className="dist-row__fill"
                          style={{
                            width:      `${pct}%`,
                            background: band.color,
                          }}
                        />
                      </div>
                      <span className="dist-row__count">{count}</span>
                    </div>
                  );
                })}

                <div className="analytics-divider" aria-hidden="true" />

                {radar.length > 0 && (
                  <>
                    <p className="skill-group__title" style={{ marginBottom: 'var(--s4)' }}>
                      Category Averages
                    </p>

                    {radar.slice(0, 5).map((cat, i) => (
                      <div key={cat.category} className="cat-avg-row">
                        <span className="cat-avg-row__name">
                          {cat.category}
                        </span>
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
          </>
        )}

        {/* ══════════════════════════════════════════════
            TAB: Career Journey
        ══════════════════════════════════════════════ */}
        {activeTab === 'career' && <CareerTab />}

        {/* ══════════════════════════════════════════════
            TAB: Skills Deep Dive
        ══════════════════════════════════════════════ */}
        {activeTab === 'skills' && <SkillsTab />}

        {/* ══════════════════════════════════════════════
            TAB: Learning
        ══════════════════════════════════════════════ */}
        {activeTab === 'learning' && <LearningTab />}

        {/* ══════════════════════════════════════════════
            TAB: Goals
        ══════════════════════════════════════════════ */}
        {activeTab === 'goals' && <GoalsTab />}

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SkillBarList
════════════════════════════════════════════════════════════════ */
function SkillBarList({ skills, colors }) {

  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const fills = entry.target.querySelectorAll('.analytics-skill-row__fill');

          fills.forEach((fill, i) => {
            setTimeout(() => {
              fill.style.width = fill.dataset.pct;
            }, i * ANIMATION.BAR_DELAY);
          });

          observer.unobserve(entry.target);
        });
      },
      { threshold: ANIMATION.REVEAL_THRESHOLD }
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [skills]);

  return (
    <div ref={listRef} role="list" aria-label="Top skills">
      {skills.map((skill, i) => {

        const gradient = skill.color
          ? `linear-gradient(90deg, ${skill.color}, var(--cyan))`
          : `linear-gradient(90deg, ${colors[i % colors.length]}, var(--cyan))`;

        return (
          <div
            key={skill.skill_name}
            className="analytics-skill-row"
            role="listitem"
          >
            <span
              className="analytics-skill-row__name"
              title={skill.skill_name}
            >
              {skill.skill_name}
            </span>

            <div className="analytics-skill-row__track">
              <div
                className="analytics-skill-row__fill"
                data-pct={`${skill.score}%`}
                style={{
                  width:      '0%',
                  background: gradient,
                  transition: `width 1.3s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms`,
                }}
                role="progressbar"
                aria-valuenow={skill.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${skill.skill_name}: ${skill.score}%`}
              />
            </div>

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
════════════════════════════════════════════════════════════════ */
function AnimatedKpiCard({ label, value, icon, color, delay = 0 }) {

  const numRef = useRef(null);

  useEffect(() => {
    if (!numRef.current || value === 0) return;

    const duration = 1300;
    const start    = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(eased * value);

      if (numRef.current) numRef.current.textContent = current;
      if (progress < 1)   requestAnimationFrame(tick);
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
      <div className="analytics-kpi-card__icon" aria-hidden="true">
        {icon}
      </div>

      <div
        ref={numRef}
        className="analytics-kpi-card__num"
        style={{ color }}
        aria-live="polite"
      >
        {value}
      </div>

      <div className="analytics-kpi-card__label">
        {label}
      </div>
    </div>
  );
}
