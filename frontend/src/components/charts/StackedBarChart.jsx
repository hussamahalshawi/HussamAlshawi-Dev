import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver, getChartTheme, normalizeBarData } from '../../utils/chartConfig';
import '../../styles/charts/StackedBarChart.css';

export default function StackedBarChart({ data = [], barKey, stackKeys = [], stackColors = {}, showLegend = true }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  if (data.length === 0 || stackKeys.length === 0) {
    return (
      <div className="stacked-bar stacked-bar--empty" ref={wrapRef}>
        <span>No data available</span>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => stackKeys.reduce((s, k) => s + (d[k] || 0), 0)), 1);

  return (
    <div className="stacked-bar" ref={wrapRef}>
      <div className="stacked-bar__rows">
        {data.map((item, i) => {
          const total = stackKeys.reduce((s, k) => s + (item[k] || 0), 0);
          let cumPct = 0;
          return (
            <div
              key={item[barKey] || i}
              className="stacked-bar__row"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-8px)',
                transition: `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 50}ms, transform ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 50}ms`,
              }}
            >
              <span className="stacked-bar__label">{item[barKey]}</span>
              <div className="stacked-bar__track">
                {stackKeys.map((k, si) => {
                  const val = item[k] || 0;
                  const pct = (val / maxTotal) * 100;
                  const x = cumPct;
                  cumPct += pct;
                  return (
                    <div
                      key={k}
                      className="stacked-bar__seg"
                      style={{
                        left: `${x}%`,
                        width: `${pct}%`,
                        background: stackColors[k] || '#4FC3F7',
                        transition: visible
                          ? `width ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 50 + si * 30}ms`
                          : 'none',
                      }}
                      title={`${item[barKey]} — ${k}: ${val}`}
                    />
                  );
                })}
              </div>
              <span className="stacked-bar__total">{total}</span>
            </div>
          );
        })}
      </div>
      {showLegend && (
        <div className="stacked-bar__legend">
          {stackKeys.map(k => (
            <div key={k} className="stacked-bar__legend-item">
              <span className="stacked-bar__legend-dot" style={{ background: stackColors[k] || '#4FC3F7' }} />
              <span className="stacked-bar__legend-label">{k}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
