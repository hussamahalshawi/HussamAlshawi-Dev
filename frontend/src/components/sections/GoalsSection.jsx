/**
 * GoalsSection.jsx — Career Roadmap Goals Grid
 * ─────────────────────────────────────────────────────────
 * Displays goal cards with progress bars, status badges,
 * and required skills match indicators.
 * Data is fetched internally from the goals API (not passed as prop).
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect }  from 'react';                 // State and lifecycle hooks
import Card                     from '../ui/Card';            // Reusable card wrapper
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
          <p style={{ color: 'var(--text-muted)' }}>Goals data unavailable.</p>
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
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--s3)' }}>
        <h3 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '1.2rem',
          letterSpacing: '0.02em',
          lineHeight:    1.1,
          color:         'var(--text-white)',
        }}>
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
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 'var(--s3)', lineHeight: 1.6 }}>
          {goal.sub_title}
        </p>
      )}

      {/* ── Status badge ── */}
      {goal.status && (
        <div style={{ marginBottom: 'var(--s4)' }}>
          <Badge
            label={goal.status}
            bg={goal.status_style?.bg}                        // API-provided colour tokens
            color={goal.status_style?.text}
            border={goal.status_style?.border}
          />
        </div>
      )}

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: 'var(--s4)' }}>
        {/* Progress header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s2)' }}>
          <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            PROGRESS
          </span>
          <span style={{
            fontFamily:  'var(--font-mono)',
            fontSize:    '0.72rem',
            color:       'var(--cyan)',
            fontWeight:  700,
          }}>
            {goal.progress_pct}%
          </span>
        </div>
        {/* Track */}
        <div className="goal-card__track">
          <div
            className="goal-card__fill"
            style={{ width: `${goal.progress_pct}%` }}        // Inline width from API
          />
        </div>
      </div>

      {/* ── Target year ── */}
      {goal.target_year && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 'var(--s3)' }}>
          Target:{' '}
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {goal.target_year}
          </strong>
        </p>
      )}

      {/* ── Required skills tags ── */}
      {goal.required_skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s1)', marginTop: 'auto', paddingTop: 'var(--s3)' }}>
          {goal.required_skills.slice(0, 5).map(skill => (    // Max 5 tags
            <Badge
              key={skill.skill_name}
              label={skill.skill_name}
              variant={skill.matched ? 'lime' : 'muted'}      // Lime if skill matched
            />
          ))}
        </div>
      )}
    </Card>
  );
}