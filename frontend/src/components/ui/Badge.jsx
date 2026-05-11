/**
 * Badge.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable badge / chip component for labels, status tags,
 * tech chips, proficiency bands, and category pills.
 *
 * Variants:  default | muted | success | warning | danger |
 *            info | gold | blue | expert | advanced |
 *            intermediate | beginner
 * Sizes:     xs | sm (default) | md | lg
 * Options:   pill (fully rounded) | dot (pulsing dot prefix)
 *
 * Usage examples:
 *   <Badge label="React" />
 *   <Badge label="Expert" variant="expert" />
 *   <Badge label="In Progress" variant="warning" dot />
 *   <Badge label="Available" variant="success" pill />
 *   <Badge label="Python" variant="default" size="md" />
 * ─────────────────────────────────────────────────────────
 */

import '../../styles/components/Badge.css'; // Import all badge styles

/* ── Allowed variant values ───────────────────────────────────── */
const VALID_VARIANTS = [
  'default',      // Cyan — general tags, tech labels
  'muted',        // Subtle — meta labels, counts
  'success',      // Green — active, complete, available
  'warning',      // Orange — in-progress, pending
  'danger',       // Red — errors, blocked, critical
  'info',         // Violet — info, categories
  'gold',         // Gold — achievements, featured
  'blue',         // Blue — intermediate, secondary
  'expert',       // Lime — skill band: expert
  'advanced',     // Cyan — skill band: advanced
  'intermediate', // Violet — skill band: intermediate
  'beginner',     // Gold — skill band: beginner
];

/* ── Allowed size values ──────────────────────────────────────── */
const VALID_SIZES = ['xs', 'sm', 'md', 'lg'];

/**
 * Badge — Compact label chip used throughout the portfolio UI.
 *
 * @param {object}  props
 * @param {string}  props.label      - Text content of the badge (required)
 * @param {string}  [props.variant]  - Color variant (default: 'default')
 * @param {string}  [props.size]     - Size variant (default: 'sm')
 * @param {boolean} [props.pill]     - If true, applies fully-rounded pill shape
 * @param {boolean} [props.dot]      - If true, shows a pulsing dot prefix
 * @param {string}  [props.className]- Additional CSS classes to merge
 * @param {object}  [props.style]    - Inline style overrides (e.g., custom color)
 * @param {string}  [props.title]    - Tooltip text for accessibility
 * @param {string}  [props.role]     - ARIA role override (defaults to 'status' if dot)
 *
 * @returns {JSX.Element|null} - Badge element or null if no label provided
 */
