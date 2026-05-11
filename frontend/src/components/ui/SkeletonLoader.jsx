/**
 * SkeletonLoader.jsx
 * ─────────────────────────────────────────────────────────
 * Shimmer skeleton components used as loading placeholders
 * while individual section data is being fetched.
 *
 * Each skeleton mirrors the exact dimensions and layout
 * of its corresponding real component, so the UI doesn't
 * "jump" when real data replaces the skeleton.
 *
 * Exported components:
 *   SkeletonKPI          — Analytics/Overview KPI card
 *   SkeletonProfile      — Overview profile card (left panel)
 *   SkeletonSkillRow     — Skill bar row (any skills list)
 *   SkeletonSkillList    — Multiple skill rows at once
 *   SkeletonProject      — Project grid card
 *   SkeletonProjectGrid  — Full project grid (multiple cards)
 *   SkeletonExperience   — Experience timeline item
 *   SkeletonPanel        — Generic glass panel placeholder
 *   SkeletonSectionHead  — Section header (tag + title + sub)
 *
 * Usage:
 *   if (!analytics) return <SkeletonKPI count={8} />;
 *   if (!skills)    return <SkeletonSkillList count={5} />;
 * ─────────────────────────────────────────────────────────
 */

import '../../styles/components/SkeletonLoader.css'; // Import all skeleton styles

/* ─────────────────────────────────────────────────────────────
   INTERNAL HELPER: SkeletonShimmer
   Renders a single shimmer block with specified dimensions.
   Used as a building block inside all skeleton components.
───────────────────────────────────────────────────────────── */
/**
 * SkeletonShimmer — A single animated shimmer block.
 *
 * @param {object} props
 * @param {string} [props.width]     - CSS width (e.g., '100%', '80px')
 * @param {string} [props.height]    - CSS height (e.g., '14px', '36px')
 * @param {string} [props.className] - Additional CSS classes
 * @param {object} [props.style]     - Inline style overrides
 * @returns {JSX.Element}
 */
