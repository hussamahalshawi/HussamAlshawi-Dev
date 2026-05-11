/**
 * PerformanceChart.jsx
 * ─────────────────────────────────────────────────────────
 * Performance Metrics panel — exactly like the Devoryn dashboard.
 * Contains:
 *   - Animated SVG line chart with gradient fill
 *   - Decorative bar chart at the bottom
 *   - Three KPI numbers (Revenue, Score, Projects)
 *   - Water-droplet decorations
 * Props: data from /api/portfolio/analytics
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useRef } from 'react';           // Refs for animation triggers
import '../../styles/charts/PerformanceChart.css';   // Component-specific styles

/**
 * @param {object}      props
 * @param {object|null} props.analytics - Analytics object from /api/portfolio/analytics
 * @param {object|null} props.profile   - Profile object from /api/portfolio/profile
 */
export default function PerformanceChart({ analytics, profile }) {

  /* ── Refs for animation ─────────────────────────────────────── */
  const lineRef    = useRef(null);   // SVG line path ref for draw animation
  const barsRef    = useRef(null);   // Bar chart container ref

  /* ── Extract data safely ────────────────────────────────────── */
  const counts     = analytics?.counts    || {};           // Counts object from API
  const projects   = counts.projects      || 0;           // Total projects count
  const score      = profile?.overall_score || 0;         // Overall skill score 0-100
  const expYears   = profile?.experience_years || 0;      // Years of experience

  /* ── Animate SVG line on mount ──────────────────────────────── */
  useEffect(() => {
    if (!lineRef.current) return;                         // Guard: element not mounted

    const line = lineRef.current;                         // Get the SVG path element
    const len  = line.getTotalLength();                   // Calculate path total length

    line.style.strokeDasharray  = `${len}`;               // Set dash pattern = full length
    line.style.strokeDashoffset = `${len}`;               // Start hidden (fully offset)

    // Trigger animation after brief delay for entrance effect
    requestAnimationFrame(() => {
      line.style.transition      = 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1) 0.3s';
      line.style.strokeDashoffset = '0';                  // Animate to fully visible
    });
  }, []);                                                  // Run once on mount

  /* ── Animate bar heights on mount ──────────────────────────── */
  useEffect(() => {
    if (!barsRef.current) return;                         // Guard: element not mounted

    // Select all bar fill elements inside the container
    const bars = barsRef.current.querySelectorAll('.perf-bar__fill');

    bars.forEach((bar, i) => {
      const targetHeight = bar.dataset.height;            // Read target height from data attr
      bar.style.height   = '0px';                         // Start from zero height

      // Stagger each bar's animation by 80ms
      setTimeout(() => {
        bar.style.transition = 'height 0.8s cubic-bezier(0.16,1,0.3,1)';
        bar.style.height     = targetHeight;              // Animate to target height
      }, 400 + i * 80);                                    // Delay: 400ms base + stagger
    });
  }, []);                                                  // Run once on mount

  /* ── Bar chart data — 7 groups of 2 bars each ──────────────── */
  const barData = [
    { a: 65, b: 45 },   // Bar group 1
    { a: 80, b: 55 },   // Bar group 2
    { a: 50, b: 70 },   // Bar group 3
    { a: 90, b: 40 },   // Bar group 4
    { a: 60, b: 85 },   // Bar group 5
    { a: 75, b: 50 },   // Bar group 6
    { a: 55, b: 65 },   // Bar group 7
  ];

  /* ── Max height for bars in px ─────────────────────────────── */
  const BAR_MAX = 48;   // Maximum bar height in pixels

  return (
    <div className="perf-chart">

      {/* ── Panel header ── */}
      <div className="perf-chart__header">
        <span className="perf-chart__title">Performance Metrics</span>
        <button className="perf-chart__menu" aria-label="Chart options">···</button>
      </div>

      {/* ── Decorative water drops ── */}
      <div className="perf-chart__drops" aria-hidden="true">
        <div className="drop drop--1" />   {/* Large drop top-right */}
        <div className="drop drop--2" />   {/* Medium drop middle */}
        <div className="drop drop--3" />   {/* Small drop bottom-left */}
      </div>

      {/* ── SVG Line Chart ── */}
      <div className="perf-chart__area">
        <svg
          className="perf-chart__svg"
          viewBox="0 0 400 110"
          preserveAspectRatio="none"
          aria-label="Performance trend line chart"
          role="img"
        >
          <defs>
            {/* Gradient fill under the line */}
            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--cyan)" stopOpacity="0.50" />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0"    />
            </linearGradient>
          </defs>

          {/* Area fill under the curve */}
          <path
            className="perf-chart__fill"
            fill="url(#perfGradient)"
            d="M0,90 C30,85 55,70 80,65
               C105,60 130,50 160,38
               C190,26 215,30 240,25
               C265,20 290,35 320,28
               C350,22 375,18 400,12
               L400,110 L0,110 Z"
          />

          {/* Animated trend line */}
          <path
            ref={lineRef}
            className="perf-chart__line"
            stroke="var(--cyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="drop-shadow(0 2px 8px var(--cyan-dim))"
            d="M0,90 C30,85 55,70 80,65
               C105,60 130,50 160,38
               C190,26 215,30 240,25
               C265,20 290,35 320,28
               C350,22 375,18 400,12"
          />
        </svg>
      </div>

      {/* ── Bar Chart ── */}
      <div className="perf-chart__bars" ref={barsRef} aria-label="Monthly performance bars">
        {barData.map((group, i) => (
          <div key={i} className="perf-bar-group">
            {/* Primary bar — cyan */}
            <div className="perf-bar">
              <div
                className="perf-bar__fill perf-bar__fill--cyan"
                data-height={`${Math.round((group.a / 100) * BAR_MAX)}px`}
                style={{ height: '0px' }}
              />
            </div>
            {/* Secondary bar — orange */}
            <div className="perf-bar">
              <div
                className="perf-bar__fill perf-bar__fill--orange"
                data-height={`${Math.round((group.b / 100) * BAR_MAX)}px`}
                style={{ height: '0px' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Numbers ── */}
      <div className="perf-chart__kpis" role="list">

        {/* KPI 1: Experience years */}
        <div className="perf-kpi" role="listitem">
          <div className="perf-kpi__num" style={{ color: 'var(--cyan)' }}>
            {expYears > 0 ? `${expYears}+` : '—'}
          </div>
          <div className="perf-kpi__label">Yrs Exp</div>
        </div>

        {/* Divider */}
        <div className="perf-kpi__divider" aria-hidden="true" />

        {/* KPI 2: Overall skill score */}
        <div className="perf-kpi" role="listitem">
          <div className="perf-kpi__num" style={{ color: 'var(--blue)' }}>
            {score > 0 ? `${Math.round(score)}%` : '—'}
          </div>
          <div className="perf-kpi__label">Skill Score</div>
        </div>

        {/* Divider */}
        <div className="perf-kpi__divider" aria-hidden="true" />

        {/* KPI 3: Total projects */}
        <div className="perf-kpi" role="listitem">
          <div
            className="perf-kpi__num"
            style={{ color: 'var(--green)' }}
            aria-live="polite"
          >
            {projects}
          </div>
          <div className="perf-kpi__label">Projects</div>
        </div>
      </div>
    </div>
  );
}