/**
 * chartConfig.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for ALL chart-related configuration.
 * Covers: colors, sizes, animation timings, axis formatting,
 * theme-aware helpers, and shared pure utility functions.
 *
 * Import pattern:
 *   import { CHART_THEME, getSegments, formatChartValue } from '@/utils/chartConfig';
 * ─────────────────────────────────────────────────────────
 */

import { CHART_COLORS, SKILL_BANDS } from './constants'; // Reuse existing palette + band config

/* ══════════════════════════════════════════════════════════
   1. THEME-AWARE COLOR MAPS
   Call getChartTheme(isDark) to get the correct set.
   isDark comes from useTheme() in consuming components.
══════════════════════════════════════════════════════════ */

/** Dark mode chart colors */
const DARK_THEME = {
  grid:        'rgba(255,255,255,0.07)',   // Faint grid lines on dark bg
  axis:        'rgba(255,255,255,0.10)',   // Axis lines slightly brighter
  label:       '#8BA3C4',                  // Secondary text — muted blue
  labelMuted:  '#4A6080',                  // Very muted — ring numbers, etc.
  track:       'rgba(255,255,255,0.07)',   // Background track for bars/rings
  fill:        'rgba(79,195,247,0.15)',    // Default fill area (line charts)
  stroke:      '#4FC3F7',                  // Default stroke (line charts)
  tooltip: {
    bg:     'rgba(10,15,32,0.95)',         // Tooltip background
    border: 'rgba(79,195,247,0.30)',       // Tooltip border
    text:   '#E8EEF8',                     // Tooltip text
  },
};

/** Light mode chart colors */
const LIGHT_THEME = {
  grid:        'rgba(79,100,145,0.10)',    // Faint grid lines on light bg
  axis:        'rgba(79,100,145,0.14)',    // Axis lines
  label:       '#3d5a80',                  // Secondary text — readable blue
  labelMuted:  '#6b8aaa',                  // Muted — placeholders
  track:       'rgba(79,100,145,0.10)',   // Background track
  fill:        'rgba(26,143,199,0.12)',   // Default fill area
  stroke:      '#1a8fc7',                  // Default stroke
  tooltip: {
    bg:     'rgba(255,255,255,0.97)',      // Tooltip background
    border: 'rgba(26,143,199,0.30)',       // Tooltip border
    text:   '#1e2d42',                     // Tooltip text
  },
};

/**
 * getChartTheme — returns the correct color map for the current theme.
 * @param   {boolean} isDark - True when dark mode is active
 * @returns {object}         - Theme color map
 */
export function getChartTheme(isDark) {
  return isDark ? DARK_THEME : LIGHT_THEME; // Switch between dark and light maps
}

/* ══════════════════════════════════════════════════════════
   2. CHART SIZE PRESETS
   Consistent dimensions across all chart types.
   Access: CHART_SIZES.donut.md.size
══════════════════════════════════════════════════════════ */
export const CHART_SIZES = {

  /** Donut / Pie chart sizes */
  donut: {
    xs: { size: 80,  stroke: 7,  centerFontSize: '1rem'   }, // Tiny inline donut
    sm: { size: 100, stroke: 9,  centerFontSize: '1.2rem' }, // Small card donut
    md: { size: 130, stroke: 10, centerFontSize: '1.55rem'}, // Standard donut
    lg: { size: 180, stroke: 12, centerFontSize: '2rem'   }, // Large hero donut
  },

  /** Radar chart sizes */
  radar: {
    sm: { viewBox: '0 0 180 180', cx: 90,  cy: 90,  maxR: 65  }, // Small radar
    md: { viewBox: '0 0 220 220', cx: 110, cy: 110, maxR: 85  }, // Standard radar
    lg: { viewBox: '0 0 280 280', cx: 140, cy: 140, maxR: 110 }, // Large radar
  },

  /** Bar chart heights */
  bar: {
    xs: { trackH: 3, gap: 8  }, // Compact bar rows
    sm: { trackH: 4, gap: 10 }, // Standard bar rows
    md: { trackH: 6, gap: 14 }, // Medium bar rows
    lg: { trackH: 8, gap: 18 }, // Large bar rows
  },
};

/* ══════════════════════════════════════════════════════════
   3. ANIMATION CONFIG
   Centralized timing — change once, updates everywhere.
══════════════════════════════════════════════════════════ */
export const CHART_ANIMATION = {
  duration:      1200,   // ms — base animation duration
  staggerDelay:  80,     // ms — delay between staggered items (bars, dots)
  threshold:     0.12,   // IntersectionObserver ratio to trigger animation
  easing:        'cubic-bezier(0.16, 1, 0.3, 1)', // Spring ease for all transitions
  countUpDuration: 1300, // ms — count-up number animation duration
};

