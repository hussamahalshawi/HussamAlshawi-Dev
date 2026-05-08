/**
 * Card.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable card container with multiple display variants.
 * Wraps content with consistent dark background, border,
 * and optional hover/glow effects.
 * ─────────────────────────────────────────────────────────
 */
import '../styles/components/Card.css';                // Component styles

/**
 * @param {object}          props
 * @param {React.ReactNode} props.children     - Card content
 * @param {boolean}         [props.interactive] - Lift on hover
 * @param {boolean}         [props.accented]    - Top gradient bar
 * @param {boolean}         [props.revealBar]   - Bottom bar on hover
 * @param {boolean}         [props.glow]        - Lime glow overlay on hover
 * @param {string}          [props.className]   - Extra class names
 * @param {Function}        [props.onClick]     - Click handler
 * @param {object}          [props.style]       - Inline styles
 */
export default function Card({
  children,
  interactive = false,
  accented    = false,
  revealBar   = false,
  glow        = false,
  className   = '',
  onClick,
  style,
  ...rest
}) {
  // Build class list from boolean props
  const classes = [
    'card',
    interactive ? 'card--interactive' : '',  // Lift on hover
    accented    ? 'card--accented'    : '',  // Top gradient bar
    revealBar   ? 'card--reveal-bar'  : '',  // Bottom bar reveal
    glow        ? 'card--glow'        : '',  // Glow overlay
    className,                              // Extra classes
  ].filter(Boolean).join(' ');             // Clean and join

  return (
    <div
      className={classes}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}