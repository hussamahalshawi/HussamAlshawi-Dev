/**
 * SkeletonLoader.jsx
 * ─────────────────────────────────────────────────────────
 * Animated loading placeholder that matches the shape of
 * the content being loaded. Prevents layout shifts.
 * ─────────────────────────────────────────────────────────
 */

/**
 * Single skeleton block.
 * @param {object} props
 * @param {string}  [props.width='100%']    - Width (CSS value)
 * @param {string}  [props.height='1rem']   - Height (CSS value)
 * @param {string}  [props.borderRadius='3px'] - Border radius
 * @param {string}  [props.className]       - Extra class names
 * @param {object}  [props.style]           - Extra inline styles
 */
export function SkeletonBlock({
  width        = '100%',
  height       = '1rem',
  borderRadius = '3px',
  className    = '',
  style        = {},
}) {
  return (
    <div
      className={`skeleton ${className}`}    // Uses global .skeleton animation
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

/**
 * Pre-built skeleton for a section header (tag + title + subtitle).
 */
export function SkeletonSectionHead() {
  return (
    <div style={{ marginBottom: '3.5rem' }}>
      <SkeletonBlock width="80px"  height="0.7rem" style={{ marginBottom: '0.8rem' }} />
      <SkeletonBlock width="260px" height="3rem"   style={{ marginBottom: '0.8rem' }} />
      <SkeletonBlock width="420px" height="0.9rem" />
    </div>
  );
}

/**
 * Pre-built skeleton for a card grid.
 * @param {number} count - Number of skeleton cards to render
 * @param {string} height - Card height
 */
export function SkeletonCardGrid({ count = 3, height = '200px' }) {
  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap:                 '1.5rem',
    }}>
      {Array.from({ length: count }, (_, i) => ( // Create `count` skeleton cards
        <SkeletonBlock key={i} height={height} />
      ))}
    </div>
  );
}

/**
 * Pre-built skeleton for a KPI card.
 */
export function SkeletonKPI() {
  return (
    <div style={{ padding: '1.5rem 1.8rem' }}>
      <SkeletonBlock width="80px"  height="0.72rem" style={{ marginBottom: '0.8rem' }} />
      <SkeletonBlock width="120px" height="2.8rem"  />
    </div>
  );
}

/**
 * Pre-built skeleton for a skill bar row.
 */
export function SkeletonSkillRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
      <SkeletonBlock width="110px" height="0.88rem" />   {/* Skill name */}
      <SkeletonBlock height="3px"  style={{ flex: 1 }} /> {/* Track */}
      <SkeletonBlock width="30px"  height="0.68rem" />   {/* Percentage */}
    </div>
  );
}

/**
 * Pre-built skeleton for a timeline item.
 */
export function SkeletonTimelineItem() {
  return (
    <div style={{ marginBottom: '3rem', paddingLeft: '0.5rem' }}>
      <SkeletonBlock width="120px" height="0.7rem"  style={{ marginBottom: '0.6rem' }} />
      <SkeletonBlock width="220px" height="1.4rem"  style={{ marginBottom: '0.4rem' }} />
      <SkeletonBlock width="140px" height="0.85rem" style={{ marginBottom: '0.8rem' }} />
      <SkeletonBlock width="100%"  height="0.85rem" style={{ marginBottom: '0.4rem' }} />
      <SkeletonBlock width="80%"   height="0.85rem" />
    </div>
  );
}

// Default export: the basic block for custom shapes
export default SkeletonBlock;