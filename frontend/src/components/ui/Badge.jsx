/**
 * Badge.jsx
 * ─────────────────────────────────────────────────────────
 * Small status/tag badge component.
 * Used for: skill types, goal status, project type, etc.
 * Supports inline color via style prop from API data.
 * ─────────────────────────────────────────────────────────
 */

/**
 * @param {object} props
 * @param {string} props.label       - Text to display
 * @param {string} [props.bg]        - Background color from API (e.g. "#E6F1FB")
 * @param {string} [props.color]     - Text color from API     (e.g. "#185FA5")
 * @param {string} [props.border]    - Border color from API   (e.g. "#B5D4F4")
 * @param {string} [props.variant]   - Preset variant: 'lime' | 'cyan' | 'muted'
 * @param {string} [props.className] - Extra class names
 */
export default function Badge({
  label,
  bg,
  color,
  border,
  variant,
  className = '',
}) {
  // Preset variant styles (fallback when no API colors provided)
  const variants = {
    lime: {
      background:  'rgba(200, 255, 87, 0.1)',
      color:       '#C8FF57',
      border:      '1px solid rgba(200, 255, 87, 0.2)',
    },
    cyan: {
      background:  'rgba(0, 229, 255, 0.1)',
      color:       '#00E5FF',
      border:      '1px solid rgba(0, 229, 255, 0.2)',
    },
    muted: {
      background:  'rgba(255, 255, 255, 0.05)',
      color:       '#9BA3C0',
      border:      '1px solid rgba(255, 255, 255, 0.08)',
    },
  };

  // Inline styles: API colors take precedence over variant presets
  const inlineStyle = bg || color
    ? {
        background:  bg     || 'transparent',
        color:       color  || '#9BA3C0',
        border:      border ? `1px solid ${border}` : undefined,
      }
    : variants[variant] || variants.muted;  // Fall back to muted if no variant

  return (
    <span
      className={`badge ${className}`}
      style={{
        display:        'inline-block',
        fontSize:       '0.65rem',
        fontWeight:     600,
        letterSpacing:  '0.09em',
        textTransform:  'uppercase',
        padding:        '0.22rem 0.65rem',
        borderRadius:   '2px',
        lineHeight:     1.4,
        whiteSpace:     'nowrap',
        ...inlineStyle,             // Apply computed styles
      }}
    >
      {label}
    </span>
  );
}