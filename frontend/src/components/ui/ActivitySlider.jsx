/**
 * ActivitySlider.jsx
 * ─────────────────────────────────────────────────────────
 * Team Activity panel — shows one activity at a time
 * with animated slide transitions and dot navigation.
 * Data: uses static activity entries (can be extended
 * to fetch from API in the future).
 * Theme-aware: all colors via CSS variables.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';  // State + lifecycle hooks
import '../../styles/components/ActivitySlider.css';        // Component styles

/* ── Static activity feed entries ────────────────────────────── */
// These represent recent developer actions — can be fetched from API later
const DEFAULT_ACTIVITIES = [
  {
    id:       1,
    initials: 'HA',
    text:     'Updated portfolio backend API endpoints',
    time:     '2m ago',
    color:    'var(--cyan)',
  },
  {
    id:       2,
    initials: 'HA',
    text:     'Pushed new SkillsSection glassmorphism update',
    time:     '18m ago',
    color:    'var(--green)',
  },
  {
    id:       3,
    initials: 'HA',
    text:     'Deployed frontend build to production server',
    time:     '1h ago',
    color:    'var(--orange)',
  },
  {
    id:       4,
    initials: 'HA',
    text:     'Completed MongoDB Atlas schema migration',
    time:     '3h ago',
    color:    'var(--gold)',
  },
  {
    id:       5,
    initials: 'HA',
    text:     'Resolved CORS configuration on Flask backend',
    time:     '5h ago',
    color:    'var(--violet)',
  },
];

/* ── Auto-advance interval in milliseconds ─────────────────────── */
const AUTO_ADVANCE_MS = 5000;   // Move to next slide every 5 seconds

/**
 * @param {object}        props
 * @param {Array|null}    props.activities - Optional custom activities array
 */
export default function ActivitySlider({ activities = null }) {

  /* ── Use provided activities or fall back to defaults ─────────── */
  const items = activities?.length ? activities : DEFAULT_ACTIVITIES;

  /* ── Current visible slide index ──────────────────────────────── */
  const [current,    setCurrent]    = useState(0);   // Index of active slide
  const [isAnimating, setAnimating] = useState(false); // Lock during transition

  /* ── Navigate to a specific slide index ───────────────────────── */
  const goTo = useCallback((index) => {
    if (isAnimating) return;                           // Ignore clicks during animation
    setAnimating(true);                                // Lock navigation
    setCurrent(index);                                 // Set new active index
    setTimeout(() => setAnimating(false), 350);        // Unlock after animation completes
  }, [isAnimating]);

  /* ── Go to next slide (wraps around) ──────────────────────────── */
  const goNext = useCallback(() => {
    goTo((current + 1) % items.length);               // Wrap to 0 after last item
  }, [current, items.length, goTo]);

  /* ── Go to previous slide (wraps around) ──────────────────────── */
  const goPrev = useCallback(() => {
    goTo((current - 1 + items.length) % items.length); // Wrap to last after first
  }, [current, items.length, goTo]);

  /* ── Auto-advance every AUTO_ADVANCE_MS ms ─────────────────────── */
  useEffect(() => {
    const timer = setInterval(goNext, AUTO_ADVANCE_MS); // Set up interval
    return () => clearInterval(timer);                   // Cleanup on unmount or re-run
  }, [goNext]);                                          // Re-run when goNext changes

  /* ── Current slide data ────────────────────────────────────────── */
  const activeItem = items[current];

  return (
    <div className="activity-slider">

      {/* ── Panel header with nav controls ── */}
      <div className="activity-slider__header">
        <span className="activity-slider__title">Team Activity</span>

        {/* Navigation: prev button + dots + next button */}
        <div className="activity-slider__nav" role="group" aria-label="Slide navigation">

          {/* Previous button */}
          <button
            className="slider-nav-btn"
            onClick={goPrev}
            aria-label="Previous activity"
            disabled={isAnimating}
          >
            ‹
          </button>

          {/* Dot indicators */}
          <div className="slider-dots" role="tablist" aria-label="Activity slides">
            {items.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === current ? 'slider-dot--active' : ''}`}
                onClick={() => goTo(index)}
                role="tab"
                aria-selected={index === current}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            className="slider-nav-btn"
            onClick={goNext}
            aria-label="Next activity"
            disabled={isAnimating}
          >
            ›
          </button>
        </div>

        {/* Three-dot menu */}
        <button className="activity-slider__menu" aria-label="Activity options">···</button>
      </div>

      {/* ── Slide content ── */}
      <div
        className={`activity-slider__content ${isAnimating ? 'activity-slider__content--animating' : ''}`}
        key={current}                                   // Key change triggers re-mount animation
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Avatar with gradient background */}
        <div
          className="activity-slider__avatar"
          style={{
            background: `linear-gradient(135deg, ${activeItem.color}, var(--blue))`,
          }}
          aria-hidden="true"
        >
          {activeItem.initials}
        </div>

        {/* Activity description text */}
        <p className="activity-slider__text">
          {activeItem.text}
        </p>

        {/* Time stamp */}
        <span className="activity-slider__time">
          {activeItem.time}
        </span>
      </div>
    </div>
  );
}