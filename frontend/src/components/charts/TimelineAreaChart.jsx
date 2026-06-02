import { useMemo, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import useContainerSize from '../../hooks/useContainerSize';

function buildTimelineData(timeline = []) {
  return timeline.map(year => {
    const courseSkills = new Set();
    const selfStudySkills = new Set();
    const educationSkills = new Set();

    (year.courses || []).forEach(c =>
      (c.skills || []).forEach(s => courseSkills.add(s))
    );
    (year.self_studies || []).forEach(s =>
      (s.skills || []).forEach(sk => selfStudySkills.add(sk))
    );
    (year.educations || []).forEach(e =>
      (e.skills || []).forEach(sk => educationSkills.add(sk))
    );

    return {
      year: String(year.year),
      courses: courseSkills.size,
      selfStudy: selfStudySkills.size,
      education: educationSkills.size,
    };
  });
}

const SOURCE_AREAS = [
  { key: 'education', label: 'Education', color: '#9B7FEA' },
  { key: 'selfStudy', label: 'Self Study', color: '#F06292' },
  { key: 'courses', label: 'Courses', color: '#F5A623' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-tooltip">
      <p className="recharts-tooltip__label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="recharts-tooltip__row" style={{ color: p.color }}>
          {SOURCE_AREAS.find(a => a.key === p.dataKey)?.label || p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="portfolio-legend">
      {payload.map(entry => (
        <div key={entry.dataKey} className="portfolio-legend__item">
          <span
            className="portfolio-legend__dot"
            style={{ background: entry.color }}
          />
          <span className="portfolio-legend__label">
            {SOURCE_AREAS.find(a => a.key === entry.dataKey)?.label || entry.dataKey}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TimelineAreaChart({ timeline }) {
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);

  const data = useMemo(() => buildTimelineData(timeline), [timeline]);

  if (data.length === 0) {
    return (
      <div className="portfolio-chart-empty" ref={containerRef}>
        <p>No timeline data available</p>
      </div>
    );
  }

  const ready = width > 0 && height > 0;

  return (
    <div className="portfolio-chart-fill" ref={containerRef}>
      {ready ? (
        <AreaChart data={data} width={width} height={height} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            {SOURCE_AREAS.map(a => (
              <linearGradient key={a.key} id={`gradient_${a.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={a.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={a.color} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fill: 'rgba(232,238,248,0.5)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <YAxis
            tick={{ fill: 'rgba(232,238,248,0.4)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {SOURCE_AREAS.map(a => (
            <Area
              key={a.key}
              type="monotone"
              dataKey={a.key}
              stackId="1"
              stroke={a.color}
              strokeWidth={1.5}
              fill={`url(#gradient_${a.key})`}
              animationBegin={200}
              animationDuration={900}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      ) : null}
    </div>
  );
}
