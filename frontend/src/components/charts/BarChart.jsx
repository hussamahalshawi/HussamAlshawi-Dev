/**
 * BarChart.jsx
 * ─────────────────────────────────────────────────────────
 * Horizontal bar chart for displaying skill scores.
 * Uses Recharts library for rendering.
 * Props: data array of { name, value, color } objects
 * ─────────────────────────────────────────────────────────
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';                                          // Recharts components

import { CHART_COLORS } from '../../utils/constants';       // Shared color palette

/**
 * Custom tooltip component for bar chart hover state.
 * @param {object} props - Recharts tooltip props
 */
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;            // Only render when hovering

  return (
    <div style={{
      background:   'rgba(10, 13, 26, 0.96)',              // Dark glass background
      border:       '1px solid rgba(79,195,247,0.2)',       // Cyan border
      borderRadius: '8px',
      padding:      '0.6rem 1rem',
      fontSize:     '0.78rem',
      color:        '#E2E8F8',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Skill name label */}
      <div style={{ color: '#8899BB', fontSize: '0.68rem', marginBottom: '4px', letterSpacing: '0.08em' }}>
        {label}
      </div>
      {/* Score value */}
      <div style={{ color: payload[0]?.fill || '#4FC3F7', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem' }}>
        {payload[0]?.value}
        <span style={{ color: '#4A5678', fontSize: '0.65rem', marginLeft: '2px' }}>/100</span>
      </div>
    </div>
  );
}

/**
 * SkillBarChart — horizontal bar chart for skill comparisons.
 * @param {object}   props
 * @param {Array}    props.data    - [{ name, value, color }]
 * @param {number}   [props.height=300] - Chart height in px
 * @param {boolean}  [props.showGrid=true] - Show grid lines
 */
export default function SkillBarChart({
  data    = [],
  height  = 300,
  showGrid = true,
}) {
  // Guard: render empty state when no data provided
  if (!data.length) {
    return (
      <div style={{
        height,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#4A5678',
        fontSize:       '0.8rem',
        fontFamily:     'JetBrains Mono, monospace',
      }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"                                   // Horizontal bars layout
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {/* Optional grid lines */}
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"                 // Very subtle grid
            horizontal={false}                              // Only vertical lines for horizontal bar
          />
        )}

        {/* Y-axis: skill names */}
        <YAxis
          dataKey="name"
          type="category"
          tick={{
            fill:       '#8899BB',
            fontSize:   11,
            fontFamily: 'DM Sans, sans-serif',
          }}
          axisLine={false}                                  // Hide axis line
          tickLine={false}                                  // Hide tick marks
          width={90}                                        // Label column width
        />

        {/* X-axis: score values */}
        <XAxis
          type="number"
          domain={[0, 100]}                                 // Fixed 0-100 domain
          tick={{
            fill:       '#4A5678',
            fontSize:   10,
            fontFamily: 'JetBrains Mono, monospace',
          }}
          axisLine={false}
          tickLine={false}
        />

        {/* Tooltip on hover */}
        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(79,195,247,0.04)' }} />

        {/* Bar series with per-bar coloring */}
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}                            // Rounded right end
          maxBarSize={20}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}