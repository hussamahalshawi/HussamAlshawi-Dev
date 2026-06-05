import { useMemo, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import useContainerSize from '../../hooks/useContainerSize';
import '../../styles/charts/DualAxisChart.css';

function buildYearMap(ganttItems, coursesSeries) {
  const yearMap = {};

  (coursesSeries || []).forEach(s => {
    const year = String(s.period || s.label);
    if (!yearMap[year]) yearMap[year] = { year, months: 0, courses: 0 };
    yearMap[year].courses = s.count || s.value || 0;
  });

  (ganttItems || []).forEach(item => {
    const sy = item.start_year;
    const ey = item.end_year || new Date().getFullYear();
    const dm = item.duration_months || 0;
    if (!sy || !ey) return;
    const totalYears = Math.max(ey - sy, 1);
    const monthsPerYear = dm / totalYears;
    for (let y = sy; y <= ey; y++) {
      const key = String(y);
      if (!yearMap[key]) yearMap[key] = { year: key, months: 0, courses: 0 };
      yearMap[key].months += monthsPerYear;
    }
  });

  return Object.values(yearMap).sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-tooltip">
      <p className="recharts-tooltip__label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="recharts-tooltip__row" style={{ color: p.color }}>
          {p.dataKey === 'months' ? 'Employment months' : 'Courses'}: {Math.round(p.value * 10) / 10}
        </p>
      ))}
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="dual-axis-legend">
      {payload.map(entry => (
        <div key={entry.dataKey} className="dual-axis-legend__item">
          {entry.dataKey === 'months' ? (
            <span className="dual-axis-legend__bar" style={{ background: entry.color }} />
          ) : (
            <span className="dual-axis-legend__line" style={{ background: entry.color }} />
          )}
          <span className="dual-axis-legend__label">
            {entry.dataKey === 'months' ? 'Employment months' : 'Courses count'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DualAxisChart({ ganttItems = [], coursesSeries = [] }) {
  const { isDark } = useTheme();
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);

  const data = useMemo(() => buildYearMap(ganttItems, coursesSeries), [ganttItems, coursesSeries]);

  if (data.length === 0) {
    return (
      <div className="dual-axis-chart--empty" ref={containerRef}>
        <span>No data available</span>
      </div>
    );
  }

  const ready = width > 0 && height > 0;

  return (
    <div className="dual-axis-chart" ref={containerRef}>
      {ready ? (
        <ComposedChart data={data} width={width} height={height} margin={{ top: 8, right: 40, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#1D9E75" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={`rgba(255,255,255,${isDark ? 0.06 : 0.1})`}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fill: isDark ? 'rgba(232,238,248,0.45)' : 'rgba(0,0,0,0.45)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: isDark ? 'rgba(232,238,248,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            label={{ value: 'months', angle: -90, position: 'insideLeft', fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 10 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: isDark ? 'rgba(232,238,248,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            label={{ value: 'courses', angle: 90, position: 'insideRight', fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar
            yAxisId="left"
            dataKey="months"
            fill="url(#barGrad)"
            radius={[4, 4, 0, 0]}
            barSize={36}
            animationBegin={200}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="right"
            dataKey="courses"
            stroke="#378ADD"
            strokeWidth={2.5}
            dot={{ fill: '#378ADD', r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: '#378ADD', stroke: isDark ? '#0b0f1e' : '#fff', strokeWidth: 2 }}
            animationBegin={400}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </ComposedChart>
      ) : null}
    </div>
  );
}
