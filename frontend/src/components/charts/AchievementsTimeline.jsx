import { useRef, useEffect, useState } from 'react';
import { CHART_ANIMATION, createChartObserver } from '../../utils/chartConfig';
import '../../styles/charts/AchievementsTimeline.css';

const ACHIEVEMENT_COLORS = ['#1D9E75', '#378ADD', '#7F77DD', '#BA7517', '#D85A30', '#F06292', '#F5A623', '#4ECCA3'];

export default function AchievementsTimeline({ byYear = [] }) {
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