/* ══════════════════════════════════════════════════════════
   4. DONUT CHART HELPERS
   Pure functions — no side effects.
══════════════════════════════════════════════════════════ */

/**
 * getDonutSegments — converts raw data into SVG donut segment descriptors.
 * Each segment contains the SVG strokeDasharray and strokeDashoffset values
 * needed to render a proportional arc on a circle.
 *
 * @param   {Array}  items     - [{ label, value, color }]
 * @param   {number} radius    - SVG circle radius (from CHART_SIZES.donut)
 * @param   {number} [gapDeg]  - Degrees of gap between segments (default 2)
 * @returns {Array}            - Items enriched with { pct, dashArr, dashOff, midAngle }
 *
 * @example
 * const segments = getDonutSegments([
 *   { label: 'Expert', value: 12, color: '#C8FF57' },
 *   { label: 'Advanced', value: 8, color: '#00E5FF' },
 * ], 52);
 */
export function getDonutSegments(items, radius, gapDeg = 2) {
  if (!items || items.length === 0) return [];                              // Guard: no items
  if (!radius || !isFinite(radius)) return [];                              // Guard: invalid radius

  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  if (total === 0 || !isFinite(total)) return [];                           // Guard: empty or invalid total

  const circumf  = 2 * Math.PI * radius;                                    // Full circle length
  const gapFrac  = gapDeg / 360;                                            // Gap as fraction of circle
  const totalGap = gapFrac * items.length;                                   // Total gap fraction

  let cumulative = 0;                                                        // Running offset tracker

  return items.map(item => {
    const rawPct  = (Number(item.value) || 0) / total;                      // Raw fraction (0–1)
    const pct     = rawPct * (1 - totalGap);                                 // Adjusted for gaps
    const dashArr = pct * circumf;                                           // Arc length in SVG units
    const dashOff = circumf - (cumulative * circumf);                        // Start offset from top
    const midAngle = (cumulative + rawPct / 2) * 360 - 90;                  // Midpoint angle in degrees

    cumulative += rawPct + gapFrac;                                          // Advance offset

    return {
      ...item,            // Spread original item fields (label, value, color)
      pct: rawPct,        // Fraction of total (0–1) for legend percentages
      dashArr: isFinite(dashArr) ? dashArr : 0, // SVG strokeDasharray — safe fallback
      dashOff: isFinite(dashOff) ? dashOff : 0, // SVG strokeDashoffset — safe fallback
      midAngle,           // Midpoint angle — useful for tooltip positioning
      displayPct: Math.round(rawPct * 100), // Integer percentage for display
    };
  });
}

/* ══════════════════════════════════════════════════════════
   5. RADAR CHART HELPERS
   Geometry calculations for spider/radar SVG polygons.
══════════════════════════════════════════════════════════ */

/**
 * polarToXY — converts polar coordinates to SVG Cartesian coordinates.
 * SVG Y-axis is inverted, so we negate the cos component.
 *
 * @param   {number} angleDeg - Angle in degrees (0 = top/12 o'clock)
 * @param   {number} radius   - Distance from center
 * @param   {number} cx       - SVG center X
 * @param   {number} cy       - SVG center Y
 * @returns {{ x: number, y: number }}
 */
export function polarToXY(angleDeg, radius, cx, cy) {
  const rad = ((angleDeg - 90) * Math.PI) / 180; // Convert degrees to radians; -90 starts at top
  return {
    x: cx + radius * Math.cos(rad), // X: horizontal component
    y: cy + radius * Math.sin(rad), // Y: vertical component (SVG: positive = down)
  };
}

/**
 * getRadarPoints — builds all geometry for a radar chart.
 * Returns grid rings, axis lines, data polygon, vertex dots, and labels.
 *
 * @param   {Array}  axes     - [{ label, value }] — value should be 0–maxValue
 * @param   {object} sizeConf - One entry from CHART_SIZES.radar
 * @param   {number} rings    - Number of concentric grid rings (default 4)
 * @param   {number} maxValue - Maximum axis value (default 100)
 * @returns {object}          - { ringPolygons, axisLines, dataPoints, labels, dataPolygon }
 */
