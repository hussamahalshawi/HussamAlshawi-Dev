/**
 * RadarChart.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable SVG radar / spider chart component.
 * Pure SVG — no external library.
 *
 * Features:
 *   - Animated polygon fill on scroll
 *   - Theme-aware grid + labels
 *   - 3 size presets: sm | md | lg
 *   - Optional legend below chart
 *   - Configurable rings count
 *
 * Usage:
 *   <RadarChart
 *     axes={[{ label: 'Frontend', value: 82 }]}
 *     size="md"
 *     showLegend
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
  getRadarPoints,
  getChartColor,
} from '../../utils/chartConfig';
import '../../styles/charts/RadarChart.css';

/**
 * RadarChart — animated SVG spider/radar chart.
 *
 * @param {object}          props
 * @param {Array}           props.axes        - [{ label, value }] min 3 items — required
 * @param {number}          [props.maxValue]  - Max axis value (default 100)
 * @param {'sm'|'md'|'lg'}  [props.size]      - Size preset
 * @param {number}          [props.rings]     - Grid ring count (default 4)
 * @param {boolean}         [props.showLegend]- Show legend rows
 * @param {string}          [props.fillColor] - Polygon fill color (default cyan)
 * @param {string}          [props.className] - Extra wrapper class
 */
export default function RadarChart({
  axes       = [],
  maxValue   = 100,
  size       = 'md',
  rings      = 4,
  showLegend = false,
  fillColor,
  className  = '',
}) {

  /* ── Theme ── */
  const { isDark } = useTheme();
  const theme      = getChartTheme(isDark);

  /* ── Size config ── */
  const sizeConf = CHART_SIZES.radar[size] || CHART_SIZES.radar.md;

  /* ── Animation state ── */
  const wrapRef              = useRef(null);
  const [visible, setVisible] = useState(false);

  /* ── Geometry ── */
  const geometry = useMemo(() =>
    getRadarPoints(axes, sizeConf, rings, maxValue),                 // All SVG geometry
  [axes, sizeConf, rings, maxValue]);

  /* ── Intersection observer ── */
  useEffect(() => {
    return createChartObserver(
      wrapRef.current,
      () => setVisible(true),
      CHART_ANIMATION.threshold
    );
  }, []);

  /* ── Fallback: not enough axes ── */
  if (!geometry || axes.length < 3) {
    return (
      <div className={`radar-chart radar-chart--empty ${className}`.trim()}>
        <span className="radar-chart__empty-msg">
          Radar requires 3+ categories
        </span>
      </div>
    );
  }

  const { ringPolygons, axisLines, dataPoints, dataPolygon, labels } = geometry;

  /* ── Colors ── */
  const polyFill   = fillColor || 'var(--cyan)';           // Polygon stroke color
  const polyFillBg = fillColor
    ? `${fillColor}22`                                      // 13% opacity fill
    : 'var(--cyan-dim)';                                   // Theme-aware dim

  return (
    <div
      ref={wrapRef}
      className={`radar-chart ${className}`.trim()}
      aria-label="Radar chart showing category averages"
    >

      {/* ── SVG ── */}
      <svg
        className="radar-chart__svg"
        viewBox={sizeConf.viewBox}
        role="img"
        aria-label="Spider radar chart"
        overflow="visible"                                   // Labels can exceed viewBox
      >
        <defs>
          {/* Radial gradient fill for the data polygon */}
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={polyFill} stopOpacity="0.30" />
            <stop offset="100%" stopColor={polyFill} stopOpacity="0.04" />
          </radialGradient>
        </defs>

        {/* ── Grid rings ── */}
        {ringPolygons.map((pts, i) => (
          <polygon
            key={`ring-${i}`}
            points={pts}
            fill="none"
            stroke={theme.grid}                              // Theme-aware ring color
            strokeWidth="1"
          />
        ))}

        {/* ── Axis lines ── */}
        {axisLines.map((axis, i) => (
          <line
            key={`axis-${i}`}
            x1={axis.x1} y1={axis.y1}
            x2={axis.x2} y2={axis.y2}
            stroke={theme.axis}                              // Theme-aware axis color
            strokeWidth="1"
          />
        ))}

        {/* ── Data polygon fill area ── */}
        <polygon
          points={dataPolygon}
          fill="url(#radarFill)"
          stroke={polyFill}
          strokeWidth="2"
          opacity={visible ? 1 : 0}                         // Fade in on reveal
          style={{
            transition: visible
              ? `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} 0.3s`
              : 'none',
          }}
        />

        {/* ── Vertex dots ── */}
        {dataPoints.map((pt, i) => (
          <circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill={polyFill}
            filter={`drop-shadow(0 0 4px ${polyFill})`}
            opacity={visible ? 1 : 0}                       // Stagger dot appearance
            style={{
              transition: visible
                ? `opacity 0.4s ease ${0.5 + i * 0.08}s`
                : 'none',
            }}
          />
        ))}

        {/* ── Axis labels ── */}
        {labels.map((lbl, i) => (
          <text
            key={`lbl-${i}`}
            x={lbl.x}
            y={lbl.y}
            fill={theme.label}                               // Theme-aware label color
            fontSize="6.5"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="0.04em"
            style={{ textTransform: 'uppercase' }}
          >
            {/* Truncate very long labels */}
            {lbl.label.length > 10 ? `${lbl.label.slice(0, 10)}…` : lbl.label}
          </text>
        ))}

        {/* ── Score labels at mid-axis ── */}
        {labels.map((lbl, i) => {
          const midR  = (sizeConf.maxR / 2) * 0.9;          // Mid-axis radius
          const angle = (360 / axes.length) * i;             // Axis angle
          /* Inline polar→xy for mid-axis label */
          const rad   = ((angle - 90) * Math.PI) / 180;
          const mx    = sizeConf.cx + midR * Math.cos(rad);
          const my    = sizeConf.cy + midR * Math.sin(rad);
          return (
            <text
              key={`score-${i}`}
              x={mx}
              y={my}
              fill={theme.labelMuted}                        // Very muted score labels
              fontSize="5.5"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {lbl.value}
            </text>
          );
        })}
      </svg>

      {/* ── Legend ── */}
      {showLegend && (
        <div className="radar-chart__legend" role="list">
          {axes.map((axis, i) => (
            <div key={axis.label} className="radar-chart__legend-item" role="listitem">
              <span
                className="radar-chart__legend-dot"
                style={{ background: getChartColor(i) }}
                aria-hidden="true"
              />
              <span className="radar-chart__legend-label">{axis.label}</span>
              <span
                className="radar-chart__legend-val"
                style={{ color: getChartColor(i) }}
              >
                {axis.value}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}