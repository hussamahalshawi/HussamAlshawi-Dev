import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver, getChartTheme } from '../../utils/chartConfig';
import '../../styles/charts/GanttChart.css';

const BAR_HEIGHT = 34;
const BAR_GAP = 10;
const LABEL_WIDTH = 160;
const HEADER_H = 32;
const PADDING = 20;
const MIN_YEAR_SPAN = 5;
const YEAR_TICK_W = 70;

export default function GanttChart({ items = [], minYear, maxYear }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const years = useMemo(() => {
    if (items.length === 0) return [];
    const min = minYear ?? Math.min(...items.map(i => i.start_year ?? new Date().getFullYear()));
    const max = maxYear ?? Math.max(...items.map(i => i.end_year ?? new Date().getFullYear()));
    const lo = Math.min(min, new Date().getFullYear() - 4);
    const hi = Math.max(max, lo + MIN_YEAR_SPAN);
    const arr = [];
    for (let y = lo; y <= hi; y++) arr.push(y);
    return arr;
  }, [items, minYear, maxYear]);

  const yearSpan = years.length > 1 ? years[years.length - 1] - years[0] : MIN_YEAR_SPAN;
  const pixelsPerYear = YEAR_TICK_W;
  const totalW = Math.max(yearSpan * pixelsPerYear + PADDING * 2, 400);
  const svgW = totalW + LABEL_WIDTH;

  const allBars = useMemo(() => {
    if (items.length === 0 || years.length === 0) return [];
    const baseYear = years[0];

    return items.map((item, i) => {
      const sx = ((item.start_year - baseYear) / yearSpan) * totalW + PADDING;
      const ex = item.end_year
        ? ((item.end_year - baseYear) / yearSpan) * totalW + PADDING
        : ((new Date().getFullYear() + 0.5 - baseYear) / yearSpan) * totalW + PADDING;
      const y = HEADER_H + 16 + i * (BAR_HEIGHT + BAR_GAP);
      return {
        ...item,
        x: sx + LABEL_WIDTH,
        bw: Math.max(ex - sx, 6),
        y,
        labelX: PADDING,
        labelY: y + BAR_HEIGHT / 2,
      };
    });
  }, [items, years, yearSpan, totalW]);

  const totalH = allBars.length > 0
    ? allBars[allBars.length - 1].y + BAR_HEIGHT + PADDING
    : 200;

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  if (items.length === 0) {
    return (
      <div className="gantt-chart gantt-chart--empty" ref={wrapRef}>
        <span>No career timeline data available</span>
      </div>
    );
  }

  return (
    <div className="gantt-chart" ref={wrapRef}>
      <div className="gantt-chart__scroll">
        <svg
          width={svgW}
          height={totalH}
          viewBox={`0 0 ${svgW} ${totalH}`}
          className="gantt-chart__svg"
          style={{ minWidth: svgW }}
        >
          {/* Year grid lines */}
          {years.map((y, i) => {
            const x = ((y - years[0]) / yearSpan) * totalW + PADDING + LABEL_WIDTH;
            return (
              <g key={`grid-${y}`}>
                <line
                  x1={x} y1={HEADER_H} x2={x} y2={totalH}
                  stroke={theme.grid}
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? 'none' : '4 4'}
                />
                <text
                  x={x} y={HEADER_H - 8}
                  fill={theme.label}
                  fontSize={12}
                  fontFamily="'DM Sans', sans-serif"
                  textAnchor="middle"
                >
                  {y}
                </text>
              </g>
            );
          })}

          {/* Today indicator */}
          {(() => {
            const now = new Date().getFullYear() + (new Date().getMonth() + 0.5) / 12;
            const tx = ((now - years[0]) / yearSpan) * totalW + PADDING + LABEL_WIDTH;
            if (tx < LABEL_WIDTH || tx > svgW) return null;
            return (
              <line
                x1={tx} y1={HEADER_H} x2={tx} y2={totalH}
                stroke={isDark ? 'rgba(79,195,247,0.5)' : 'rgba(26,143,199,0.5)'}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            );
          })()}

          {/* Bars */}
          {allBars.map((bar, i) => (
            <g key={`bar-${i}`} className="gantt-chart__bar-group">
              {/* Label */}
              <g>
                <text
                  x={bar.labelX}
                  y={bar.labelY}
                  fill={theme.label}
                  fontSize={12}
                  fontFamily="'DM Sans', sans-serif"
                  fontWeight={600}
                  dominantBaseline="central"
                >
                  {bar.type === 'education' ? '🎓 ' : '💼 '}
                  {bar.label.length > 22 ? bar.label.slice(0, 20) + '…' : bar.label}
                </text>
                <text
                  x={bar.labelX}
                  y={bar.labelY + 14}
                  fill={theme.labelMuted}
                  fontSize={10}
                  fontFamily="'DM Sans', sans-serif"
                  dominantBaseline="central"
                >
                  {bar.sub_label}
                </text>
              </g>

              {/* Bar track */}
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.bw}
                height={BAR_HEIGHT}
                rx={6}
                fill={bar.color || '#4FC3F7'}
                fillOpacity={visible ? 0.25 : 0}
                stroke={bar.color || '#4FC3F7'}
                strokeWidth={bar.is_current ? 2 : 1}
                className={bar.is_current ? 'gantt-chart__bar--current' : ''}
                style={{
                  transition: visible
                    ? `fill-opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 60}ms`
                    : 'none',
                }}
              />

              {/* Bar inner glow fill */}
              <rect
                x={bar.x + 2}
                y={bar.y + (bar.is_current ? 3 : 2)}
                width={Math.max(bar.bw - 4, 2)}
                height={BAR_HEIGHT - (bar.is_current ? 6 : 4)}
                rx={4}
                fill={bar.color || '#4FC3F7'}
                fillOpacity={visible ? 0.45 : 0}
                style={{
                  transition: visible
                    ? `fill-opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 60 + 100}ms`
                    : 'none',
                }}
              />

              {/* Duration text */}
              <text
                x={bar.x + bar.bw + 8}
                y={bar.y + BAR_HEIGHT / 2}
                fill={theme.labelMuted}
                fontSize={10}
                fontFamily="'JetBrains Mono', monospace"
                dominantBaseline="central"
              >
                {bar.duration_months}m{bar.is_current ? ' · Present' : ''}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
