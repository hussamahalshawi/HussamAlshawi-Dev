/**
 * StatCard.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable KPI / statistic card with count-up animation.
 * Used in Overview, Analytics, and any section needing
 * a highlighted metric.
 *
 * Usage:
 *   <StatCard value={42} label="Projects" icon="⊡" color={CHART_COLORS[1]} />
 *   <StatCard value={92} label="Score" suffix="%" color="#4FC3F7" />
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect } from 'react';
import {
  CHART_ANIMATION,
  createChartObserver,
  animateCountUp,
} from '../../utils/chartConfig';
import '../../styles/charts/StatCard.css';

/**
 * StatCard — animated KPI metric card.
 *
 * @param {number}  props.value       - Numeric value to count up to
 * @param {string}  props.label       - Card description label
 * @param {string}  [props.icon]      - Emoji or symbol
 * @param {string}  [props.color]     - Accent color for number + glow
 * @param {string}  [props.prefix]    - Text before number (e.g. "$")
 * @param {string}  [props.suffix]    - Text after number (e.g. "+", "%")
 * @param {number}  [props.delay]     - ms delay before count-up starts
 * @param {'sm'|'md'|'lg'} [props.size] - Card size preset
 * @param {string}  [props.className] - Extra wrapper class
 */
export default function StatCard({
  value     = 0,
  label     = '',
  icon      = '',
  color     = 'var(--cyan)',
  prefix    = '',
  suffix    = '',
  delay     = 0,
  size      = 'md',
  className = '',
}) {

  /* ── Refs ── */
  const cardRef = useRef(null);    // For IntersectionObserver
  const numRef  = useRef(null);    // For direct DOM count-up update

  /* ── Count-up on scroll into view ── */
  useEffect(() => {
    /* Observe card — start count-up when visible */
    return createChartObserver(
      cardRef.current,
      () => animateCountUp(numRef.current, value, delay, CHART_ANIMATION.countUpDuration),
      CHART_ANIMATION.threshold
    );
  }, [value, delay]);

  return (
    <div
      ref={cardRef}
      className={`stat-card stat-card--${size} ${className}`.trim()}
      style={{ '--stat-color': color }}                      // CSS var for glow + number color
      role="figure"
      aria-label={`${label}: ${value}${suffix}`}
    >

      {/* Bottom-right radial glow blob */}
      <div className="stat-card__glow" aria-hidden="true" />

      {/* Top gloss line */}
      <div className="stat-card__gloss" aria-hidden="true" />

      {/* ── Icon ── */}
      {icon && (
        <div className="stat-card__icon" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* ── Number row: prefix + animated count + suffix ── */}
      <div className="stat-card__num-row">
        {prefix && (
          <span className="stat-card__prefix" style={{ color }}>
            {prefix}
          </span>
        )}

        {/* Count-up target — updated directly by animateCountUp */}
        <span
          ref={numRef}
          className="stat-card__num"
          style={{ color }}
          aria-live="polite"
        >
          0
        </span>

        {suffix && (
          <span className="stat-card__suffix" style={{ color }}>
            {suffix}
          </span>
        )}
      </div>

      {/* ── Label ── */}
      <div className="stat-card__label">
        {label}
      </div>
    </div>
  );
}