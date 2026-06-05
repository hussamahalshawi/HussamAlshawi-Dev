import { useRef, useEffect, useState, useMemo } from 'react';
import { CHART_ANIMATION, createChartObserver } from '../../utils/chartConfig';
import '../../styles/charts/SkillBulletChart.css';

const GAP_COLORS = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30'];

function getSkillColor(gap) {
  if (gap <= 10) return GAP_COLORS[0];
  if (gap <= 25) return GAP_COLORS[1];
  if (gap <= 45) return GAP_COLORS[2];
  return GAP_COLORS[3];
}

export default function SkillBulletChart({ goals = [] }) {
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  const data = useMemo(() => {
    return goals.map(g => ({
      label: g.goal_name,
      skills: (g.skill_gaps || []).map(sg => ({
        name: sg.skill_name,
        current: sg.current_score || 0,
        target: sg.required_score || 100,
        gap: sg.gap || (sg.required_score - sg.current_score) || 0,
        color: getSkillColor(sg.gap || (sg.required_score - sg.current_score) || 50),
      })),
    }));
  }, [goals]);

  if (data.length === 0) {
    return (
      <div className="skill-bullet skill-bullet--empty" ref={wrapRef}>
        <span>No skill gap data available</span>
      </div>
    );
  }

  return (
    <div
      className="skill-bullet"
      ref={wrapRef}
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing}` }}
    >
      {data.map((goal, gi) => (
        <div key={goal.label || gi} className="skill-bullet__group">
          <div className="skill-bullet__header">{goal.label}</div>
          <div className="skill-bullet__divider" />
          {goal.skills.map((sk, si) => {
            const pct = Math.min((sk.current / sk.target) * 100, 100);
            const targetPct = Math.min((sk.target / 100) * 100, 100);
            return (
              <div key={sk.name || si} className="skill-bullet__row">
                <div className="skill-bullet__label">{sk.name}</div>
                <div className="skill-bullet__track">
                  <div className="skill-bullet__bg" />
                  <div
                    className="skill-bullet__fill skill-bullet__fill--bg"
                    style={{ width: `${pct}%`, background: `${sk.color}22`, borderColor: `${sk.color}44` }}
                  />
                  <div
                    className="skill-bullet__fill skill-bullet__fill--mid"
                    style={{ width: `${Math.round(pct * 0.7)}%`, background: `${sk.color}99` }}
                  />
                  <div
                    className="skill-bullet__fill skill-bullet__fill--fg"
                    style={{ width: `${Math.round(pct * 0.45)}%`, background: sk.color }}
                  />
                  <div className="skill-bullet__target" style={{ left: `${targetPct}%` }} />
                </div>
                <div className="skill-bullet__val" style={{ color: sk.color }}>{sk.current}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
