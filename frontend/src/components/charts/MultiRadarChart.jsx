import { useMemo, useRef } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import useContainerSize from '../../hooks/useContainerSize';
import '../../styles/charts/MultiRadarChart.css';

const DASH_MAP = {
  solid: undefined,
  dash: '5 3',
  dot: '2 3',
};

const PENTAGON_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  return (
    <div className="mr-tooltip">
      <div className="mr-tooltip__cat">{entry.category}</div>
      {payload.map((p, i) => (
        <div key={i} className="mr-tooltip__row">
          <span className="mr-tooltip__dot" style={{ background: p.color }} />
          <span className="mr-tooltip__name">{p.name}</span>
          <span className="mr-tooltip__val">{p.value}/100</span>
        </div>
      ))}
    </div>
  );
}

function buildChartData(labels = [], series = []) {
  return labels.map((cat, i) => {
    const point = { category: cat };
    series.forEach(s => {
      point[s.name] = s.values?.[i] ?? 0;
    });
    return point;
  });
}

export default function MultiRadarChart({ data }) {
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);

  const { labels, series, chartData } = useMemo(() => {
    const labs = data?.labels || [];
    const ser = data?.series || [];
    return {
      labels: labs,
      series: ser,
      chartData: buildChartData(labs, ser),
    };
  }, [data]);

  if (!labels.length || !series.length) {
    return (
      <div className="multi-radar-empty">
        <p>No domain coverage data available.</p>
      </div>
    );
  }

  const ready = width > 0 && height > 0;

  return (
    <div className="multi-radar" ref={containerRef}>
      <div className="multi-radar__header">
        <svg
          className="multi-radar__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={PENTAGON_PATH} />
        </svg>
        <span className="multi-radar__title">
          Skill domain coverage — all models combined
        </span>
      </div>

      {ready ? (
        <RadarChart
          data={chartData}
          width={width}
          height={Math.min(height, width * 0.85)}
          cx="50%"
          cy="50%"
          outerRadius="68%"
        >
          <PolarGrid
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fill: 'rgba(232,238,248,0.55)',
              fontSize: 10,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {series.map((s) => (
            <Radar
              key={s.name}
              name={s.name}
              dataKey={s.name}
              fill={s.name === 'Combined' ? s.color : 'none'}
              fillOpacity={s.name === 'Combined' ? 0.15 : 0}
              stroke={s.color}
              strokeWidth={s.width || (s.name === 'Combined' ? 3 : 1.5)}
              strokeDasharray={DASH_MAP[s.dash] || undefined}
              animationBegin={200}
              animationDuration={900}
              animationEasing="ease-out"
              dot={s.name === 'Combined'}
              activeDot={s.name === 'Combined'}
            />
          ))}
        </RadarChart>
      ) : null}

      <div className="multi-radar__legend">
        {series.map((s) => (
          <div key={s.name} className="multi-radar__legend-item">
            <span
              className="multi-radar__legend-dot"
              style={{ background: s.color }}
            />
            <span className="multi-radar__legend-label">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
