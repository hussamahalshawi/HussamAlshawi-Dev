/**
 * ProgressBar.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable animated progress bar.
 * Auto-colors from skill band if no color is provided.
 *
 * Usage:
 *   <ProgressBar value={85} label="React" showValue />
 *   <ProgressBar value={60} color="#9B7FEA" label="DevOps" />
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState } from 'react';
import {
  CHART_ANIMATION,
  createChartObserver,
  getColorForValue,
} from '../../utils/chartConfig';
import '../../styles/charts/ProgressBar.css';

/**
 * ProgressBar — single animated horizontal bar.
 *
 * @param {number}  props.value       - 0–100
 * @param {string}  [props.label]     - Left label
 * @param {string}  [props.color]     - Override color (auto from band if omitted)
 * @param {boolean} [props.showValue] - Show percentage on right
 * @param {boolean} [props.showBand]  - Show band label (Expert / Advanced…)
 * @param {'xs'|'sm'|'md'|'lg'} [props.size] - Track height preset
 * @param {string}  [props.className] - Extra wrapper class
 */
export default function ProgressBar({
  value      = 0,
  label      = '',
  color,
  showValue  = true,
  showBand   = false,
  size       = 'sm',
  className  = '',
}) {

  /* ── Resolve color ── */
  const barColor = color || getColorForValue(value);       // Auto-color from skill band

  /* ── Animation ── */
  const barRef              = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return createChartObserver(
      barRef.current,
      () => setVisible(true),
      CHART_ANIMATION.threshold
    );
  }, []);

  /* ── Track height from size preset ── */
  const trackHeights = { xs: 3, sm: 4, md: 6, lg: 8 };
  const trackH       = trackHeights[size] || 4;

  return (
    <div
      ref={barRef}
      className={`progress-bar progress-bar--${size} ${className}`.trim()}
      aria-label={`${label}: ${value}%`}
    >

      {/* ── Label row ── */}
      {(label || showBand) && (
        <div className="progress-bar__header">
          {label && (
            <span className="progress-bar__label" title={label}>
              {label}
            </span>
          )}
          {showBand && (
            <span
              className="progress-bar__band"
              style={{ color: barColor, borderColor: `${barColor}55` }}
            >
              {value >= 80 ? 'Expert' : value >= 60 ? 'Advanced' : value >= 40 ? 'Intermediate' : 'Beginner'}
            </span>
          )}
        </div>
      )}

      {/* ── Track + fill + value ── */}
      <div className="progress-bar__row">

        {/* Track */}
        <div
          className="progress-bar__track"
          style={{ height: `${trackH}px` }}
        >
          {/* Animated fill */}
          <div
            className="progress-bar__fill"
            style={{
              width:       visible ? `${Math.min(value, 100)}%` : '0%',
              background:  `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
              transition:  visible
                ? `width ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing}`
                : 'none',
              '--bar-color': barColor,
            }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Value */}
        {showValue && (
          <span
            className="progress-bar__value"
            style={{ color: barColor }}
          >
            {value}%
          </span>
        )}
      </div>
    </div>
  );
}