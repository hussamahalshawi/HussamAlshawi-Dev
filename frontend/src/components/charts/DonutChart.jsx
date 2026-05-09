/**
 * DonutChart.jsx
 * ─────────────────────────────────────────────────────────
 * Animated donut/pie chart for displaying distributions.
 * Used for: skills proficiency bands, goals by status, etc.
 * Uses Recharts PieChart internally.
 * ─────────────────────────────────────────────────────────
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'; // Recharts pie
import { CHART_COLORS }                                                        from '../../utils/constants'; // Color palette

/**
 * Custom tooltip for donut chart.
 * @param {object} props - Recharts tooltip props
 */
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;            // Only render on hover

  const item = payload[0];                                 // Extract first payload item

  return (
    <div style={{
      background:     'rgba(10, 13, 26, 0.96)',
      border:         '1px solid rgba(79,195,247,0.2)',
      borderRadius:   '8px',
      padding:        '0.6rem 1rem',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Category name */}
      <div style={{ color: '#8899BB', fontSize: '0.68rem', letterSpacing: '0.08em', marginBottom: '3px' }}>
        {item.name}
      </div>
      {/* Value with color */}
      <div style={{ color: item.payload.fill, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem' }}>
        {item.value}
        {/* Percentage */}
        <span style={{ color: '#4A5678', fontSize: '0.65rem', marginLeft: '4px' }}>
          ({item.payload.percent ? `${(item.payload.percent * 100).toFixed(0)}%` : ''})
        </span>
      </div>
    </div>
  );
}

/**
 * CustomLegend — renders color-dot + label legend below chart.
 * @param {Array} data - Chart data items with name and fill
 */
function CustomLegend({ data }) {
  return (
    <div style={{
      display:        'flex',
      flexWrap:       'wrap',
      gap:            '0.5rem 1rem',
      justifyContent: 'center',
      marginTop:      '1rem',
    }}>
      {data.map((item, i) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Color dot */}
          <div style={{
            width:        '7px',
            height:       '7px',
            borderRadius: '50%',
            background:   item.fill || CHART_COLORS[i % CHART_COLORS.length],
            flexShrink:   0,
            boxShadow:    `0 0 6px ${item.fill || CHART_COLORS[i % CHART_COLORS.length]}`,
          }} />
          {/* Label text */}
          <span style={{ fontSize: '0.72rem', color: '#8899BB', fontFamily: 'DM Sans, sans-serif' }}>
            {item.name}
          </span>
          {/* Value */}
          <span style={{
            fontSize:   '0.68rem',
            color:      item.fill || CHART_COLORS[i % CHART_COLORS.length],
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
          }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * SkillDonutChart — animated donut chart with custom legend.
 * @param {object}   props
 * @param {Array}    props.data        - [{ name, value, fill? }]
 * @param {number}   [props.size=220]  - Outer radius in px
 * @param {number}   [props.thickness=28] - Ring thickness
 * @param {boolean}  [props.showLegend=true] - Show legend below
 * @param {string}   [props.centerLabel] - Text in donut center
 * @param {number}   [props.height=260] - Total chart container height
 */
export default function SkillDonutChart({
  data         = [],
  size         = 90,                                       // Outer radius percentage
  thickness    = 28,
  showLegend   = true,
  centerLabel  = null,
  height       = 260,
}) {
  // Guard: render empty state when no data
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

  // Enrich data with fill colors if missing
  const enrichedData = data.map((item, i) => ({
    ...item,
    fill: item.fill || CHART_COLORS[i % CHART_COLORS.length], // Assign color
  }));

  // Calculate inner radius from thickness
  const outerRadius = size;                                // Outer ring size
  const innerRadius = size - thickness;                    // Inner hole size

  return (
    <div style={{ width: '100%' }}>
      {/* Chart wrapper */}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          {/* Tooltip */}
          <Tooltip content={<DonutTooltip />} />

          {/* Donut pie */}
          <Pie
            data={enrichedData}
            cx="50%"
            cy="50%"
            outerRadius={`${outerRadius}%`}               // Responsive outer size
            innerRadius={`${innerRadius}%`}               // Responsive inner hole
            dataKey="value"
            paddingAngle={3}                              // Gap between segments
            startAngle={90}                               // Start from top
            endAngle={-270}                               // Full circle clockwise
            strokeWidth={0}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {enrichedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}                         // Per-segment color
                opacity={0.9}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend below chart */}
      {showLegend && <CustomLegend data={enrichedData} />}
    </div>
  );
}