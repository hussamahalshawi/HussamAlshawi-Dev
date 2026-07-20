/**
 * ExperienceSection.jsx
 * ─────────────────────────────────────────────────────────
 * Experience & Achievements dashboard section.
 *
 * Layout:
 *   Row 1: Stats | Employment Mix (donut) | Tech Stack (bar)
 *   Row 2: Career Gantt Timeline (full width)
 *   Row 3: Achievement Cards (grid)
 *
 * Data sources:
 *   - experience  → from usePortfolioData (API: /portfolio/experience)
 *   - achievements → from usePortfolioData (API: /portfolio/achievements)
 *   - careerCharts → from usePortfolioData (composite: gantt, employment, stack, achievements-timeline)
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/ExperienceSection.css';

/* ── Animation variants ─────────────────────────────────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CARD_TRANSITION = {
  duration: 0.5,
  ease:     [0.4, 0, 0.2, 1],
};

/* ── Theme colors ───────────────────────────────────────────── */
const DARK_COLORS  = ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'];
const LIGHT_COLORS = ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'];

const GANTT_COLORS = {
  experience: { dark: '#4ECCA3', light: '#1a9e6e' },
  education:  { dark: '#9B7FEA', light: '#7c5bd4' },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ExperienceSection({ experience, achievements, careerCharts }) {
  const { isDark } = useTheme();

  /* ── Derived data ─────────────────────────────────────────── */
  const expList   = experience?.experience || [];
  const achList   = achievements?.achievements || [];
  const ganttData = careerCharts?.gantt;
  const empData   = careerCharts?.employmentMix;
  const stackData = careerCharts?.stackFrequency;

  /* ── Stats ────────────────────────────────────────────────── */
  const totalMonths = useMemo(() => {
    let total = 0;
    expList.forEach(e => {
      const start = new Date(e.start_date);
      const end   = e.end_date ? new Date(e.end_date) : new Date();
      total += (end - start) / (1000 * 60 * 60 * 24 * 30);
    });
    return Math.round(total);
  }, [expList]);

  const yearsExp = useMemo(() => (totalMonths / 12).toFixed(1), [totalMonths]);

  /* ════════════════════════════════════════════════════════════
     ROW 1 — STATS CARD
     ════════════════════════════════════════════════════════════ */
  const StatsCard = () => (
    <motion.div
      className="exp-panel exp-stats"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.0 }}
    >
      <div className="exp-panel__header">
        <span className="exp-panel__title">Career Overview</span>
        <span className="exp-panel__sub">Professional journey at a glance</span>
      </div>
      <div className="exp-stats__grid">
        <div className="exp-stat">
          <span className="exp-stat__num">{yearsExp}</span>
          <span className="exp-stat__label">Years Exp</span>
        </div>
        <div className="exp-stat">
          <span className="exp-stat__num">{expList.length}</span>
          <span className="exp-stat__label">Roles</span>
        </div>
        <div className="exp-stat">
          <span className="exp-stat__num">{achList.length}</span>
          <span className="exp-stat__label">Achievements</span>
        </div>
        <div className="exp-stat">
          <span className="exp-stat__num">{stackData?.labels?.length || 0}</span>
          <span className="exp-stat__label">Tech Skills</span>
        </div>
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     ROW 1 — EMPLOYMENT MIX DONUT
     ════════════════════════════════════════════════════════════ */
  const EmploymentCard = () => {
    const series = empData?.series || [];
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    const total = series.reduce((s, d) => s + d.months, 0) || 1;
    let cumAngle = -Math.PI / 2;

    const donutR = 65;

    const slices = series.map((d, i) => {
      const pct     = d.months / total;
      const startA  = cumAngle;
      const endA    = cumAngle + pct * 2 * Math.PI;
      cumAngle      = endA;
      const midA    = (startA + endA) / 2;
      return {
        ...d,
        startA,
        endA,
        midA,
        color: d.color || colors[i % colors.length],
        pctLabel: `${Math.round(pct * 100)}%`,
      };
    });

    return (
      <motion.div
        className="exp-panel exp-employment"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.05 }}
      >
        <div className="exp-panel__header">
          <span className="exp-panel__title">Employment Mix</span>
          <span className="exp-panel__sub">By months duration</span>
        </div>
        <div className="exp-donut-wrap">
          <svg viewBox="0 0 180 180" width="160" height="160">
            {slices.map((s, i) => (
              <DonutSlice key={i} {...s} cx={90} cy={90} r={donutR} innerR={42} />
            ))}
            <circle cx={90} cy={90} r={42} fill={isDark ? '#1a1a2e' : '#fff'} />
            <text x={90} y={86} textAnchor="middle" fontSize={20} fontWeight={700} fill={isDark ? '#fff' : '#1a2332'}>
              {total}
            </text>
            <text x={90} y={102} textAnchor="middle" fontSize={9} fill={isDark ? 'rgba(255,255,255,0.4)' : '#6b8aaa'}>
              months
            </text>
          </svg>
        </div>
        <div className="exp-donut-legend">
          {series.map((d, i) => (
            <div className="exp-donut-legend__item" key={i}>
              <span className="exp-donut-legend__dot" style={{ background: d.color || colors[i % colors.length] }} />
              <span className="exp-donut-legend__label">{d.type} ({d.pct_months || Math.round((d.months / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     ROW 1 — TECH STACK BAR
     ════════════════════════════════════════════════════════════ */
  const TechCard = () => {
    const labels = stackData?.labels || [];
    const counts = stackData?.counts || [];
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const maxCount = Math.max(...counts, 1);

    return (
      <motion.div
        className="exp-panel exp-tech"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.1 }}
      >
        <div className="exp-panel__header">
          <span className="exp-panel__title">Tech Stack</span>
          <span className="exp-panel__sub">Most used technologies</span>
        </div>
        <div className="exp-tech__bars">
          {labels.slice(0, 8).map((label, i) => (
            <div className="exp-tech__row" key={label}>
              <span className="exp-tech__label">{label}</span>
              <div className="exp-tech__track">
                <div
                  className="exp-tech__bar"
                  style={{
                    width: `${(counts[i] / maxCount) * 100}%`,
                    background: colors[i % colors.length],
                  }}
                />
              </div>
              <span className="exp-tech__count">{counts[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     ROW 2 — GANTT TIMELINE
     ════════════════════════════════════════════════════════════ */
  const GanttCard = () => {
    const items = ganttData?.items || [];
    const minYear = ganttData?.min_year || new Date().getFullYear() - 5;
    const maxYear = ganttData?.max_year || new Date().getFullYear();
    const yearSpan = maxYear - minYear || 1;

    const typeColors = {
      experience: isDark ? GANTT_COLORS.experience.dark : GANTT_COLORS.experience.light,
      education:  isDark ? GANTT_COLORS.education.dark  : GANTT_COLORS.education.light,
    };

    return (
      <motion.div
        className="exp-panel exp-gantt"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.15 }}
      >
        <div className="exp-panel__header">
          <span className="exp-panel__title">Career Timeline</span>
          <span className="exp-panel__sub">Education & Experience combined</span>
        </div>
        <div className="exp-gantt__scroll">
          {items.map((item, i) => {
            const leftPct  = ((item.start_year - minYear) / yearSpan) * 100;
            const rightPct = ((item.end_year - minYear) / yearSpan) * 100;
            const widthPct = Math.max(rightPct - leftPct, 2);
            const bgColor  = typeColors[item.type] || (isDark ? DARK_COLORS : LIGHT_COLORS)[i % DARK_COLORS.length];

            return (
              <div className="exp-gantt__row" key={i}>
                <span className="exp-gantt__label" title={`${item.label} — ${item.sub_label || ''}`}>
                  {item.label}
                </span>
                <div className="exp-gantt__track">
                  <div
                    className={`exp-gantt__bar ${item.is_current ? 'exp-gantt__bar--current' : ''}`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: bgColor,
                    }}
                    title={`${item.label} (${item.start_year}–${item.end_year || 'Present'})${item.location ? ' — ' + item.location : ''}`}
                  >
                    {item.start_year}–{item.end_year || 'Now'}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="exp-gantt__years">
            {Array.from({ length: yearSpan + 1 }, (_, i) => (
              <span className="exp-gantt__year" key={i}>{minYear + i}</span>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     ROW 3 — ACHIEVEMENT CARDS
     ════════════════════════════════════════════════════════════ */
  const AchievementsCard = () => {
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    return (
      <motion.div
        className="exp-panel exp-achievements"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.2 }}
      >
        <div className="exp-panel__header">
          <span className="exp-panel__title">Achievements</span>
          <span className="exp-panel__sub">{achList.length} total achievements</span>
        </div>
        <div className="exp-achievements__grid">
          {achList.map((ach, i) => (
            <div className="exp-achieve-card" key={ach.id || i}>
              <div
                className="exp-achieve-card__icon"
                style={{ background: colors[i % colors.length] + '18' }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={colors[i % colors.length]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div className="exp-achieve-card__title">{ach.title}</div>
              {ach.issuing_organization && (
                <div className="exp-achieve-card__org">{ach.issuing_organization}</div>
              )}
              {ach.date_obtained && (
                <div className="exp-achieve-card__date">
                  {new Date(ach.date_obtained).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </div>
              )}
              {ach.skills_demonstrated?.length > 0 && (
                <div className="exp-achieve-card__skills">
                  {ach.skills_demonstrated.map((sk, si) => (
                    <span className="exp-achieve-card__skill-tag" key={si}>{sk}</span>
                  ))}
                </div>
              )}
              {ach.evidence_url && (
                <a className="exp-achieve-card__link" href={ach.evidence_url} target="_blank" rel="noopener noreferrer">
                  View evidence →
                </a>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <section id="experience" className="experience-section" aria-label="Experience & Achievements">
      <div className="exp-grid">
        <StatsCard />
        <EmploymentCard />
        <TechCard />
        <GanttCard />
        <AchievementsCard />
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   DonutSlice — SVG arc path for the donut chart
   ══════════════════════════════════════════════════════════════ */
function DonutSlice({ startA, endA, color, cx, cy, r, innerR }) {
  const large = (endA - startA) > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(startA);
  const y1 = cy + r * Math.sin(startA);
  const x2 = cx + r * Math.cos(endA);
  const y2 = cy + r * Math.sin(endA);
  const ix1 = cx + innerR * Math.cos(endA);
  const iy1 = cy + innerR * Math.sin(endA);
  const ix2 = cx + innerR * Math.cos(startA);
  const iy2 = cy + innerR * Math.sin(startA);

  const d = [
    `M ${x1} ${y1}`,
    `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ');

  return <path d={d} fill={color} opacity={0.85} />;
}
