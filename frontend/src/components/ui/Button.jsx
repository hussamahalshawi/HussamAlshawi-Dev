/**
 * Button.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable button component with multiple variants.
 * Variants: primary (lime), ghost (outline), danger
 * Sizes:    sm, md (default), lg
 * ─────────────────────────────────────────────────────────
 */
import '../../styles/components/Button.css';              // Component styles

/**
 * @param {object}   props
 * @param {string}   [props.variant='primary'] - 'primary' | 'ghost' | 'danger'
 * @param {string}   [props.size='md']         - 'sm' | 'md' | 'lg'
 * @param {boolean}  [props.loading=false]     - Shows spinner
 * @param {boolean}  [props.disabled=false]    - Disables interaction
 * @param {string}   [props.href]              - Renders as <a> if provided
 * @param {string}   [props.className]         - Extra class names
 * @param {Function} [props.onClick]           - Click handler
 * @param {React.ReactNode} props.children     - Button label
 * @param {React.ReactNode} [props.icon]       - Optional icon (right side)
 */
export default function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  href,
  className = '',
  onClick,
  children,
  icon,
  ...rest
}) {
  // Build the CSS class list from props
  const classes = [
    'btn',
    `btn--${variant}`,              // e.g. btn--primary
    `btn--${size}`,                 // e.g. btn--md
    loading  ? 'btn--loading'  : '', // Spinner state
    disabled ? 'btn--disabled' : '', // Disabled state
    className,                      // Any extra classes passed in
  ].filter(Boolean).join(' ');     // Remove empty strings, join

  // Shared props for both <a> and <button>
  const sharedProps = {
    className: classes,
    onClick:   !disabled && !loading ? onClick : undefined, // Prevent click when busy
    ...rest,                        // Spread any extra HTML attributes
  };

  // Render as link if href provided
  if (href) {
    return (
      <a href={href} {...sharedProps}>
        {loading && <span className="btn__spinner" />}  {/* Spinner */}
        {children}
        {icon && <span className="btn__icon">{icon}</span>}
      </a>
    );
  }

  // Default: render as button
  return (
    <button
      type="button"
      disabled={disabled || loading}           // Native disabled
      {...sharedProps}
    >
      {loading && <span className="btn__spinner" />}    {/* Spinner */}
      {children}
      {icon && <span className="btn__icon">{icon}</span>} {/* Icon */}
    </button>
  );
}