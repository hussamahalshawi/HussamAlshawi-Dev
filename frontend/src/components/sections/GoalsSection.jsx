/**
 * GoalsSection.jsx — Career roadmap goals grid
 * Displays goal cards with progress bars, status badges,
 * and required skills match indicators.
 * Data is fetched internally from the goals API (not passed as prop).
 */
import { useState, useEffect }  from 'react';                 // State and lifecycle hooks
import Card                     from '../ui/Card';            // Reusable card wrapper
import Badge                    from '../ui/Badge';           // Status / priority badge
import { SkeletonCardGrid }     from '../ui/SkeletonLoader';  // Loading skeleton
import goalsService             from '../../services/goalsService'; // Goals API calls

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
          <SkeletonCardGrid count={4} height="220px" />
        </div>
      </section>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <section id="goals" className="section section--alt">
        <div className="container">
          <p style={{ color: 'var(--color-muted)' }}>Goals data unavailable.</p>
        </div>
      </section>
    );
  }

  const goalsList = goals?.goals || [];                       // Extract goals array

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
          {goalsList.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>

        {/* Empty state */}
        {goalsList.length === 0 && (
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '3rem 0' }}>
            No goals configured yet.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * GoalCard — renders a single goal card with progress bar and badges.
 * @param {{ goal: object }} props
 */
function GoalCard({ goal }) {
  return (
    <Card interactive className="goal-card">

      {/* ── Header row: name + priority badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.04em', lineHeight: 1.1 }}>
          {goal.goal_name}
        </h3>
        {goal.priority && (
          <Badge
            label={goal.priority}
            bg={goal.priority_style?.bg}                      /* API-provided colour tokens */
            color={goal.priority_style?.text}
            border={goal.priority_style?.border}
          />
        )}
      </div>

      {/* Sub-title */}
      {goal.sub_title && (
        <p style={{ fontSize: '0.84rem', color: 'var(--color-muted)', marginBottom: '0.8rem' }}>
          {goal.sub_title}
        </p>
      )}

      {/* ── Status badge ── */}
      {goal.status && (
        <Badge
          label={goal.status}
          bg={goal.status_style?.bg}                          /* API-provided colour tokens */
          color={goal.status_style?.text}
          border={goal.status_style?.border}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>Progress</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-lime)' }}>
            {goal.progress_pct}%                              {/* Pre-computed by API */}
          </span>
        </div>
        <div className="goal-card__track">
          <div
            className="goal-card__fill"
            style={{ width: `${goal.progress_pct}%` }}         /* Animate via CSS width */
          />
        </div>
      </div>

      {/* ── Target year ── */}
      {goal.target_year && (
        <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginBottom: '0.8rem' }}>
          Target: <strong style={{ color: 'var(--color-text)' }}>{goal.target_year}</strong>
        </p>
      )}

      {/* ── Required skills tags ── */}
      {goal.required_skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {goal.required_skills.slice(0, 5).map(skill => (     /* Max 5 tags shown */
            <Badge
              key={skill.skill_name}
              label={skill.skill_name}
              variant={skill.matched ? 'lime' : 'muted'}       /* Lime if skill is matched */
            />
          ))}
        </div>
      )}
    </Card>
  );
}