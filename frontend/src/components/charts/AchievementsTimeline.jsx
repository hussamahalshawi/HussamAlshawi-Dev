import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver } from '../../utils/chartConfig';
import '../../styles/charts/AchievementsTimeline.css';

const DARK_ACHIEVE = ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'];
const LIGHT_ACHIEVE = ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'];

export default function AchievementsTimeline({ byYear = [] }) {
  const { isDark } = useTheme();
  const ACHIEVEMENT_COLORS = useMemo(() => isDark ? DARK_ACHIEVE : LIGHT_ACHIEVE, [isDark]);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  const items = [];
  byYear.forEach(y => {
    (y.achievements || []).forEach(a => {
      items.push({
        year: y.year,
        title: a.title,
        org: a.issuing_organization,
        color: a.color || ACHIEVEMENT_COLORS[items.length % ACHIEVEMENT_COLORS.length],
      });
    });
  });

  if (items.length === 0) {
    return (
      <div className="achievements-timeline achievements-timeline--empty" ref={wrapRef}>
        <span>No achievements data available</span>
      </div>
    );
  }

  return (
    <div
      className="achievements-timeline"
      ref={wrapRef}
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing}` }}
    >
      {items.map((item, i) => (
        <div key={`${item.year}-${i}`} className="tl-item">
          <div className="tl-dot" style={{ background: item.color }} />
          <div className="tl-year">{item.year}</div>
          <div>
            <div className="tl-content">{item.title}</div>
            <div className="tl-org">{item.org}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
