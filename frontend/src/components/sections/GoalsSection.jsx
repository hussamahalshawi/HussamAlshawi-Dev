/**
 * GoalsSection.jsx — Career Roadmap Goals Grid
 * ─────────────────────────────────────────────────────────
 * Displays goal cards with progress bars, status badges,
 * and required skills match indicators.
 * Glassmorphism cards with gloss lines, water-droplet
 * texture, hover lift, and reveal bottom bar.
 * Data fetched internally via goalsService.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect }  from 'react';                 // State and lifecycle hooks
import Badge                    from '../ui/Badge';           // Status / priority badge
import { SkeletonCardGrid }     from '../ui/SkeletonLoader';  // Loading skeleton
import goalsService             from '../../services/goalsService'; // Goals API calls
import '../../styles/components/GoalsSection.css';            // Component-specific styles

/**
 * GoalsSection — renders a grid of career roadmap goal cards.
 * Each card shows: goal name, status, priority, progress bar, skill tags.
 */
export default function GoalsSection() {
  const [goals,   setGoals]   = useState(null);               // Goals response from API
  const [loading, setLoading] = useState(true);               // Fetch in progress
  const [error,   setError]   = useState(null);               // Error message or null

  // ── Fetch goals on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;                                    // Prevent stale state update

    async function fetchGoals() {
      setLoading(true);
      setError(null);

      try {
        const data = await goalsService.getPublicGoals();     // GET /portfolio/goals
        if (!cancelled) setGoals(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load goals.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGoals();
    return () => { cancelled = true; };                       // Cleanup on unmount
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section id="goals" className="section section--alt">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Career Roadmap</span>
            <h2 className="s-title">Goals</h2>
          </div>
          <SkeletonCardGrid count={4} height="240px" />
        </div>
      </section>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <section id="goals" className="section section--alt">
        <div className="container">
          <p style={{
            color:      'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize:   '0.82rem',
          }}>
            Goals data unavailable.
          </p>
        </div>
      </section>
    );
  }

  const goalsList = goals?.goals || [];                       // Extract goals array safely

  return (
    <section id="goals" className="section section--alt">
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Career Roadmap</span>
          <h2 className="s-title">Goals</h2>
          <p className="s-sub">
            Tracking {goalsList.length} career milestones
          </p>
        </div>

        {/* ── Goals grid ── */}
        <div className="goals-grid">
          {goalsList.map((goal, index) => (
            <GoalCard
              key={goal.id || index}
              goal={goal}
              index={index}
            />
          ))}
        </div>

        {/* Empty state */}
        {goalsList.length === 0 && (
          <p style={{
            color:      'var(--text-muted)',
            textAlign:  'center',
            padding:    '3rem 0',
            fontFamily: 'var(--font-mono)',
            fontSize:   '0.82rem',
          }}>
            No goals configured yet.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * GoalCard — renders a single glassmorphism goal card.
 * Includes gloss line, texture, hover lift, and reveal bar.
 * @param {{ goal: object, index: number }} props
 */
function GoalCard({ goal, index }) {
  return (
    <div
      className="goal-card"
      style={{ animation: `fadeUp 0.45s ease ${index * 70}ms both` }} // Stagger entrance
    >
      {/* Reveal bottom bar — shown on hover via CSS */}
      <div className="goal-card__bar-reveal" aria-hidden="true" />

      {/* ── Header row: name + priority badge ── */}
      <div className="goal-card__header">
        <h3 className="goal-card__name">
          {goal.goal_name}
        </h3>
        {goal.priority && (
          <Badge
            label={goal.priority}
            bg={goal.priority_style?.bg}                      // API-provided colour tokens
            color={goal.priority_style?.text}
            border={goal.priority_style?.border}
          />
        )}
      </div>

      {/* Sub-title */}
      {goal.sub_title && (
        <p className="goal-card__sub">{goal.sub_title}</p>
      )}

      {/* ── Status badge ── */}
      {goal.status && (
        <div style={{ marginBottom: 'var(--s2)' }}>
          <Badge
            label={goal.status}
            bg={goal.status_style?.bg}                        // API-provided colour tokens
            color={goal.status_style?.text}
            border={goal.status_style?.border}
          />
        </div>
      )}

      {/* ── Progress bar ── */}
      <div>
        {/* Progress label row */}
        <div className="goal-card__progress-header">
          <span className="goal-card__progress-label">Progress</span>
          <span className="goal-card__progress-pct">
            {goal.progress_pct}%
          </span>
        </div>

        {/* Track + fill */}
        <div className="goal-card__track">
          <div
            className="goal-card__fill"
            style={{ width: `${goal.progress_pct}%` }}        // Inline width from API
          />
        </div>
      </div>

      {/* ── Target year ── */}
      {goal.target_year && (
        <p className="goal-card__year">
          Target:{' '}
          <strong>{goal.target_year}</strong>
        </p>
      )}

      {/* ── Required skills tags ── */}
      {goal.required_skills?.length > 0 && (
        <div className="goal-card__tags">
          {goal.required_skills.slice(0, 5).map(skill => (    // Max 5 tags shown
            <Badge
              key={skill.skill_name}
              label={skill.skill_name}
              variant={skill.matched ? 'lime' : 'muted'}      // Lime = skill matched
            />
          ))}
          {/* Show overflow count if more than 5 */}
          {goal.required_skills.length > 5 && (
            <Badge
              label={`+${goal.required_skills.length - 5}`}
              variant="muted"
            />
          )}
        </div>
      )}
    </div>
  );
}