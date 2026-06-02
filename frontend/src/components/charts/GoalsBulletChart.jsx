import { useMemo, useRef, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import useContainerSize from '../../hooks/useContainerSize';

function buildBulletData(goals = []) {
  return goals.map(g => ({
    name: g.goal_name,
    current: g.current_score || 0,
    target: g.target_score || 95,
    gap: (g.target_score || 95) - (g.current_score || 0),
    status: g.status || 'Planned',
    priority: g.priority || 'Medium',
    topSkills: (g.skills_needed || []).slice(0, 3),
  }));
}

function BulletBgBar({ x, y, width, height, fill }) {
  const safeH = Math.max(height - 8, 0);
  return (
    <rect
      x={x}
      y={y + 4}
      width={width}
      height={safeH}
      rx={4}
      fill={fill}
      opacity={0.12}
    />
  );
}

function BulletFgBar({ x, y, width, height, fill, payload }) {
  const capped = Math.min(width, width * (payload.current / payload.target));
  const pct = Math.round((payload.current / payload.target) * 100);
  const targetX = x + width * (payload.target / 100);
  const safeH = Math.max(height - 12, 0);
  return (
    <g>
      <rect
        x={x}
        y={y + 6}
        width={Math.max(capped, 2)}
        height={safeH}
        rx={3}
        fill={fill}
      />
      {targetX > x && targetX < x + width && (
        <line
          x1={targetX}
          y1={y + 2}
          x2={targetX}
          y2={y + height - 2}
          stroke="var(--red)"
          strokeWidth={2}
          strokeDasharray="3 3"
          opacity={0.7}
        />
      )}
      <text
        x={x + Math.max(capped, 2) + 6}
        y={y + height / 2 + 1}
        fill="rgba(232,238,248,0.6)"
        fontSize={11}
        fontFamily="'DM Sans', sans-serif"
        dominantBaseline="middle"
      >
        {pct}%
      </text>
    </g>
  );
}

export default function GoalsBulletChart({ goals }) {
  const chartRef = useRef(null);
  const { width, height } = useContainerSize(chartRef);

  const data = useMemo(() => buildBulletData(goals), [goals]);

  if (data.length === 0) {
    return (
      <div className="portfolio-chart-empty" ref={chartRef}>
        <p>No goals data available</p>
      </div>
    );
  }

  const ready = width > 0 && height > 0;

  return (
    <div className="portfolio-bullet-wrapper">
      <div className="portfolio-chart-fill" ref={chartRef}>
        {ready ? (
          <BarChart
            data={data}
            width={width}
            height={height}
            layout="vertical"
            barCategoryGap="12%"
            margin={{ top: 8, right: 60, bottom: 8, left: 20 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: 'rgba(232,238,248,0.35)', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'rgba(232,238,248,0.85)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Bar dataKey="target" shape={<BulletBgBar fill="rgba(255,255,255,0.12)" />} barSize={28}>
              {data.map((entry, i) => (
                <Cell key={`bg-${i}`} />
              ))}
            </Bar>
            <Bar dataKey="current" shape={<BulletFgBar fill="var(--cyan)" />} barSize={28}>
              {data.map((entry, i) => (
                <Cell key={`fg-${i}`} fill="var(--cyan)" />
              ))}
            </Bar>
          </BarChart>
        ) : null}
      </div>

      {data.some(d => d.topSkills.length > 0) && (
        <div className="portfolio-bullet-gaps">
          {data.map(d => (
            d.topSkills.length > 0 && (
              <div key={d.name} className="portfolio-bullet-gap-row">
                <div className="portfolio-bullet-gap__header">
                  <span className="portfolio-bullet-gap__name">{d.name}</span>
                  <span
                    className={`portfolio-bullet-gap__status portfolio-bullet-gap__status--${d.status?.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="portfolio-bullet-gap__skills">
                  {d.topSkills.map(s => (
                    <div key={s.name} className="portfolio-bullet-gap__skill">
                      <span className="portfolio-bullet-gap__skill-name">{s.name}</span>
                      <div className="portfolio-bullet-gap__track">
                        <div
                          className="portfolio-bullet-gap__fill"
                          style={{ width: `${(s.current / Math.max(s.target, 1)) * 100}%` }}
                        />
                        <div
                          className="portfolio-bullet-gap__target-dot"
                          style={{ left: `${(s.target / 100) * 100}%` }}
                        />
                      </div>
                      <span className="portfolio-bullet-gap__diff">
                        {s.gap > 0 ? `-${s.gap}` : '✓'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