export function getRadarPoints(axes, sizeConf, rings = 4, maxValue = 100) {
  const { cx, cy, maxR } = sizeConf;     // Destructure center and max radius
  const N = axes.length;                  // Number of axes

  if (N < 3) return null;                 // Minimum 3 axes required for a polygon

  const angleStep = 360 / N;             // Degrees between each axis

  /* ── Grid ring polygon points ─────────────────────────── */
  const ringPolygons = Array.from({ length: rings }, (_, ringIdx) => {
    const r      = (maxR / rings) * (ringIdx + 1);       // Ring radius — evenly spaced
    const points = axes.map((_, i) => {
      const { x, y } = polarToXY(angleStep * i, r, cx, cy); // Cartesian point
      return `${x},${y}`;                                     // SVG point string
    });
    return points.join(' ');                               // Full polygon points string
  });

  /* ── Axis lines (center → outer vertex) ─────────────────── */
  const axisLines = axes.map((_, i) => {
    const outer = polarToXY(angleStep * i, maxR, cx, cy); // Outer endpoint
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y }; // Line from center to edge
  });

  /* ── Data polygon points from axis values ───────────────── */
  const dataPoints = axes.map((axis, i) => {
    const r           = ((axis.value || 0) / maxValue) * maxR; // Scale value to radius
    const { x, y }    = polarToXY(angleStep * i, r, cx, cy);   // Cartesian point
    return { x, y, value: axis.value, label: axis.label };      // Point with metadata
  });

  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' '); // SVG polygon string

  /* ── Axis labels (positioned slightly outside max ring) ─── */
  const labels = axes.map((axis, i) => {
    const labelR    = maxR + 18;                              // Push labels beyond ring
    const { x, y } = polarToXY(angleStep * i, labelR, cx, cy); // Label position
    return { x, y, label: axis.label, value: axis.value };    // Label with position
  });

  return { ringPolygons, axisLines, dataPoints, dataPolygon, labels }; // All geometry
}

/* ══════════════════════════════════════════════════════════
   6. VALUE FORMATTERS
   Consistent number/label formatting across all charts.
══════════════════════════════════════════════════════════ */

/**
 * formatChartValue — formats a raw number for chart display.
 * @param   {number} value   - Raw numeric value
 * @param   {'pct'|'num'|'score'} type - Output format type
 * @returns {string}         - Formatted display string
 *
 * @example
 * formatChartValue(92, 'pct')   // → "92%"
 * formatChartValue(1234, 'num') // → "1.2K"
 * formatChartValue(85, 'score') // → "85"
 */
