/**
 * TasksList.jsx
 * ─────────────────────────────────────────────────────────
 * Tasks list panel — shows task rows with avatar,
 * name, progress percentage, and status dot.
 * Data comes from /api/portfolio/goals (goals as tasks).
 * Theme-aware: all colors via CSS variables.
 * ─────────────────────────────────────────────────────────
 */
import '../../styles/components/TasksList.css';     // Component styles

/* ── Color palette for task avatars ──────────────────────────── */
const AVATAR_COLORS = [
  '#4FC3F7',   // cyan
  '#4ECCA3',   // green
  '#F5A623',   // orange
  '#FFD700',   // gold
  '#9B7FEA',   // violet
  '#F06292',   // red
];

/**
 * @param {object}      props
 * @param {object|null} props.goals - Goals object from /api/portfolio/goals
 */
export default function TasksList({ goals }) {

  /* ── Build task rows from goals API data ─────────────────────── */
  const taskData = buildTaskData(goals);

  return (
    <div className="tasks-list">

      {/* ── Panel header ── */}
      <div className="tasks-list__header">
        <span className="tasks-list__title">Tasks Status</span>
        <button className="tasks-list__menu" aria-label="Task options">···</button>
      </div>

      {/* ── Task rows ── */}
      <div className="tasks-list__rows" role="list">
        {taskData.map((task, index) => (
          <TaskRow
            key={task.id || index}
            task={task}
            color={AVATAR_COLORS[index % AVATAR_COLORS.length]}
          />
        ))}
      </div>

      {/* Empty state when no goals/tasks available */}
      {taskData.length === 0 && (
        <p className="tasks-list__empty">No tasks available.</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TaskRow — single task item
───────────────────────────────────────────────────────────── */
/**
 * @param {{ task: object, color: string }} props
 */
function TaskRow({ task, color }) {
  /* Determine status dot color based on progress */
  const statusColor = task.pct >= 60
    ? 'var(--green)'    // Green: good progress
    : task.pct >= 30
      ? 'var(--orange)' // Orange: in progress
      : 'var(--red)';   // Red: low progress

  return (
    <div className="task-row" role="listitem">

      {/* Avatar circle with initial letter */}
      <div
        className="task-row__avatar"
        style={{ background: color }}
        aria-hidden="true"
      >
        {task.initial}
      </div>

      {/* Task name — truncated if too long */}
      <span className="task-row__name" title={task.label}>
        {task.label}
      </span>

      {/* Progress percentage */}
      <span className="task-row__pct">
        {task.pct}%
      </span>

      {/* Status dot */}
      <div
        className="task-row__status"
        style={{ background: statusColor }}
        aria-label={`Status: ${statusColor === 'var(--green)' ? 'on track' : 'needs attention'}`}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   buildTaskData — transforms goals API response into task rows
───────────────────────────────────────────────────────────── */
/**
 * Converts goals API data into a flat array of task display objects.
 * Falls back to demo data when goals are not available.
 * @param {object|null} goals - Goals response from API
 * @returns {Array<{ id, label, pct, initial }>}
 */
function buildTaskData(goals) {
  /* Use real goals data if available */
  if (goals?.goals?.length) {
    return goals.goals.slice(0, 5).map(goal => ({
      id:      goal.id || goal._id,                       // Unique identifier
      label:   goal.goal_name || goal.title || 'Untitled',// Display name
      pct:     goal.progress_pct || 0,                    // Progress percentage
      initial: (goal.goal_name || 'G').charAt(0).toUpperCase(), // First letter
    }));
  }

  /* Fallback demo data — shown when API is unavailable */
  return [
    { id: 'd1', label: 'Build Portfolio Site', pct: 92, initial: 'P' },
    { id: 'd2', label: 'API Integration',      pct: 78, initial: 'A' },
    { id: 'd3', label: 'Mobile App UI',         pct: 45, initial: 'M' },
    { id: 'd4', label: 'Testing Suite',         pct: 30, initial: 'T' },
  ];
}