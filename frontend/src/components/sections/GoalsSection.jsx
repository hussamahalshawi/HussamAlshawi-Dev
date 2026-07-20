/**
 * GoalsSection.jsx
 * ─────────────────────────────────────────────────────────
 * Goals & Roadmap section with stats + goal cards.
 *
 * Layout:
 *   Row 1: Stats bar (total, achieved, avg progress)
 *   Row 2: Goal cards grid (auto-fill)
 *
 * Data: goals + goalsStats from usePortfolioData
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/GoalsSection.css';

/* ── Animation variants ─────────────────────────────────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CARD_TRANSITION = {
  duration: 0.5,
  ease:     [0.4, 0, 0.2, 1],
};

/* ── Priority colors ────────────────────────────────────────── */
const PRIORITY_COLORS = {
  dark: {
    Critical: '#F06292',
    High:     '#F5A623',
    Medium:   '#4FC3F7',
    Low:      '#4ECCA3',
  },
  light: {
    Critical: '#d0406a',
    High:     '#d07a10',
    Medium:   '#1a8fc7',
    Low:      '#1a9e6e',
  },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function GoalsSection({ goals, goalsStats }) {
  const { isDark } = useTheme();
  const goalsList = goals?.goals || [];
  const stats = goalsStats || {};

  const achievedCount = stats.achieved_count || goalsList.filter(g => g.status === 'Achieved').length;
  const avgProgress = stats.avg_progress || 0;
  const totalGoals = stats.total_goals || goalsList.length;

  const priorityColors = isDark ? PRIORITY_COLORS.dark : PRIORITY_COLORS.light;

  /* ════════════════════════════════════════════════════════════
     STATS BAR
     ════════════════════════════════════════════════════════════ */
  const StatsBar = () => (
    <motion.div
      className="goals-panel goals-stats"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.0 }}
    >
      <div className="goals-stats__item">
        <span className="goals-stats__num">{totalGoals}</span>
        <span className="goals-stats__label">Total Goals</span>
      </div>
      <div className="goals-stats__divider" />
      <div className="goals-stats__item">
        <span className="goals-stats__num goals-stats__num--green">{achievedCount}</span>
        <span className="goals-stats__label">Achieved</span>
      </div>
      <div className="goals-stats__divider" />
      <div className="goals-stats__item">
        <span className="goals-stats__num goals-stats__num--accent">{Math.round(avgProgress)}%</span>
        <span className="goals-stats__label">Avg Progress</span>
      </div>

      {stats.by_status?.length > 0 && (
        <div className="goals-stats__breakdown">
          {stats.by_status.map((s, i) => (
            <span
              key={i}
              className="goals-stats__badge"
              style={{ background: s.style?.bg + '20', borderColor: s.style?.bg + '40', color: s.style?.text }}
            >
              {s.status}: {s.count}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     GOAL CARD
     ════════════════════════════════════════════════════════════ */
  const GoalCard = ({ goal, index }) => {
    const pct = goal.progress_pct || 0;
    const pColor = priorityColors[goal.priority] || priorityColors.Medium;
    const statusStyle = goal.status_style || {};
    const matchedSkills = goal.required_skills?.filter(sk => sk.matched) || [];
    const unmatchedSkills = goal.required_skills?.filter(sk => !sk.matched) || [];

    return (
      <motion.div
        className="goals-card"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: Math.min(index * 0.04, 0.2) }}
      >
        <div className="goals-card__top">
          <span
            className="goals-card__priority"
            style={{ background: pColor + '18', borderColor: pColor + '40', color: pColor }}
          >
            {goal.priority}
          </span>
          <span
            className="goals-card__status"
            style={{ background: statusStyle?.bg + '20', borderColor: statusStyle?.bg + '40', color: statusStyle?.text }}
          >
            {goal.status}
          </span>
          {goal.target_year && (
            <span className="goals-card__year">{goal.target_year}</span>
          )}
        </div>

        <h4 className="goals-card__name">{goal.goal_name}</h4>
        {goal.sub_title && <span className="goals-card__sub">{goal.sub_title}</span>}

        {/* Progress bar */}
        <div className="goals-card__progress-wrap">
          <div className="goals-card__progress-bar">
            <div
              className="goals-card__progress-fill"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: pColor,
              }}
            />
          </div>
          <span className="goals-card__progress-pct">{Math.round(pct)}%</span>
        </div>

        {/* Score: current / target */}
        {(goal.current_score != null || goal.target_score != null) && (
          <div className="goals-card__scores">
            <span className="goals-card__score-label">Score</span>
            <span className="goals-card__score-value">
              {goal.current_score ?? 0}
              <span className="goals-card__score-sep">/</span>
              {goal.target_score ?? 0}
            </span>
          </div>
        )}

        {/* Skill match */}
        {goal.required_skills?.length > 0 && (
          <div className="goals-card__skills">
            {matchedSkills.map((sk, si) => (
              <span className="goals-card__skill-tag goals-card__skill-tag--matched" key={`m-${si}`}>
                {sk.skill_name}
              </span>
            ))}
            {unmatchedSkills.map((sk, si) => (
              <span className="goals-card__skill-tag goals-card__skill-tag--unmatched" key={`u-${si}`}>
                {sk.skill_name}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  if (goalsList.length === 0) {
    return (
      <section id="goals" className="goals-section" aria-label="Goals">
        <div className="goals-empty">No goals defined yet</div>
      </section>
    );
  }

  return (
    <section id="goals" className="goals-section" aria-label="Goals">
      <StatsBar />
      <div className="goals-grid">
        {goalsList.map((goal, i) => (
          <GoalCard key={goal.id || i} goal={goal} index={i} />
        ))}
      </div>
    </section>
  );
}
