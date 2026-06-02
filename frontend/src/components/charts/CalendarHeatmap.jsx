import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver, getChartTheme } from '../../utils/chartConfig';
import '../../styles/charts/CalendarHeatmap.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LEVEL_COLORS = [
  'rgba(255,255,255,0.04)',
  'rgba(79,195,247,0.15)',
  'rgba(79,195,247,0.35)',
  'rgba(79,195,247,0.55)',
  'rgba(79,195,247,0.80)',
];
const LIGHT_LEVEL_COLORS = [
  'rgba(79,100,145,0.06)',
  'rgba(26,143,199,0.15)',
  'rgba(26,143,199,0.30)',
  'rgba(26,143,199,0.50)',
  'rgba(26,143,199,0.75)',
];

export default function CalendarHeatmap({ byMonth = [], minDate, maxDate }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);

  const levelColors = isDark ? LEVEL_COLORS : LIGHT_LEVEL_COLORS;

  const months = useMemo(() => {
    if (byMonth.length === 0) return [];
    const min = minDate || byMonth[0]?.month;
    const max = maxDate || byMonth[byMonth.length - 1]?.month;
    if (!min || !max) return [];

    const [minY, minM] = min.split('-').map(Number);
    const [maxY, maxM] = max.split('-').map(Number);
    const result = [];
    const lookup = {};
    byMonth.forEach(m => { lookup[m.month] = m; });

    let y = minY, m = minM;
    while (y < maxY || (y === maxY && m <= maxM)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const data = lookup[key];
      result.push({
        month: key,
        label: `${MONTHS[m - 1]} ${y}`,
        count: data?.count || 0,
        level: data?.level ?? 0,
      });
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return result;
  }, [byMonth, minDate, maxDate]);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  if (months.length === 0) {
    return (
      <div className="cal-heatmap cal-heatmap--empty" ref={wrapRef}>
        <span>No project activity data available</span>
      </div>
    );
  }

  const cols = Math.min(months.length, 12);
  const rows = Math.ceil(months.length / cols);

  return (
    <div className="cal-heatmap" ref={wrapRef}>
      <div className="cal-heatmap__grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {months.map((m, i) => (
          <div
            key={m.month}
            className="cal-heatmap__cell"
            style={{
              background: levelColors[m.level],
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.85)',
              transition: visible
                ? `background 0.15s ease, opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 30}ms, transform ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 30}ms`
                : 'none',
              borderColor: hovered === i ? (isDark ? 'rgba(79,195,247,0.5)' : 'rgba(26,143,199,0.5)') : 'transparent',
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            title={`${m.label}: ${m.count} project${m.count !== 1 ? 's' : ''}`}
            aria-label={`${m.label}: ${m.count} projects`}
          >
            <span className="cal-heatmap__month">{MONTHS[parseInt(m.month.split('-')[1]) - 1]}</span>
            <span className="cal-heatmap__year">{m.month.split('-')[0]}</span>
            <span className="cal-heatmap__count">{m.count}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="cal-heatmap__legend">
        <span className="cal-heatmap__legend-label">Less</span>
        {levelColors.map((c, i) => (
          <span
            key={i}
            className="cal-heatmap__legend-swatch"
            style={{ background: c, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(79,100,145,0.12)'}` }}
          />
        ))}
        <span className="cal-heatmap__legend-label">More</span>
      </div>
    </div>
  );
}