export function formatChartValue(value, type = 'num') {
  if (value === null || value === undefined) return '—'; // Guard: missing value

  switch (type) {
    case 'pct':   return `${Math.round(value)}%`;        // Percentage with % symbol
    case 'score': return String(Math.round(value));       // Plain integer string
    case 'num':                                           // Smart number abbreviation
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`; // 1234 → "1.2K"
      return String(Math.round(value));                   // Small numbers as-is
    default:      return String(value);                   // Fallback: raw string
  }
}

/**
 * getColorForValue — returns the band color for a skill score.
 * Delegates to SKILL_BANDS from constants.js.
 * @param   {number} score - Skill score 0–100
 * @returns {string}       - CSS color string
 */
export function getColorForValue(score) {
  if (score >= SKILL_BANDS.expert.min)       return SKILL_BANDS.expert.color;       // Lime ≥80
  if (score >= SKILL_BANDS.advanced.min)     return SKILL_BANDS.advanced.color;     // Cyan ≥60
  if (score >= SKILL_BANDS.intermediate.min) return SKILL_BANDS.intermediate.color; // Violet ≥40
  return SKILL_BANDS.beginner.color;                                                  // Gold <40
}

/**
 * getChartColor — picks a color from CHART_COLORS by index (with wrapping).
 * @param   {number} index - Any integer index
 * @returns {string}       - CSS color string from CHART_COLORS palette
 */
export function getChartColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length]; // Wrap around the palette
}

/* ══════════════════════════════════════════════════════════
   7. BAR CHART HELPERS
══════════════════════════════════════════════════════════ */

/**
 * normalizeBarData — normalizes bar chart data to consistent shape.
 * Accepts either simple numbers or objects with label/value/color.
 *
 * @param   {Array}  raw      - Raw data in any of the supported formats
 * @param   {number} maxValue - Override max (default: highest value in data)
 * @returns {Array}           - Normalized [{ label, value, color, pct }]
 *
 * @example
 * normalizeBarData([
 *   { label: 'React', value: 90, color: '#4FC3F7' },
 *   { label: 'Python', value: 85 },
 * ]);
 */
export function normalizeBarData(raw = [], maxValue) {
  if (!raw.length) return [];                                        // Guard: empty array

  const max = maxValue || Math.max(...raw.map(d => d.value || 0));  // Auto-detect max
  if (max === 0) return [];                                          // Guard: all zeros

  return raw.map((item, i) => ({
    label: item.label || item.skill_name || item.name || `Item ${i + 1}`, // Flexible label key
    value: item.value || item.score  || 0,                                // Flexible value key
    color: item.color || getChartColor(i),                                // Fallback to palette
    pct:   Math.min(((item.value || item.score || 0) / max) * 100, 100), // Clamped percentage
  }));
}

/* ══════════════════════════════════════════════════════════
   8. INTERSECTION OBSERVER FACTORY
   Reusable observer creator for chart entrance animations.
   Returns a cleanup function — call it in useEffect return.
══════════════════════════════════════════════════════════ */

/**
 * createChartObserver — creates an IntersectionObserver for chart animation.
 * When the target element enters the viewport, calls onReveal once.
 *
 * @param   {Element}  element   - DOM element to observe
 * @param   {Function} onReveal  - Callback fired when element is visible
 * @param   {number}   threshold - Visibility ratio to trigger (default from CHART_ANIMATION)
 * @returns {Function}           - Cleanup function: call in useEffect return
 *
 * @example
 * useEffect(() => {
 *   return createChartObserver(ref.current, () => setVisible(true));
 * }, []);
 */
export function createChartObserver(element, onReveal, threshold = CHART_ANIMATION.threshold) {
  if (!element) return () => {};                             // Guard: no element yet

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {                       // Element crossed the threshold
        onReveal();                                          // Trigger animation callback
        observer.disconnect();                               // Fire once — disconnect immediately
      }
    },
    { threshold }                                            // Ratio of element visible before firing
  );

  observer.observe(element);                                 // Start watching

  return () => observer.disconnect();                        // Return cleanup for useEffect
}

/* ══════════════════════════════════════════════════════════
   9. COUNT-UP ANIMATION UTILITY
   Drives animated number counting in StatCard and KPI cards.
══════════════════════════════════════════════════════════ */

/**
 * animateCountUp — animates a DOM element's text from 0 to target value.
 * Uses requestAnimationFrame for smooth GPU-accelerated counting.
 * Returns a cleanup function to cancel if component unmounts.
 *
 * @param   {Element}  element  - DOM element whose textContent will update
 * @param   {number}   target   - Final value to count up to
 * @param   {number}   delay    - Milliseconds to wait before starting
 * @param   {number}   duration - Total animation duration in ms
 * @returns {Function}          - Cleanup: clears the start timer
 *
 * @example
 * useEffect(() => {
 *   return animateCountUp(numRef.current, 42, 200);
 * }, []);
 */
export function animateCountUp(element, target, delay = 0, duration = CHART_ANIMATION.countUpDuration) {
  if (!element || target === 0) return () => {};             // Guard: no element or zero value

  const start = performance.now();                           // High-res start timestamp

  /** Single animation frame tick */
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1); // Progress 0→1
    const eased    = 1 - Math.pow(1 - progress, 3);         // Cubic ease-out curve
    const current  = Math.round(eased * target);             // Current displayed integer

    if (element) element.textContent = current;              // Update DOM directly — no re-render
    if (progress < 1) requestAnimationFrame(tick);           // Continue until complete
  };

  const timer = setTimeout(() => requestAnimationFrame(tick), delay); // Delayed start for stagger
  return () => clearTimeout(timer);                          // Cleanup: cancel if unmounted
}

/* ══════════════════════════════════════════════════════════
   10. LEGEND BUILDER
   Shared legend data builder for Donut and Radar charts.
══════════════════════════════════════════════════════════ */

/**
 * buildLegend — converts raw data into a display-ready legend array.
 * @param   {Array}  items  - [{ label, value, color }]
 * @param   {number} total  - Total for percentage calculation
 * @returns {Array}         - [{ label, color, count, pct }]
 */
export function buildLegend(items, total) {
  const safeTotal = total || items.reduce((s, i) => s + (i.value || 0), 0); // Auto-sum if no total
  return items.map(item => ({
    label: item.label,                                       // Display label
    color: item.color,                                       // Segment color
    count: item.value || 0,                                  // Raw count
    pct:   safeTotal > 0
      ? Math.round(((item.value || 0) / safeTotal) * 100)  // Integer percentage
      : 0,
  }));
}