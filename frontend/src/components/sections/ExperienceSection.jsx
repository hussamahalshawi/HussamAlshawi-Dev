/**
 * ExperienceSection.jsx — Work Experience Timeline
 * ─────────────────────────────────────────────────────────
 * Features:
 * - Vertical timeline with glowing cyan dots + connector lines
 * - Glass content cards with left accent bar + hover slide
 * - IntersectionObserver for staggered entrance animation
 * - Role, company, date, description, responsibilities, tech tags
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import Badge                           from '../ui/Badge';
import { SkeletonTimelineItem }        from '../ui/SkeletonLoader';
import { formatDateRange }             from '../../utils/formatters';
import apiClient                       from '../../services/api';
import '../../styles/components/ExperienceSection.css';

export default function ExperienceSection() {

  const [experience, setExperience] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const timelineRef                 = useRef(null); /* Ref for stagger observer */

  /* ── Fetch on mount ───────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function fetchExperience() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.get('/portfolio/experience');
        if (!cancelled) setExperience(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load experience.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchExperience();
    return () => { cancelled = true; };
  }, []);

  /* ── Stagger entrance via IntersectionObserver ────────────────── */
  useEffect(() => {
    if (!timelineRef.current || loading) return;

    const items = timelineRef.current.querySelectorAll('.timeline__item');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    /* Set initial hidden state then observe */
    items.forEach((item, i) => {
      item.style.opacity    = '0';
      item.style.transform  = 'translateY(20px)';
      item.style.transition = `opacity 0.55s ease ${i * 80}ms, transform 0.55s ease ${i * 80}ms`;
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, [loading, experience]);

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <section id="experience" className="section section--alt">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Career</span>
            <h2 className="s-title">Experience</h2>
          </div>
          <div className="timeline">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonTimelineItem key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Error ────────────────────────────────────────────────────── */
  if (error) {
    return (
      <section id="experience" className="section section--alt">
        <div className="container">
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
            Experience data unavailable.
          </p>
        </div>
      </section>
    );
  }

  const entries = experience?.experience || [];

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
        <div className="timeline" ref={timelineRef}>
          {entries.map((entry, index) => (
            <ExperienceEntry
              key={entry.id || index}
              entry={entry}
              isLast={index === entries.length - 1}
            />
          ))}
        </div>

        {entries.length === 0 && (
          <p style={{
            color:      'var(--text-muted)',
            textAlign:  'center',
            padding:    '3rem 0',
            fontFamily: 'var(--font-mono)',
            fontSize:   '0.82rem',
          }}>
            No experience entries configured yet.
          </p>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   ExperienceEntry — single timeline item
───────────────────────────────────────────────────────────── */
/**
 * @param {{ entry: object, isLast: boolean }} props
 */
function ExperienceEntry({ entry, isLast }) {

  const dateRange = formatDateRange(
    entry.start_date,
    entry.end_date,
    entry.is_current
  );

  /* Mark past roles for muted dot style */
  const isPast = !entry.is_current;

  return (
    <div className={`timeline__item ${isLast ? 'timeline__item--last' : ''} ${isPast ? 'timeline__item--past' : ''}`}>

      {/* ── Left: dot + line ── */}
      <div className="timeline__marker" aria-hidden="true">
        <div className="timeline__dot" />
        {!isLast && <div className="timeline__line" />}
      </div>

      {/* ── Right: glass content card ── */}
      <div className="timeline__content">

        {/* Date */}
        <div className="timeline__date">{dateRange}</div>

        {/* Role title */}
        <h3 className="timeline__title">
          {entry.job_title || entry.title}
        </h3>

        {/* Company + location + badge */}
        <div className="timeline__company">
          <span>{entry.company_name}</span>
          {entry.location && (
            <span className="timeline__location">· {entry.location}</span>
          )}
          {entry.is_current && (
            <Badge label="Current" variant="lime" className="timeline__badge" />
          )}
        </div>

        {/* Description */}
        {entry.description && (
          <p className="timeline__desc">{entry.description}</p>
        )}

        {/* Responsibilities — max 3 */}
        {entry.responsibilities?.length > 0 && (
          <ul className="timeline__list">
            {entry.responsibilities.slice(0, 3).map((item, i) => (
              <li key={i} className="timeline__list-item">{item}</li>
            ))}
          </ul>
        )}

        {/* Tech stack badges */}
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