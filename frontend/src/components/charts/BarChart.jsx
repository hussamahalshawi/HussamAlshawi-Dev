/**
 * BarChart.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable animated bar chart — horizontal or vertical.
 * Bars animate in when scrolled into view via IntersectionObserver.
 *
 * Features:
 *   - direction: 'horizontal' (default) | 'vertical'
 *   - Animated fill on scroll
 *   - Optional value labels on bars
 *   - Glowing tip dot at bar end
 *   - 4 track size presets: xs | sm | md | lg
 *   - Theme-aware colors
 *
 * Usage:
 *   <BarChart
 *     data={[{ label: 'React', value: 90, color: '#4FC3F7' }]}
 *     direction="horizontal"
 *     size="sm"
 *     showValues
 *   />
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme }                              from '../../context/ThemeContext';
import {
  getChartTheme,
  CHART_SIZES,
  CHART_ANIMATION,
  createChartObserver,
  normalizeBarData,
} from '../../utils/chartConfig';
import '../../styles/charts/BarChart.css';

/**
 * BarChart — animated horizontal or vertical bar chart.
 *
 * @param {object}              props
 * @param {Array}               props.data         - [{ label, value, color }] — required
 * @param {'horizontal'|'vertical'} [props.direction] - Bar orientation
 * @param {'xs'|'sm'|'md'|'lg'} [props.size]       - Track height/width preset
 * @param {boolean}             [props.showValues]  - Show value labels on bars
 * @param {boolean}             [props.showLabels]  - Show axis labels (default true)
 * @param {number}              [props.maxValue]    - Override max for percentage calc
 * @param {string}              [props.className]   - Extra wrapper class
 * @param {string}              [props.emptyMessage]- Text when data is empty
 */
export default function BarChart({
  data         = [],
  direction    = 'horizontal',
  size         = 'sm',
  showValues   = true,
  showLabels   = true,
  maxValue,
  className    = '',
  emptyMessage = 'No data available.',
}) {

  /* ── Theme ── */
  const { isDark } = useTheme();
  const theme      = getChartTheme(isDark);

  /* ── Size config ── */
  const sizeConf = CHART_SIZES.bar[size] || CHART_SIZES.bar.sm;

  /* ── Refs ── */
  const containerRef           = useRef(null);           // Observe this for scroll trigger
  const [visible, setVisible]  = useState(false);       // Animation gate

  /* ── Normalize data ── */
  const bars = useMemo(() =>
    normalizeBarData(data, maxValue),                    // Consistent shape + auto colors
  [data, maxValue]);

  /* ── Intersection observer ── */
  useEffect(() => {
    return createChartObserver(
      containerRef.current,
      () => setVisible(true),
      CHART_ANIMATION.threshold
    );
  }, []);

  /* ── Empty state ── */
  if (!bars.length) {
    return (
      <div className={`bar-chart bar-chart--empty ${className}`.trim()}>
        <span className="bar-chart__empty-msg">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bar-chart bar-chart--${direction} ${className}`.trim()}
      role="list"
      aria-label="Bar chart"
    >
      {bars.map((bar, i) => (
        <div
          key={`bar-${i}`}
          className="bar-chart__row"
          role="listitem"
          aria-label={`${bar.label}: ${bar.value}`}
        >

          {/* ── Label column ── */}
          {showLabels && (
            <span className="bar-chart__label" title={bar.label}>
              {bar.label}
            </span>
          )}

          {/* ── Track + fill ── */}
          <div
            className="bar-chart__track"
            style={{ height: `${sizeConf.trackH}px` }}              // Preset track height
          >
            <div
              className="bar-chart__fill"
              style={{
                /* Width animates from 0 → pct% when visible */
                width:           visible ? `${bar.pct}%` : '0%',
                background:      `linear-gradient(90deg, ${bar.color}, ${bar.color}cc)`, // Slight fade at end
                transition:      visible
                  ? `width ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * CHART_ANIMATION.staggerDelay}ms`
                  : 'none',
                '--bar-color':   bar.color,                          // CSS var for tip dot glow
              }}
              role="progressbar"
              aria-valuenow={bar.value}
              aria-valuemin={0}
              aria-valuemax={maxValue || 100}
              aria-label={`${bar.label}: ${bar.value}`}
            />
          </div>

          {/* ── Value label ── */}
          {showValues && (
            <span
              className="bar-chart__value"
              style={{ color: bar.color }}                           // Match bar color
            >
              {bar.value}%
            </span>
          )}

        </div>
      ))}
    </div>
  );
}