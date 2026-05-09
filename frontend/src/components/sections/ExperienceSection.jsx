/**
 * ExperienceSection.jsx — Work Experience Timeline
 * ─────────────────────────────────────────────────────────
 * Renders a vertical timeline of career experience entries.
 * Each entry shows: role, company, date range, description,
 * and technology badges.
 * Data is fetched internally from the experience API.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';                // State and lifecycle
import Badge                   from '../ui/Badge';           // Reusable badge component
import { SkeletonTimelineItem } from '../ui/SkeletonLoader'; // Loading skeleton
import { formatDateRange }     from '../../utils/formatters'; // Date formatting
import apiClient               from '../../services/api';    // Central Axios instance
import '../../styles/components/ExperienceSection.css';      // Component styles

/**
 * ExperienceSection — career timeline section.
 * Fetches experience data internally on mount.
 */
export default function ExperienceSection() {
  const [experience, setExperience] = useState(null);       // Experience data from API
  const [loading,    setLoading]    = useState(true);        // Loading state
  const [error,      setError]      = useState(null);        // Error state

  // ── Fetch experience on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;                                   // Prevent stale updates

    async function fetchExperience() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get('/portfolio/experience'); // GET /portfolio/experience
        if (!cancelled) setExperience(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load experience.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchExperience();
    return () => { cancelled = true; };                      // Cleanup on unmount
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <section id="experience" className="section">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Career</span>
            <h2 className="s-title">Experience</h2>
          </div>
          <div className="timeline">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonTimelineItem key={i} />              // 3 skeleton placeholders
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <section id="experience" className="section">
        <div className="container">
          <p style={{ color: 'var(--text-muted)' }}>Experience data unavailable.</p>
        </div>
      </section>
    );
  }

  const entries = experience?.experience || [];             // Extract experience array

  return (
    <section id="experience" className="section section--alt">
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Career</span>
          <h2 className="s-title">Experience</h2>
          <p className="s-sub">
            {entries.length} professional roles across my career
          </p>
        </div>

        {/* ── Timeline ── */}
        <div className="timeline">
          {entries.map((entry, index) => (
            <ExperienceEntry
              key={entry.id || index}
              entry={entry}
              isLast={index === entries.length - 1}        // Style last item differently
            />
          ))}
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
            No experience entries configured yet.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * ExperienceEntry — single timeline card with left accent line.
 * @param {{ entry: object, isLast: boolean }} props
 */
function ExperienceEntry({ entry, isLast }) {
  const dateRange = formatDateRange(                        // e.g. "2021 — Present"
    entry.start_date,
    entry.end_date,
    entry.is_current
  );

  return (
    <div className={`timeline__item ${isLast ? 'timeline__item--last' : ''}`}>

      {/* ── Left: timeline dot and line ── */}
      <div className="timeline__marker">
        <div className="timeline__dot" />                  {/* Pulsing dot */}
        {!isLast && <div className="timeline__line" />}    {/* Vertical connector */}
      </div>

      {/* ── Right: content card ── */}
      <div className="timeline__content">

        {/* Date range badge */}
        <div className="timeline__date">{dateRange}</div>

        {/* Role title */}
        <h3 className="timeline__title">{entry.job_title || entry.title}</h3>

        {/* Company name */}
        <div className="timeline__company">
          {entry.company_name}
          {entry.location && (
            <span className="timeline__location"> · {entry.location}</span>
          )}
          {entry.is_current && (
            <Badge label="Current" variant="lime" className="timeline__badge" />
          )}
        </div>

        {/* Description */}
        {entry.description && (
          <p className="timeline__desc">{entry.description}</p>
        )}

        {/* Responsibilities list */}
        {entry.responsibilities?.length > 0 && (
          <ul className="timeline__list">
            {entry.responsibilities.slice(0, 3).map((item, i) => ( // Max 3 items
              <li key={i} className="timeline__list-item">{item}</li>
            ))}
          </ul>
        )}

        {/* Tech stack tags */}
        {entry.technologies?.length > 0 && (
          <div className="timeline__tags">
            {entry.technologies.map(tech => (
              <Badge key={tech} label={tech} variant="muted" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}