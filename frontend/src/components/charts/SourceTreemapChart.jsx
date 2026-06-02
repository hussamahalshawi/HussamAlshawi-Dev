import { useMemo, useRef } from 'react';
import { Treemap, Tooltip } from 'recharts';
import useContainerSize from '../../hooks/useContainerSize';

const SOURCE_COLORS = {
  courses: '#F5A623',
  self_study: '#F06292',
  education: '#9B7FEA',
  experience: '#4ECCA3',
  projects: '#4FC3F7',
  achievements: '#FFD700',
};

const SOURCE_LABELS = {
  courses: 'Courses',
  self_study: 'Self Study',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  achievements: 'Achievements',
};

function buildTreemapData(sourceContribution = []) {
  return sourceContribution
    .filter(s => s.unique_skills > 0)
    .map(s => ({
      name: SOURCE_LABELS[s.source] || s.source.replace('_', ' '),
      size: s.unique_skills,
      color: SOURCE_COLORS[s.source] || '#4FC3F7',
    }));
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="recharts-tooltip">
      <p className="recharts-tooltip__label">{d.name}</p>
      <p className="recharts-tooltip__val">{d.value || d.size} unique skills</p>
    </div>
  );
}

export default function SourceTreemapChart({ sourceContribution }) {
  const containerRef = useRef(null);
  const { width, height } = useContainerSize(containerRef);

  const data = useMemo(
    () => buildTreemapData(sourceContribution),
    [sourceContribution]
  );

  if (data.length === 0) {
    return (
      <div className="portfolio-chart-empty" ref={containerRef}>
        <p>No source contribution data</p>
      </div>
    );
  }

  const treeData = [{ name: 'sources', children: data }];
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
            const fontSize = width > 60 ? (width > 100 ? 14 : 11) : 0;
            const subSize = width > 80 ? 11 : 0;

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
                    {payload.size} skills
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
