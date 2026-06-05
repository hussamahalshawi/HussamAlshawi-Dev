import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver } from '../../utils/chartConfig';
import '../../styles/charts/SunburstChart.css';

const CAT_COLORS = ['#378ADD', '#1D9E75', '#7F77DD', '#BA7517', '#D4537E', '#F5A623', '#F06292', '#4ECCA3'];

const BAND_COLORS = ['#1D9E75', '#378ADD', '#BA7517', '#D85A30'];
const BAND_LABELS = ['Expert', 'Advanced', 'Intermediate', 'Beginner'];

function getBandIndex(score) {
  if (score >= 80) return 0;
  if (score >= 60) return 1;
  if (score >= 40) return 2;
  return 3;
}

function polarXY(cx, cy, r, a) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function polarPath(cx, cy, r1, r2, startA, endA) {
  const s1 = polarXY(cx, cy, r1, startA);
  const e1 = polarXY(cx, cy, r1, endA);
  const s2 = polarXY(cx, cy, r2, startA);
  const e2 = polarXY(cx, cy, r2, endA);
  const large = (endA - startA) > Math.PI ? 1 : 0;
  return `M${s1.x},${s1.y} A${r1},${r1} 0 ${large} 1 ${e1.x},${e1.y} L${e2.x},${e2.y} A${r2},${r2} 0 ${large} 0 ${s2.x},${s2.y} Z`;
}

function hexAlpha(hex, a) {
  return hex + Math.round(a * 255).toString(16).padStart(2, '0');
}

export default function SunburstChart({ skillsByType = [] }) {
  const { isDark } = useTheme();
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  const { catSegments, totalSkills } = useMemo(() => {
    if (!skillsByType || skillsByType.length === 0) return { catSegments: [], totalSkills: 0 };

    const total = skillsByType.reduce((s, c) => s + (c.skills?.length || 0), 0);
    const segs = [];
    let angle = -Math.PI / 2;

    skillsByType.forEach((cat, ci) => {
      const catColor = CAT_COLORS[ci % CAT_COLORS.length];
      const skills = cat.skills || [];
      const catPct = skills.length / Math.max(total, 1);
      if (catPct < 0.01) return;

      const catEnd = angle + catPct * 2 * Math.PI;
      const catMid = (angle + catEnd) / 2;

      const skillSegments = [];
      const skillAngleStep = Math.max((catEnd - angle - 0.02) / skills.length, 0.01);

      skills.forEach((sk, si) => {
        const sStart = angle + si * skillAngleStep;
        const sEnd = sStart + skillAngleStep;
        const sMid = (sStart + sEnd) / 2;
        const bandIdx = getBandIndex(sk.score);
        skillSegments.push({
          startA: sStart,
          endA: sEnd,
          midA: sMid,
          name: sk.skill_name,
          score: sk.score,
          bandColor: BAND_COLORS[bandIdx],
          bandIdx,
        });
      });

      segs.push({
        startA: angle,
        endA: catEnd,
        midA: catMid,
        label: cat.type,
        color: catColor,
        skills: skillSegments,
        pct: catPct,
      });
      angle = catEnd;
    });

    return { catSegments: segs, totalSkills: total };
  }, [skillsByType]);

  const CX = 190;
  const CY = 190;
  const R1 = 55;
  const R2 = 115;
  const R3 = 170;
  const SVG_SIZE = 380;

  if (catSegments.length === 0) {
    return (
      <div className="sunburst-chart sunburst-chart--empty" ref={wrapRef}>
        <span>No skills data available</span>
      </div>
    );
  }

  const textFill = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
  const textFillMuted = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  return (
    <div
      className="sunburst-chart"
      ref={wrapRef}
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing}` }}
    >
      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} role="img" aria-label="Skills hierarchy sunburst chart">
        {/* Ring 1: Categories */}
        {catSegments.map((cat, ci) => (
          <path
            key={`cat-${ci}`}
            d={polarPath(CX, CY, R1, R2, cat.startA, cat.endA - 0.02)}
            fill={cat.color}
            stroke={isDark ? '#1a1a2e' : '#fff'}
            strokeWidth={1.5}
            opacity={0.85}
          >
            <title>{cat.label}</title>
          </path>
        ))}

        {/* Category labels */}
        {catSegments.map((cat, ci) => {
          if (cat.pct < 0.12) return null;
          const pos = polarXY(CX, CY, (R1 + R2) / 2, cat.midA);
          return (
            <text
              key={`cat-lbl-${ci}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={600}
              fill="#fff"
            >
              {cat.label.length > 10 ? cat.label.slice(0, 9) + '…' : cat.label}
            </text>
          );
        })}

        {/* Ring 2: Skills */}
        {catSegments.map((cat, ci) =>
          cat.skills.map((sk, si) => (
            <path
              key={`skill-${ci}-${si}`}
              d={polarPath(CX, CY, R2, R3, sk.startA, sk.endA - 0.01)}
              fill={hexAlpha(sk.bandColor, 0.7)}
              stroke={isDark ? '#1a1a2e' : '#fff'}
              strokeWidth={0.8}
            >
              <title>{sk.name}: {sk.score}</title>
            </path>
          ))
        )}

        {/* Skill labels where space permits */}
        {catSegments.map((cat, ci) =>
          cat.skills.map((sk, si) => {
            const angleSpan = sk.endA - sk.startA;
            if (angleSpan < 0.2) return null;
            const pos = polarXY(CX, CY, (R2 + R3) / 2, sk.midA);
            const shortName = sk.name.length > 7 ? sk.name.slice(0, 6) + '…' : sk.name;
            return (
              <text
                key={`skill-lbl-${ci}-${si}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill={textFill}
              >
                {shortName}
              </text>
            );
          })
        )}

        {/* Center circle */}
        <circle cx={CX} cy={CY} r={R1 - 2} fill={isDark ? '#1a1a2e' : '#fff'} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth={1} />

        <text x={CX} y={CY - 8} textAnchor="middle" fontSize={22} fontWeight={700} fill={textFill}>
          {totalSkills}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize={10} fill={textFillMuted}>
          skills
        </text>

        {/* Band legend */}
        {BAND_LABELS.map((lbl, i) => (
          <g key={`band-${i}`}>
            <rect x={SVG_SIZE - 105} y={12 + i * 20} width={10} height={10} rx={2} fill={BAND_COLORS[i] + 'BB'} />
            <text x={SVG_SIZE - 90} y={21 + i * 20} fontSize={10} fill={textFillMuted}>
              {lbl}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
