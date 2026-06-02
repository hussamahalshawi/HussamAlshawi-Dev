import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver, getChartTheme } from '../../utils/chartConfig';
import '../../styles/charts/BubbleTimelineChart.css';

const PRIORITY_WEIGHTS = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const STATUS_COLORS = {
  'Achieved': '#4ECCA3',
  'In Progress': '#4FC3F7',
  'Planned': '#F5A623',
  'Paused': '#888780',
};

export default function BubbleTimelineChart({ goals = [], minYear, maxYear }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const years = useMemo(() => {
    if (goals.length === 0) return [];
    const min = minYear ?? Math.min(...goals.map(g => g.target_year ?? new Date().getFullYear()));
    const max = maxYear ?? Math.max(...goals.map(g => g.target_year ?? new Date().getFullYear()));
    const arr = [];
    for (let y = min; y <= Math.max(max, min + 3); y++) arr.push(y);
    return arr;
  }, [goals, minYear, maxYear]);

  const bubbles = useMemo(() => {
    if (goals.length === 0 || years.length === 0) return [];
    const yearW = 90;
    const pad = 30;
    const svgW = years.length * yearW + pad * 2;
    const baseY = years[0];

    return goals.map((g, i) => {
      const yearIdx = years.indexOf(g.target_year) + 0.5;
      const x = yearIdx * yearW + pad;
      const w = (PRIORITY_WEIGHTS[g.priority] || 2) * 13 + 16;
      const h = w;
      const statusColor = STATUS_COLORS[g.status] || '#4FC3F7';
      const progressColor = g.progress_pct >= 80 ? '#4ECCA3' : g.progress_pct >= 50 ? '#4FC3F7' : g.progress_pct >= 25 ? '#F5A623' : '#F06292';
      return { ...g, x, w, h, statusColor, progressColor };
    });
  }, [goals, years]);

  const svgW = years.length * 90 + 60;
  const svgH = Math.max(bubbles.length * 54 + 60, 200);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  if (goals.length === 0) {
    return (
      <div className="bubble-timeline bubble-timeline--empty" ref={wrapRef}>
        <span>No goal roadmap data</span>
      </div>
    );
  }

  return (
    <div className="bubble-timeline" ref={wrapRef}>
      <div className="bubble-timeline__scroll">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ minWidth: svgW }}>
          {/* Year columns */}
          {years.map((y, i) => (
            <g key={y}>
              <line
                x1={i * 90 + 30} y1={0} x2={i * 90 + 30} y2={svgH}
                stroke={theme.grid}
                strokeWidth={1}
                strokeDasharray={i === 0 ? 'none' : '4 4'}
              />
              <text
                x={i * 90 + 30} y={18}
                fill={theme.label}
                fontSize={12}
                fontFamily="'DM Sans', sans-serif"
                textAnchor="middle"
              >
                {y}
              </text>
            </g>
          ))}

          {/* Bubbles */}
          {bubbles.map((b, i) => (
            <g
              key={b.goal_name || i}
              className="bubble-timeline__bubble"
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 80}ms`,
              }}
            >
              <circle
                cx={b.x} cy={i * 50 + 50}
                r={b.w / 2}
                fill={b.statusColor}
                fillOpacity={0.15}
                stroke={b.statusColor}
                strokeWidth={1.5}
                className={b.status === 'In Progress' ? 'bubble-timeline__bubble--pulse' : ''}
              />
              <circle
                cx={b.x} cy={i * 50 + 50}
                r={b.w / 4}
                fill={b.progressColor}
                fillOpacity={0.60}
              />
              <text
                x={b.x} y={i * 50 + 50}
                textAnchor="middle" dominantBaseline="central"
                fill={isDark ? '#fff' : '#1a2332'}
                fontSize={9}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={700}
              >
                {b.progress_pct ?? 0}%
              </text>
              <text
                x={b.x + b.w / 2 + 10} y={i * 50 + 46}
                fill={theme.label}
                fontSize={11}
                fontFamily="'DM Sans', sans-serif"
                fontWeight={600}
              >
                {b.goal_name}
              </text>
              <text
                x={b.x + b.w / 2 + 10} y={i * 50 + 60}
                fill={theme.labelMuted}
                fontSize={9}
                fontFamily="'DM Sans', sans-serif"
              >
                {b.priority || b.status}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
