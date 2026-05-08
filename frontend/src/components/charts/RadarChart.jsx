/**
 * RadarChart.jsx
 * ─────────────────────────────────────────────────────────
 * Radar chart for skill category averages.
 * Uses Recharts library — must be installed (recharts).
 * Props: data from /api/portfolio/analytics → skills_radar
 * ─────────────────────────────────────────────────────────
 */
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

/**
 * Custom tooltip for the radar chart.
 */
function RadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;  // Only render when hovering

  return (
    <div style={{
      background:   'rgba(24, 27, 36, 0.95)',
      border:       '1px solid rgba(255,255,255,0.1)',
      borderRadius: '4px',
      padding:      '0.6rem 1rem',
      fontSize:     '0.8rem',
      color:        '#E8EAF2',
    }}>
      <div style={{ color: '#9BA3C0', fontSize: '0.7rem', marginBottom: '2px' }}>
        {payload[0].payload.category}          {/* Category name */}
      </div>
      <div style={{ color: '#C8FF57', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
        {payload[0].value}                     {/* Score value */}
        <span style={{ color: '#6B7280', fontSize: '0.65rem' }}>/100</span>
      </div>
    </div>
  );
}

/**
 * @param {object}   props
 * @param {Array}    props.data    - [{ category, avg_score, count }]
 * @param {string}   [props.color='#C8FF57'] - Line/dot color
 * @param {string}   [props.fill='#C8FF57']  - Fill color (with low opacity)
 * @param {number}   [props.height=260]      - Chart height in px
 */
export default function SkillRadarChart({
  data    = [],
  color   = '#C8FF57',
  fill    = '#C8FF57',
  height  = 260,
}) {
  // Guard: don't render empty chart
  if (!data.length) {
    return (
      <div style={{
        height,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#353A52',
        fontSize:       '0.8rem',
      }}>
        No skill data available
      </div>
    );
  }

  // Recharts expects { category, avg_score } — already correct from API
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        {/* Polar grid lines */}
        <PolarGrid
          stroke="rgba(255,255,255,0.06)"    // Very subtle grid
          strokeDasharray="0"                 // Solid lines
        />

        {/* Category labels on the perimeter */}
        <PolarAngleAxis
          dataKey="category"                 // Map to category field
          tick={{
            fill:       '#9BA3C0',           // Muted text color
            fontSize:   10,
            fontFamily: 'Outfit, sans-serif',
          }}
        />

        {/* The radar shape */}
        <Radar
          name="Score"
          dataKey="avg_score"                // Map to avg_score field
          stroke={color}                     // Border color
          fill={fill}                        // Fill color
          fillOpacity={0.12}                 // Very transparent fill
          strokeWidth={1.5}
          dot={{ fill: color, r: 3 }}        // Dots at each point
          activeDot={{ fill: color, r: 5, strokeWidth: 0 }} // Hover dot
        />

        {/* Custom tooltip on hover */}
        <Tooltip content={<RadarTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}