function SkeletonShimmer({ width, height, className = '', style = {} }) {
  return (
    <div
      className={`skeleton-block ${className}`.trim()}  /* Apply shimmer animation */
      style={{ width, height, ...style }}                /* Dimensions from props */
      aria-hidden="true"                                 /* Decorative — hidden from screen readers */
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonKPI
   Placeholder for a single KPI card in the analytics bento grid.
   Mirrors: .analytics-kpi-card in AnalyticsSection.jsx
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonKPI — Single KPI card shimmer placeholder.
 *
 * @param {object} props
 * @param {number} [props.count=1] - How many KPI cards to render
 * @returns {JSX.Element|JSX.Element[]}
 */
export function SkeletonKPI({ count = 1 }) {
  /* Render a single card */
  const card = (key) => (
    <div
      key={key}
      className="skeleton-kpi"                           /* Card shell */
      aria-hidden="true"                                 /* Hidden from screen readers */
    >
      {/* Icon placeholder */}
      <SkeletonShimmer className="skeleton-kpi__icon" />

      {/* Number placeholder */}
      <SkeletonShimmer className="skeleton-kpi__num" />

      {/* Label placeholder */}
      <SkeletonShimmer className="skeleton-kpi__label" />
    </div>
  );

  /* Return multiple cards if count > 1 */
  if (count === 1) return card(0);                       // Single card, no key needed
  return Array.from({ length: count }, (_, i) => card(i)); // Array of cards
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonProfile
   Placeholder for the Profile Card in OverviewSection.
   Mirrors: .profile-card in OverviewSection.jsx
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonProfile — Profile card shimmer placeholder.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export function SkeletonProfile() {
  return (
    <div
      className="skeleton-profile"                       /* Card shell centered */
      aria-hidden="true"                                 /* Decorative */
      role="presentation"                                /* No semantic role */
    >
      {/* Avatar circle */}
      <SkeletonShimmer className="skeleton-profile__avatar" />

      {/* Name line */}
      <SkeletonShimmer className="skeleton-profile__name" />

      {/* Title/role line */}
      <SkeletonShimmer className="skeleton-profile__title" />

      {/* Stats strip */}
      <SkeletonShimmer className="skeleton-profile__stats" />

      {/* Bio paragraph */}
      <SkeletonShimmer className="skeleton-profile__bio" />

      {/* CTA buttons */}
      <SkeletonShimmer className="skeleton-profile__actions" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonSkillRow
   Placeholder for a single skill bar row.
   Mirrors: .skill-row / .analytics-skill-row in multiple sections
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonSkillRow — Single skill bar row shimmer placeholder.
 *
 * @param {object} props
 * @param {string} [props.nameWidth='100px'] - Override name column width
 * @returns {JSX.Element}
 */
export function SkeletonSkillRow({ nameWidth = '100px' }) {
  return (
    <div
      className="skeleton-skill-row"                     /* Row flex container */
      aria-hidden="true"                                 /* Decorative */
    >
      {/* Skill name placeholder */}
      <SkeletonShimmer
        className="skeleton-skill-row__name"
        style={{ width: nameWidth }}                     /* Allow custom name width */
      />

      {/* Track bar placeholder */}
      <SkeletonShimmer className="skeleton-skill-row__track" />

      {/* Score percentage placeholder */}
      <SkeletonShimmer className="skeleton-skill-row__pct" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonSkillList
   Renders multiple SkeletonSkillRow components at once.
   Used when a list of skills is loading.
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonSkillList — Multiple skill row shimmer placeholders.
 *
 * @param {object} props
 * @param {number} [props.count=5]   - How many skill rows to render
 * @param {string} [props.nameWidth] - Optional override for name column width
 * @returns {JSX.Element}
 */
export function SkeletonSkillList({ count = 5, nameWidth }) {
  return (
    <div
      aria-hidden="true"                                 /* Decorative container */
      aria-label="Loading skills"                        /* Accessible label */
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonSkillRow
          key={i}
          nameWidth={nameWidth}                          /* Pass through name width */
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonProject
   Placeholder for a single project card in the grid.
   Mirrors: project card layout in ProjectsSection.jsx
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonProject — Single project card shimmer placeholder.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export function SkeletonProject() {
  return (
    <div
      className="skeleton-project"                       /* Card shell */
      aria-hidden="true"                                 /* Decorative */
    >
      {/* Cover image area */}
      <SkeletonShimmer className="skeleton-project__cover" />

      {/* Card content block */}
      <div className="skeleton-project__content">

        {/* Project title */}
        <SkeletonShimmer className="skeleton-project__title" />

        {/* Description */}
        <SkeletonShimmer className="skeleton-project__desc" />

        {/* Tech tag chips */}
        <div className="skeleton-project__tags">
          <SkeletonShimmer className="skeleton-project__tag" />
          <SkeletonShimmer className="skeleton-project__tag" />
          <SkeletonShimmer className="skeleton-project__tag" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonProjectGrid
   Renders a full responsive grid of project card skeletons.
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonProjectGrid — Multiple project card shimmer placeholders.
 *
 * @param {object} props
 * @param {number} [props.count=6] - Number of skeleton cards to render
 * @returns {JSX.Element}
 */
export function SkeletonProjectGrid({ count = 6 }) {
  return (
    <div
      className="projects-grid"                          /* Reuse real grid CSS */
      aria-hidden="true"                                 /* Decorative container */
      aria-label="Loading projects"                      /* Accessible label */
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonProject key={i} />                      /* Render each card */
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonExperience
   Placeholder for a single experience timeline item.
   Mirrors: ExperienceSection timeline card layout
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonExperience — Single experience timeline item shimmer.
 *
 * @param {object} props
 * @param {number} [props.count=3] - How many items to render
 * @returns {JSX.Element}
 */
export function SkeletonExperience({ count = 3 }) {
  /* Single experience item */
  const item = (key) => (
    <div
      key={key}
      className="skeleton-experience"                    /* Row: dot + card */
      aria-hidden="true"                                 /* Decorative */
    >
      {/* Timeline dot */}
      <SkeletonShimmer className="skeleton-experience__dot" />

      {/* Card content */}
      <div className="skeleton-experience__card">

        {/* Role title */}
        <SkeletonShimmer className="skeleton-experience__role" />

        {/* Company + date meta */}
        <SkeletonShimmer className="skeleton-experience__meta" />

        {/* Description paragraph */}
        <SkeletonShimmer className="skeleton-experience__desc" />
      </div>
    </div>
  );

  /* Render count items */
  return (
    <div aria-hidden="true" aria-label="Loading experience">
      {Array.from({ length: count }, (_, i) => item(i))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonPanel
   Generic glass-panel shimmer placeholder.
   Used as a fallback for any panel that lacks a specific skeleton.
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonPanel — Generic glass panel shimmer placeholder.
 *
 * @param {object} props
 * @param {number} [props.lines=4]   - Number of content lines to render
 * @param {string} [props.className] - Extra class for the panel shell
 * @returns {JSX.Element}
 */
export function SkeletonPanel({ lines = 4, className = '' }) {
  return (
    <div
      className={`skeleton-panel ${className}`.trim()}  /* Panel shell */
      aria-hidden="true"                                 /* Decorative */
    >
      {/* Panel header / title placeholder */}
      <SkeletonShimmer className="skeleton-panel__header" />

      {/* Content lines — vary widths for natural look */}
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonShimmer
          key={i}
          className={[
            'skeleton-panel__line',                      /* Base line class */
            i % 3 === 2 ? 'skeleton-panel__line--short'  : '', /* Every 3rd: short */
            i % 3 === 1 ? 'skeleton-panel__line--medium' : '', /* Every 2nd: medium */
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SkeletonSectionHead
   Placeholder for the section header (tag + title + subtitle).
   Mirrors: .s-head + .s-tag + .s-title + .s-sub
═══════════════════════════════════════════════════════════════ */
/**
 * SkeletonSectionHead — Section header shimmer placeholder.
 *
 * @param {object}  props
 * @param {boolean} [props.showSub=true] - Whether to show subtitle placeholder
 * @returns {JSX.Element}
 */
export function SkeletonSectionHead({ showSub = true }) {
  return (
    <div
      className="skeleton-section-head"                  /* Wrapper with margin */
      aria-hidden="true"                                 /* Decorative */
    >
      {/* Tag pill placeholder */}
      <SkeletonShimmer className="skeleton-section-head__tag" />

      {/* Section title placeholder */}
      <SkeletonShimmer className="skeleton-section-head__title" />

      {/* Subtitle placeholder — optional */}
      {showSub && (
        <SkeletonShimmer className="skeleton-section-head__sub" />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEFAULT EXPORT — convenience bundle
   Lets consumers import all skeletons from one place:
   import * as Skeleton from '@/components/ui/SkeletonLoader';
───────────────────────────────────────────────────────────── */
const SkeletonLoader = {
  KPI:          SkeletonKPI,          // KPI card skeleton
  Profile:      SkeletonProfile,      // Profile card skeleton
  SkillRow:     SkeletonSkillRow,     // Single skill row skeleton
  SkillList:    SkeletonSkillList,    // Multiple skill rows skeleton
  Project:      SkeletonProject,      // Single project card skeleton
  ProjectGrid:  SkeletonProjectGrid,  // Full project grid skeleton
  Experience:   SkeletonExperience,   // Experience timeline skeleton
  Panel:        SkeletonPanel,        // Generic panel skeleton
  SectionHead:  SkeletonSectionHead,  // Section header skeleton
};

export default SkeletonLoader;