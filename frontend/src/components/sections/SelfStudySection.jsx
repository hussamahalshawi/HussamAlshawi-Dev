/**
 * SelfStudySection.jsx
 * ─────────────────────────────────────────────────────────
 * Self-study learning activities section.
 *
 * Layout:
 *   Row 1: Stats bar (count, types)
 *   Row 2: Filter buttons by learning type
 *   Row 3: Activity cards grid
 *
 * Data: selfStudy from usePortfolioData (GET /api/portfolio/self-study)
 * ─────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/SelfStudySection.css';

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
const COLORS = {
  dark: ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'],
  light: ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'],
};

/* ── Learning type icons ────────────────────────────────────── */
const TYPE_ICONS = {
  Book:      'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  Course:    'M22 10v6M2 10l10-5 10 5-10 5z',
  Article:   'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  Workshop:  'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  Other:     'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5',
};

function TypeIcon({ type, color }) {
  const path = TYPE_ICONS[type] || TYPE_ICONS.Other;
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function SelfStudySection({ selfStudy }) {
  const { isDark } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const studyList = selfStudy?.self_study || [];
  const types = selfStudy?.types || [];

  /* ── Active type filter ───────────────────────────────────── */
  const [activeType, setActiveType] = useState('All');

  const filteredStudy = useMemo(() => {
    if (activeType === 'All') return studyList;
    return studyList.filter(s => s.learning_type === activeType);
  }, [studyList, activeType]);

  /* ── Stats ────────────────────────────────────────────────── */
  const totalSkills = useMemo(() => {
    return studyList.reduce((sum, s) => sum + (s.skills_learned?.length || 0), 0);
  }, [studyList]);

  /* ════════════════════════════════════════════════════════════
     STATS BAR
     ════════════════════════════════════════════════════════════ */
  const StatsBar = () => (
    <motion.div
      className="ss-panel ss-stats"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.0 }}
    >
      <div className="ss-stats__item">
        <span className="ss-stats__num">{studyList.length}</span>
        <span className="ss-stats__label">Activities</span>
      </div>
      <div className="ss-stats__divider" />
      <div className="ss-stats__item">
        <span className="ss-stats__num">{types.length}</span>
        <span className="ss-stats__label">Types</span>
      </div>
      <div className="ss-stats__divider" />
      <div className="ss-stats__item">
        <span className="ss-stats__num ss-stats__num--accent">{totalSkills}</span>
        <span className="ss-stats__label">Skills Learned</span>
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     ACTIVITY CARD
     ════════════════════════════════════════════════════════════ */
  const ActivityCard = ({ item, index }) => {
    const accentColor = colors[index % colors.length];

    return (
      <motion.div
        className="ss-card"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: Math.min(index * 0.04, 0.2) }}
      >
        <div className="ss-card__top">
          <div className="ss-card__icon" style={{ background: accentColor + '18' }}>
            <TypeIcon type={item.learning_type} color={accentColor} />
          </div>
          <span className="ss-card__type">{item.learning_type}</span>
          {item.track && <span className="ss-card__track">{item.track}</span>}
        </div>

        <h4 className="ss-card__title">{item.title}</h4>

        {item.platform_name && (
          <span className="ss-card__platform">{item.platform_name}</span>
        )}

        {item.summary && (
          <p className="ss-card__desc">{item.summary}</p>
        )}

        {item.skills_learned?.length > 0 && (
          <div className="ss-card__skills">
            {item.skills_learned.slice(0, 4).map((sk, si) => (
              <span className="ss-card__skill-tag" key={si}>{sk}</span>
            ))}
            {item.skills_learned.length > 4 && (
              <span className="ss-card__skill-more">+{item.skills_learned.length - 4}</span>
            )}
          </div>
        )}

        <div className="ss-card__meta">
          {item.start_date && (
            <span className="ss-card__date">
              {new Date(item.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
              {item.end_date && ` — ${new Date(item.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
            </span>
          )}
          {item.source_url && (
            <a className="ss-card__link" href={item.source_url} target="_blank" rel="noopener noreferrer">
              View source →
            </a>
          )}
        </div>
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  if (studyList.length === 0) {
    return (
      <section id="selfstudy" className="selfstudy-section" aria-label="Self Study">
        <div className="ss-empty">No self-study activities yet</div>
      </section>
    );
  }

  return (
    <section id="selfstudy" className="selfstudy-section" aria-label="Self Study">
      <StatsBar />
      <motion.div
        className="ss-panel ss-filters"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.05 }}
      >
        <button
          className={`ss-filter-btn ${activeType === 'All' ? 'ss-filter-btn--active' : ''}`}
          onClick={() => setActiveType('All')}
        >
          All ({studyList.length})
        </button>
        {types.map(t => {
          const count = studyList.filter(s => s.learning_type === t).length;
          return (
            <button
              key={t}
              className={`ss-filter-btn ${activeType === t ? 'ss-filter-btn--active' : ''}`}
              onClick={() => setActiveType(t)}
            >
              {t} ({count})
            </button>
          );
        })}
      </motion.div>
      <div className="ss-grid">
        {filteredStudy.map((item, i) => (
          <ActivityCard key={item.id || i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