export default function Badge({
  label,                    // Text displayed inside the badge
  variant    = 'default',   // Color variant — falls back to 'default' if invalid
  size       = 'sm',        // Size variant — falls back to 'sm' if invalid
  pill       = false,       // Whether to use fully-rounded pill shape
  dot        = false,       // Whether to show a pulsing status dot
  className  = '',          // Additional CSS classes passed from parent
  style      = {},          // Inline style overrides
  title,                    // Optional tooltip text
  role,                     // Optional ARIA role override
  ...rest                   // Any remaining props spread onto the element
}) {

  /* ── Guard: return null if no label is provided ────────────── */
  if (!label && label !== 0) return null;       // Accept 0 as valid label

  /* ── Sanitize variant — fall back to 'default' if invalid ──── */
  const safeVariant = VALID_VARIANTS.includes(variant)
    ? variant                                   // Use provided variant
    : 'default';                                // Fallback to default

  /* ── Sanitize size — fall back to 'sm' if invalid ──────────── */
  const safeSize = VALID_SIZES.includes(size)
    ? size                                      // Use provided size
    : 'sm';                                     // Fallback to small

  /* ── Build CSS class list dynamically ──────────────────────── */
  const classes = [
    'badge',                                    // Base class always present
    `badge--${safeVariant}`,                    // Variant class (color)
    safeSize !== 'sm' ? `badge--${safeSize}` : '', // Size class (skip for default sm)
    pill       ? 'badge--pill'     : '',        // Pill shape modifier
    dot        ? 'badge--dot'      : '',        // Dot prefix modifier
    className,                                  // Any extra classes from parent
  ]
    .filter(Boolean)                            // Remove empty strings
    .join(' ');                                 // Join into a single class string

  /* ── Determine ARIA role ────────────────────────────────────── */
  const ariaRole = role || (dot ? 'status' : undefined); // 'status' for live dot badges

  return (
    <span
      className={classes}
      style={style}
      title={title}
      role={ariaRole}
      aria-label={title || label}               /* Accessible label for screen readers */
      {...rest}                                  /* Spread remaining props */
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   BadgeGroup — Renders an array of badges in a flex wrap row.
   Useful for skill chips, tech stack tags, and category lists.
───────────────────────────────────────────────────────────── */
/**
 * BadgeGroup — Wraps multiple Badge components in a flex container.
 *
 * @param {object}   props
 * @param {Array}    props.items      - Array of badge config objects
 * @param {string}   [props.variant]  - Default variant applied to all badges
 * @param {string}   [props.size]     - Default size applied to all badges
 * @param {boolean}  [props.pill]     - Apply pill shape to all badges
 * @param {string}   [props.gap]      - CSS gap between badges (default: 'var(--s2)')
 * @param {string}   [props.className]- Extra class for the wrapper div
 *
 * items shape: { label, variant?, size?, pill?, dot?, style?, key? }
 *
 * @returns {JSX.Element}
 */
export function BadgeGroup({
  items     = [],                               // Array of badge config objects
  variant,                                      // Default variant for all badges
  size,                                         // Default size for all badges
  pill      = false,                            // Apply pill shape to all
  gap       = 'var(--s2)',                      // Gap between badges
  className = '',                               // Extra wrapper class
}) {

  /* ── Guard: return null if no items ───────────────────────── */
  if (!items?.length) return null;

  return (
    <div
      className={`badge-group ${className}`.trim()}  /* Wrapper class */
      style={{
        display:   'flex',                      /* Flex layout for wrapping */
        flexWrap:  'wrap',                      /* Allow badges to wrap */
        gap,                                    /* Spacing from prop */
        alignItems:'center',                    /* Vertical alignment */
      }}
      role="list"                               /* Semantic list role */
      aria-label="Badge group"                  /* Accessible label */
    >
      {items.map((item, index) => (
        <span key={item.key || item.label || index} role="listitem">
          <Badge
            label={item.label}                  /* Badge text */
            variant={item.variant || variant}   /* Item variant > group default */
            size={item.size     || size}        /* Item size > group default */
            pill={item.pill  ?? pill}           /* Item pill > group default */
            dot={item.dot    || false}          /* Item dot flag */
            style={item.style   || {}}          /* Item inline styles */
            title={item.title}                  /* Item tooltip */
          />
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SkillBandBadge — Convenience wrapper that auto-selects
   the correct variant based on skill score range.
   Uses SKILL_BANDS threshold logic from constants.js.
───────────────────────────────────────────────────────────── */
/**
 * SkillBandBadge — Renders a badge with the correct proficiency band style.
 *
 * @param {object} props
 * @param {number} props.score   - Skill score 0–100
 * @param {string} [props.label] - Override label (defaults to band name)
 * @param {string} [props.size]  - Size variant
 * @param {boolean}[props.pill]  - Pill shape
 *
 * @returns {JSX.Element}
 */
export function SkillBandBadge({ score = 0, label, size = 'sm', pill = false }) {

  /* ── Determine band from score ─────────────────────────────── */
  let band;                                     // Will hold the resolved band key

  if      (score >= 80) band = 'expert';        // 80-100: Expert
  else if (score >= 60) band = 'advanced';      // 60-79: Advanced
  else if (score >= 40) band = 'intermediate';  // 40-59: Intermediate
  else                  band = 'beginner';      // 0-39: Beginner

  /* ── Map band key to display label ────────────────────────── */
  const bandLabels = {
    expert:       'Expert',       // Display label for expert band
    advanced:     'Advanced',     // Display label for advanced band
    intermediate: 'Intermediate', // Display label for intermediate band
    beginner:     'Beginner',     // Display label for beginner band
  };

  return (
    <Badge
      label={label || bandLabels[band]}         /* Use override or auto label */
      variant={band}                            /* Variant = band key */
      size={size}                               /* Pass through size */
      pill={pill}                               /* Pass through pill */
      title={`Score: ${score}% — ${bandLabels[band]}`} /* Tooltip with score */
    />
  );
}