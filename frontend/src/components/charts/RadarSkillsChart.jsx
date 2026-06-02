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

function buildRadarData(skillsByType = []) {
  return skillsByType
    .filter(cat => cat.avg_score > 0)
    .map(cat => ({
      category: cat.type,
      value: Math.round(cat.avg_score),
      fullMark: 100,
    }));
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="recharts-tooltip">
      <p className="recharts-tooltip__label">{d.category}</p>
      <p className="recharts-tooltip__val">{d.value}/100</p>
    </div>
  );
}

export default function RadarSkillsChart({ skillsByType }) {
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);

  const data = useMemo(() => buildRadarData(skillsByType), [skillsByType]);

  if (data.length < 3) {
    return (
      <div className="portfolio-chart-empty" ref={containerRef}>
        <p>Radar requires 3+ skill categories</p>
      </div>
    );
  }

  const ready = width > 0 && height > 0;

  return (
    <div className="portfolio-chart-fill" ref={containerRef}>
      {ready ? (
        <RadarChart data={data} width={width} height={height} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fill: 'rgba(232,238,248,0.75)',
              fontSize: 11,
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
          <Radar
            dataKey="value"
            fill="var(--cyan)"
            fillOpacity={0.2}
            stroke="var(--cyan)"
            strokeWidth={2}
            animationBegin={200}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </RadarChart>
      ) : null}
    </div>
  );
}
