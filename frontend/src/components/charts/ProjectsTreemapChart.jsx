import { useMemo, useRef } from 'react';
import { Treemap, Tooltip } from 'recharts';
import useContainerSize from '../../hooks/useContainerSize';
import { CHART_COLORS } from '../../utils/constants';

function buildTreemapData(projectsTreemap) {
  if (!projectsTreemap) return [];
  const { by_category } = projectsTreemap;
  if (!by_category || by_category.length === 0) return [];

  return by_category.map((cat, i) => ({
    name: cat.category,
    size: cat.count,
    pct: cat.pct,
    color: cat.color || CHART_COLORS[i % CHART_COLORS.length],
    projects: cat.projects || [],
  }));
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="recharts-tooltip">
      <p className="recharts-tooltip__label">{d.name}</p>
      <p className="recharts-tooltip__val">{d.value || d.size} projects ({d.pct}%)</p>
      {d.projects?.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {d.projects.slice(0, 5).map((p, i) => (
            <p key={i} className="recharts-tooltip__row" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {p.name || p.project_name || `Project ${i + 1}`}
              {p.type ? ` — ${p.type}` : ''}
            </p>
          ))}
          {d.projects.length > 5 && (
            <p className="recharts-tooltip__row" style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
              +{d.projects.length - 5} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectsTreemapChart({ projectsTreemap }) {
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);

  const data = useMemo(() => buildTreemapData(projectsTreemap), [projectsTreemap]);

  if (data.length === 0) {
    return (
      <div className="portfolio-chart-empty" ref={containerRef}>
        <p>No project data available</p>
      </div>
    );
  }

  const treeData = [{ name: 'projects', children: data }];
  const ready = width > 0 && height > 0;

  return (
    <div className="portfolio-chart-fill" ref={containerRef}>
      {ready ? (
        <Treemap
          width={width}
          height={height}
          data={treeData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="rgba(13,17,38,0.5)"
          fill="#4FC3F7"
          isAnimationActive={false}
          content={props => {
            const { depth, x, y, width, height, payload, name } = props;
            if (!depth || depth < 1 || !payload) return null;

            const nodeColor = payload.color || '#4FC3F7';
            const fontSize = width > 60 ? (width > 100 ? 13 : 11) : 0;
            const subSize = width > 80 ? 10 : 0;

            return (
              <g>
                <rect
                  x={x} y={y} width={width} height={height}
                  fill={nodeColor} fillOpacity={0.2}
                  stroke="rgba(13,17,38,0.5)" strokeWidth={1.5} rx={4}
                />
                <rect
                  x={x} y={y} width={width} height={height}
                  fill={nodeColor} fillOpacity={0.06} rx={4}
                />
                {fontSize > 0 && (
                  <text
                    x={x + width / 2}
                    y={y + height / 2 - (subSize > 0 ? 6 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(232,238,248,0.9)"
                    fontSize={fontSize}
                    fontFamily="'DM Sans', sans-serif"
                    fontWeight={700}
                  >
                    {name || payload.name || ''}
                  </text>
                )}
                {subSize > 0 && (
                  <text
                    x={x + width / 2}
                    y={y + height / 2 + 14}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(232,238,248,0.45)"
                    fontSize={subSize}
                    fontFamily="'DM Sans', sans-serif"
                  >
                    {payload.size} projects
                  </text>
                )}
              </g>
            );
          }}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      ) : null}
    </div>
  );
}
