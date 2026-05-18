/**
 * DonutChart.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable SVG donut / pie chart component.
 * Pure SVG — no external charting library required.
 *
 * Features:
 *   - Animated segments on scroll (IntersectionObserver)
 *   - Theme-aware (dark / light via ThemeContext)
 *   - Optional center label + value
 *   - Optional legend below chart
 *   - 4 size presets: xs | sm | md | lg
 *   - Gap between segments for clean separation
 *
 * Usage:
 *   <DonutChart
 *     data={[{ label: 'Expert', value: 12, color: '#C8FF57' }]}
 *     centerValue={42}
 *     centerLabel="Total"
 *     size="md"
 *     showLegend
 *   />
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useMemo } from 'react';        // React hooks
import { useTheme }                              from '../../context/ThemeContext'; // Dark/light mode
import {
  getDonutSegments,   // Converts data → SVG arc descriptors
  getChartTheme,      // Returns theme-aware color map
  CHART_SIZES,        // Size presets for donut
  CHART_ANIMATION,    // Timing constants
  createChartObserver,// IntersectionObserver factory
  buildLegend,        // Legend data builder
} from '../../utils/chartConfig';
import '../../styles/charts/DonutChart.css'; // Component styles

/* ── Prop defaults ─────────────────────────────────────── */
const DEFAULT_CENTER_LABEL = 'Total'; // Fallback center sub-label
const DEFAULT_SIZE         = 'md';    // Default size preset

/**
 * DonutChart — animated SVG donut chart.
 *
 * @param {object}        props
 * @param {Array}         props.data          - [{ label, value, color }] — required
 * @param {number}        [props.total]        - Override total (default: sum of values)
 * @param {string|number} [props.centerValue]  - Large text in center (default: total)
 * @param {string}        [props.centerLabel]  - Small text below centerValue
 * @param {boolean}       [props.showLegend]   - Show legend rows below chart
 * @param {'xs'|'sm'|'md'|'lg'} [props.size]  - Size preset
 * @param {number}        [props.gapDeg]       - Degrees of gap between segments (default 2)
 * @param {string}        [props.className]    - Extra CSS class for wrapper
 * @param {string}        [props.title]        - Accessible SVG title
 */
export default function DonutChart({
  data         = [],
  total,
  centerValue,
  centerLabel  = DEFAULT_CENTER_LABEL,
  showLegend   = false,
  size         = DEFAULT_SIZE,
  gapDeg       = 2,
  className    = '',
  title        = 'Donut chart',
}) {

  /* ── Theme ── */
  const { isDark } = useTheme();                                     // Read current theme
  const theme      = getChartTheme(isDark);                          // Get color map

  /* ── Size config ── */
  const sizeConf = CHART_SIZES.donut[size] || CHART_SIZES.donut.md; // Fall back to md

  /* ── Animation state ── */
  const wrapRef              = useRef(null);                         // Ref for observer
  const [visible, setVisible] = useState(false);                    // Controls animation trigger

  /* ── Computed values ── */
  const safeTotal = useMemo(() =>
    total || data.reduce((s, d) => s + (d.value || 0), 0),          // Auto-sum if no total prop
  [data, total]);

  const displayCenter = centerValue ?? safeTotal;                    // What to show in center

  /* ── SVG geometry ── */
  const segments = useMemo(() =>
    getDonutSegments(data, sizeConf.size / 2 - sizeConf.stroke / 2, gapDeg), // Radius = size/2 - stroke/2
  [data, sizeConf, gapDeg]);

  /* ── Legend data ── */
  const legend = useMemo(() =>
    showLegend ? buildLegend(data, safeTotal) : [],                  // Only build if needed
  [data, safeTotal, showLegend]);

  /* ── Intersection observer — animate on scroll ── */
  useEffect(() => {
    return createChartObserver(                                       // Returns cleanup fn
      wrapRef.current,                                               // Target element
      () => setVisible(true),                                        // On reveal: trigger animation
      CHART_ANIMATION.threshold                                      // 12% visible threshold
    );
  }, []);                                                            // Run once on mount

  /* ── SVG dimensions ── */
  const svgSize = sizeConf.size;                                     // Total SVG width/height
  const cx      = svgSize / 2;                                       // Center X
  const cy      = svgSize / 2;                                       // Center Y
  const radius  = cx - sizeConf.stroke / 2;                         // Ring radius

  return (
    <div
      ref={wrapRef}
      className={`donut-chart ${className}`.trim()}
      aria-label={title}
    >

      {/* ── SVG Ring ── */}
      <div
        className="donut-chart__svg-wrap"
        style={{ width: svgSize, height: svgSize }}                  // Fixed dimensions
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          role="img"
          aria-label={title}
          style={{ transform: 'rotate(-90deg)' }}                    // Start segments at 12 o'clock
        >
          {/* Accessible title for screen readers */}
          <title>{title}</title>

          {/* Background track ring — full circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={theme.track}                                     // Theme-aware track color
            strokeWidth={sizeConf.stroke}
          />

          {/* Colored segments — one per data item */}
          {segments.map((seg, i) => (
            <circle
              key={`seg-${i}`}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}                                     // Segment color from data
              strokeWidth={sizeConf.stroke}
              strokeDasharray={`${visible ? seg.dashArr : 0} ${2 * Math.PI * radius}`} // Animate from 0
              strokeDashoffset={seg.dashOff}                         // Start position
              strokeLinecap="butt"                                   // Clean segment edges
              style={{
                transition: visible
                  ? `stroke-dasharray ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * CHART_ANIMATION.staggerDelay}ms`
                  : 'none',                                          // Staggered entry per segment
              }}
              aria-label={`${seg.label}: ${seg.displayPct}%`}
            />
          ))}
        </svg>

        {/* ── Center overlay — absolute over SVG ── */}
        <div
          className="donut-chart__center"
          style={{ transform: 'rotate(0deg)' }}                      // Counter-rotate (SVG is -90deg)
          aria-hidden="true"
        >
          {/* Large center number / value */}
          <div
            className="donut-chart__center-num"
            style={{ fontSize: sizeConf.centerFontSize }}            // Size-responsive font
          >
            {displayCenter}
          </div>

          {/* Small center label */}
          <div className="donut-chart__center-sub">
            {centerLabel}
          </div>
        </div>
      </div>

      {/* ── Legend rows ── */}
      {showLegend && legend.length > 0 && (
        <div
          className="donut-chart__legend"
          role="list"
          aria-label="Chart legend"
        >
          {legend.map((item, i) => (
            <div
              key={`leg-${i}`}
              className="donut-chart__legend-row"
              role="listitem"
            >
              {/* Color dot */}
              <span
                className="donut-chart__legend-dot"
                style={{
                  background: item.color,                            // Match segment color
                  boxShadow:  `0 0 6px ${item.color}55`,            // Subtle glow
                }}
                aria-hidden="true"
              />

              {/* Label text */}
              <span className="donut-chart__legend-label">
                {item.label}
              </span>

              {/* Count value */}
              <span
                className="donut-chart__legend-count"
                style={{ color: item.color }}                        // Colored count
              >
                {item.count}
              </span>

              {/* Percentage */}
              <span className="donut-chart__legend-pct">
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}