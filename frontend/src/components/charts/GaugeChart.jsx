import { useRef, useEffect, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_ANIMATION, createChartObserver, getChartTheme } from '../../utils/chartConfig';
import '../../styles/charts/GaugeChart.css';

export default function GaugeChart({ value = 0, maxValue = 100, label = 'Progress', subLabel = '', size = 180 }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const pct = Math.min(Math.max(value / maxValue, 0), 1);
  const angle = pct * 180;
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size * 0.52;

  const color = pct >= 0.8 ? '#4ECCA3' : pct >= 0.5 ? '#4FC3F7' : pct >= 0.25 ? '#F5A623' : '#F06292';

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  return (
    <div className="gauge-chart" ref={wrapRef}>
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`} className="gauge-chart__svg">
        {/* Background arc */}
        <path
          d={describeArc(cx, cy, radius, 0, 180)}
          stroke={theme.track}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={describeArc(cx, cy, radius, 0, 180)}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${visible ? pct * Math.PI * radius : 0} ${Math.PI * radius}`}
          style={{
            transition: visible
              ? `stroke-dasharray ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing}`
              : 'none',
          }}
        />
        {/* Center value */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle" dominantBaseline="central"
          fill={color}
          fontSize={28}
          fontFamily="'Syne', sans-serif"
          fontWeight={800}
        >
          {visible ? Math.round(pct * 100) : 0}%
        </text>
        {/* Sub label */}
        {subLabel && (
          <text
            x={cx} y={cy + 20}
            textAnchor="middle" dominantBaseline="central"
            fill={theme.labelMuted}
            fontSize={11}
            fontFamily="'DM Sans', sans-serif"
          >
            {subLabel}
          </text>
        )}
      </svg>
      <div className="gauge-chart__label">{label}</div>
    </div>
  );
}
