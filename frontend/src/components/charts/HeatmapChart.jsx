import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver, getChartTheme } from '../../utils/chartConfig';
import { SKILL_BANDS } from '../../utils/constants';
import '../../styles/charts/HeatmapChart.css';

export default function HeatmapChart({ categories = [], bands = [], matrix = [], bandRanges = {} }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const bandKeys = bands.length > 0 ? bands : Object.keys(SKILL_BANDS).map(k => SKILL_BANDS[k].label);
  const bandColors = bands.length > 0
    ? bands.map((_, i) => {
        const keys = Object.keys(SKILL_BANDS);
        return SKILL_BANDS[keys[i]]?.color || '#4FC3F7';
      })
    : Object.values(SKILL_BANDS).map(b => b.color);

  const matrixData = useMemo(() => {
    if (matrix.length > 0 && categories.length > 0) return { cat: categories, rows: matrix };
    const cats = categories.length > 0 ? categories : ['No data'];
    const rows = matrix.length > 0 ? matrix : [{ category: 'No data', values: [0, 0, 0, 0] }];
    return { cat: cats, rows };
  }, [categories, bands, matrix]);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  if (matrixData.cat.length === 0 || matrixData.cat[0] === 'No data') {
    return (
      <div className="heatmap-chart heatmap-chart--empty" ref={wrapRef}>
        <span>No heatmap data available</span>
      </div>
    );
  }

  const maxVal = Math.max(...matrixData.rows.flatMap(r => r.values || [0]), 1);

  return (
    <div className="heatmap-chart" ref={wrapRef}>
      {/* Header row */}
      <div className="heatmap-chart__grid" style={{
        gridTemplateColumns: `140px repeat(${bandKeys.length}, 1fr)`,
      }}>
        <div className="heatmap-chart__header-cell heatmap-chart__corner" />
        {bandKeys.map((band, i) => (
          <div key={band} className="heatmap-chart__header-cell" style={{ color: bandColors[i] }}>
            {band}
            {bandRanges[band] && <span className="heatmap-chart__range">{bandRanges[band]}</span>}
          </div>
        ))}

        {/* Data rows */}
        {matrixData.rows.map((row, ri) => (
          <div key={row.category || ri} className="heatmap-chart__row" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${ri * 60}ms, transform ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${ri * 60}ms`,
          }}>
            <div className="heatmap-chart__cat-cell">{row.category}</div>
            {(row.values || []).map((val, ci) => {
              const intensity = val / maxVal;
              return (
                <div
                  key={ci}
                  className="heatmap-chart__cell"
                  style={{
                    background: `linear-gradient(135deg, ${bandColors[ci]}${Math.round(Math.max(intensity * 80, 8)).toString(16).padStart(2, '0')}, ${bandColors[ci]}${Math.round(Math.max(intensity * 50, 5)).toString(16).padStart(2, '0')})`,
                    borderColor: `${bandColors[ci]}${Math.round(Math.max(intensity * 60, 10)).toString(16).padStart(2, '0')}`,
                    transform: visible ? 'scale(1)' : 'scale(0.9)',
                  }}
                  title={`${row.category} — ${bandKeys[ci]}: ${val} skills`}
                >
                  <span className="heatmap-chart__val">{val}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
