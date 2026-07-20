/**
 * SkillsSection.jsx
 * ─────────────────────────────────────────────────────────
 * Devoryn-style Skills Dashboard — matches the portfolio design:
 *
 *  ┌────────────────────────────────────────────────────┐
 *  │  Section Header: tag + title + subtitle            │
 *  ├────────────────────────────────────────────────────┤
 *  │  Filter Tabs: All | Frontend | Backend | DevOps…   │
 *  ├──────────────┬─────────────────┬───────────────────┤
 *  │ Radar Chart  │  Skill Bars     │  Skill Cloud      │
 *  │ (SVG spider) │  (by category)  │  (badge grid)     │
 *  ├──────────────┴─────────────────┴───────────────────┤
 *  │  Category Summary Strip (full-width counts + avg)  │
 *  └────────────────────────────────────────────────────┘
 *
 * Data flow:
 *   - skills  → from /api/portfolio/skills (grouped by category)
 *   - summary → from /api/portfolio/skills/summary (lightweight)
 *   All child panels receive props — no internal fetching.
 * ─────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'; // React hooks
import { CHART_COLORS, SKILL_BANDS, ANIMATION }               from '../../utils/constants';  // Global tokens
import { scoreToBand, getBandColor }                           from '../../utils/formatters'; // Formatters
import '../../styles/components/SkillsSection.css';                                          // Section styles

/* ── Category filter "All" label ─────────────────────────────── */
const ALL_FILTER = 'All';

/* ── Radar chart layout constants ────────────────────────────── */
const RADAR_CENTER_X  = 150;                    // SVG center X coordinate
const RADAR_CENTER_Y  = 150;                    // SVG center Y coordinate
const RADAR_MAX_R     = 100;                    // Max radius of the radar polygon
const RADAR_RINGS     = 4;                      // Number of concentric grid rings
const RADAR_VIEWBOX   = '0 0 300 300';          // SVG viewBox for the radar chart

/* ── Cloud sort options ──────────────────────────────────────── */
const SORT_OPTIONS = [
  { key: 'score', label: 'Score' },             // Sort by skill score descending
  { key: 'name',  label: 'A–Z'   },             // Sort alphabetically ascending
];

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
/**
 * SkillsSection — assembles the full skills dashboard.
 * @param {object}      props
 * @param {object|null} props.skills  - Skills API response { count, skills, grouped, categories }
 * @param {object|null} props.summary - Skills summary { top_skills, category_averages, distribution }
 */
export default function SkillsSection({ skills, summary }) {

  /* ── Active category filter — defaults to "All" ──────────────── */
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);

  /* ── Derive category list from skills.categories or grouped keys ── */
  const categories = useMemo(() => {
    if (!skills) return [];                      // Guard: no data yet
    // Prefer the categories array from API; fallback to grouped keys
    return skills.categories?.length
      ? skills.categories
      : Object.keys(skills.grouped || {});
  }, [skills]);

  /* ── All skills flat array ───────────────────────────────────── */
  const allSkills = useMemo(() => skills?.skills || [], [skills]);

  /* ── Skills grouped by category ─────────────────────────────── */
  const grouped = useMemo(() => skills?.grouped || {}, [skills]);

  /* ── Filtered skills for bars panel based on active tab ─────── */
  const filteredGrouped = useMemo(() => {
    if (activeFilter === ALL_FILTER) return grouped; // Show all categories
    const cat = activeFilter;
    return grouped[cat] ? { [cat]: grouped[cat] } : {}; // Show only selected category
  }, [activeFilter, grouped]);

  /* ── Category counts for filter tab badges ───────────────────── */
  const categoryCounts = useMemo(() => {
    const counts = { [ALL_FILTER]: allSkills.length }; // Total count for "All"
    categories.forEach(cat => {
      counts[cat] = (grouped[cat] || []).length;        // Per-category count
    });
    return counts;
  }, [categories, grouped, allSkills]);

  /* ── Category averages from summary or computed ──────────────── */
  const categoryAverages = useMemo(() => {
    // Backend returns category_averages as an ARRAY: [{ category, avg_score, count }]
    // Frontend radar expects a flat OBJECT: { "Backend Development": 85 }
    if (summary?.category_averages) {
      const raw = summary.category_averages;
      if (Array.isArray(raw)) {
        const avgs = {};
        raw.forEach(item => {
          const cat = item.category || 'Other';
          avgs[cat] = item.avg_score ?? 0;
        });
        return avgs;
      }
      return raw; // Already an object — use as-is
    }

    // Fallback: compute averages from grouped skills
    const avgs = {};
    Object.entries(grouped).forEach(([cat, skillList]) => {
      if (!skillList.length) return;
      const sum = skillList.reduce((acc, s) => acc + (s.score || 0), 0);
      avgs[cat]  = Math.round(sum / skillList.length);  // Integer average
    });
    return avgs;
  }, [summary, grouped]);

  return (
    <section id="skills" className="skills-section" aria-label="Skills Dashboard">

      {/* ══════════════════════════════════════
          FILTER TABS
      ══════════════════════════════════════ */}
      <div
        className="skills-filters"
        role="tablist"
        aria-label="Filter skills by category"
      >
        {/* "All" tab — always first */}
        <button
          className={`skills-filter-btn ${activeFilter === ALL_FILTER ? 'skills-filter-btn--active' : ''}`}
          onClick={() => setActiveFilter(ALL_FILTER)}
          role="tab"
          aria-selected={activeFilter === ALL_FILTER}
          aria-controls="skills-bars-panel"
        >
          <span className="skills-filter-dot" />
          {ALL_FILTER}
          <span className="skills-filter-count">
            {categoryCounts[ALL_FILTER] || 0}
          </span>
        </button>

        {/* Dynamic category tabs from API */}
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`skills-filter-btn ${activeFilter === cat ? 'skills-filter-btn--active' : ''}`}
            onClick={() => setActiveFilter(cat)}
            role="tab"
            aria-selected={activeFilter === cat}
            style={{ '--filter-color': CHART_COLORS[i % CHART_COLORS.length] }}
          >
            <span
              className="skills-filter-dot"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {cat}
            <span className="skills-filter-count">
              {categoryCounts[cat] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          BENTO GRID — Radar + Bars + Cloud
      ══════════════════════════════════════ */}
      <div className="skills-bento" aria-label="Skills visualization panels">

        {/* ── 1. RADAR CHART — col 1 ───────────────────────────── */}
        <RadarPanel
          categories={categories}
          categoryAverages={categoryAverages}
        />

        {/* ── 2. SKILL BARS — col 2 ────────────────────────────── */}
        <BarsPanel
          grouped={filteredGrouped}
          categories={categories}
          activeFilter={activeFilter}
        />

        {/* ── 3. SKILL CLOUD — col 3 ───────────────────────────── */}
        <CloudPanel skills={allSkills} />
      </div>

      {/* ══════════════════════════════════════
          CATEGORY SUMMARY STRIP — full width
      ══════════════════════════════════════ */}
      {categories.length > 0 && (
        <SummaryStrip
          categories={categories}
          grouped={grouped}
          categoryAverages={categoryAverages}
        />
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: RadarPanel
   SVG spider/radar chart — shows category averages as a polygon
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ categories: string[], categoryAverages: object }} props
 */
function RadarPanel({ categories, categoryAverages }) {

  const [visible, setVisible] = useState(false); // Controls radar area opacity
  const wrapRef = useRef(null);                  // Ref for IntersectionObserver

  /* Trigger radar visibility when panel scrolls into view */
  useEffect(() => {
    if (!wrapRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(true);                      // Show radar polygon
          observer.disconnect();                 // Animate once only
        }
      },
      { threshold: ANIMATION.REVEAL_THRESHOLD }  // 12% visible trigger
    );

    observer.observe(wrapRef.current);
    return () => observer.disconnect();          // Cleanup on unmount
  }, []);

  /* ── Radar geometry calculations ─────────────────────────────── */
  const N = categories.length;                  // Number of axes (categories)

  /**
   * Converts polar coordinates to SVG Cartesian xy.
   * @param {number} angle  - Angle in radians
   * @param {number} radius - Distance from center
   * @returns {{ x: number, y: number }}
   */
  const polarToXY = useCallback((angle, radius) => ({
    x: RADAR_CENTER_X + radius * Math.sin(angle),  // X: right is +sin
    y: RADAR_CENTER_Y - radius * Math.cos(angle),  // Y: up is -cos (SVG flips Y)
  }), []);

  /* Build grid ring polygons */
  const rings = useMemo(() => {
    if (N < 3) return [];                        // Need at least 3 axes for a polygon
    return Array.from({ length: RADAR_RINGS }, (_, ringIdx) => {
      const r  = (RADAR_MAX_R / RADAR_RINGS) * (ringIdx + 1); // Ring radius
      const pts = Array.from({ length: N }, (__, i) => {
        const angle = (2 * Math.PI * i) / N;    // Evenly spaced angles
        const { x, y } = polarToXY(angle, r);   // Convert to Cartesian
        return `${x},${y}`;                      // SVG point string
      });
      return pts.join(' ');                      // Full polygon points string
    });
  }, [N, polarToXY]);

  /* Build data polygon from category averages */
  const dataPolygon = useMemo(() => {
    if (N < 3) return '';                        // Need at least 3 points
    const pts = categories.map((cat, i) => {
      const score = categoryAverages[cat] || 0;  // Category average score
      const r     = (score / 100) * RADAR_MAX_R; // Scale score to radius
      const angle = (2 * Math.PI * i) / N;      // Axis angle
      const { x, y } = polarToXY(angle, r);     // Cartesian point
      return `${x},${y}`;
    });
    return pts.join(' ');                        // Full polygon points string
  }, [categories, categoryAverages, N, polarToXY]);

  /* Build vertex dots data */
  const dots = useMemo(() => {
    if (N < 3) return [];
    return categories.map((cat, i) => {
      const score = categoryAverages[cat] || 0;
      const r     = (score / 100) * RADAR_MAX_R;
      const angle = (2 * Math.PI * i) / N;
      return { ...polarToXY(angle, r), score, cat }; // Dot position + data
    });
  }, [categories, categoryAverages, N, polarToXY]);

  /* Build axis lines */
  const axes = useMemo(() => {
    if (N < 3) return [];
    return categories.map((_, i) => {
      const angle = (2 * Math.PI * i) / N;
      const outer = polarToXY(angle, RADAR_MAX_R); // Outer end of axis
      return {
        x1: RADAR_CENTER_X,
        y1: RADAR_CENTER_Y,
        x2: outer.x,
        y2: outer.y,
      };
    });
  }, [N, polarToXY, categories]);

  /* Build axis labels — positioned slightly outside the radar */
  const labels = useMemo(() => {
    if (N < 3) return [];
    return categories.map((cat, i) => {
      const angle    = (2 * Math.PI * i) / N;
      const labelR   = RADAR_MAX_R + 25;          // Label radius (outside ring)
      const { x, y } = polarToXY(angle, labelR);  // Label position
      return { x, y, cat, score: categoryAverages[cat] || 0 };
    });
  }, [categories, categoryAverages, N, polarToXY]);

  /* Fallback when no categories */
  if (N < 3) {
    return (
      <div className="sk-panel sk-panel--radar" aria-label="Skills radar chart">
        <div className="sk-panel__header">
          <span className="sk-panel__title">Skill Radar</span>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: '2rem 0' }}>
          Radar requires 3+ skill categories
        </div>
      </div>
    );
  }

  return (
    <div className="sk-panel sk-panel--radar" aria-label="Skills radar chart" ref={wrapRef}>

      {/* Panel header */}
      <div className="sk-panel__header">
        <span className="sk-panel__title">Skill Radar</span>
        <button className="sk-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* SVG radar chart */}
      <div className="sk-radar-wrap">
        <svg
          className="sk-radar-svg"
          viewBox={RADAR_VIEWBOX}
          role="img"
          aria-label="Radar chart showing skill category averages"
        >
          <defs>
            {/* Cyan gradient fill for radar polygon */}
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="var(--cyan)" stopOpacity="0.30" />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Grid rings — concentric polygons */}
          {rings.map((pts, i) => (
            <polygon
              key={i}
              className="sk-radar-ring"
              points={pts}
            />
          ))}

          {/* Axis lines from center to each vertex */}
          {axes.map((axis, i) => (
            <line
              key={i}
              className="sk-radar-axis"
              x1={axis.x1} y1={axis.y1}
              x2={axis.x2} y2={axis.y2}
            />
          ))}

          {/* Data polygon — filled area */}
          {dataPolygon && (
            <polygon
              className={`sk-radar-area ${visible ? 'sk-radar-area--visible' : ''}`}
              points={dataPolygon}
              fill="url(#radarGrad)"
            />
          )}

          {/* Vertex dots at each category point */}
          {dots.map((dot, i) => (
            <circle
              key={i}
              className={`sk-radar-dot ${visible ? 'sk-radar-dot--visible' : ''}`}
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill="var(--cyan)"
              style={{ transitionDelay: `${0.5 + i * 0.08}s` }} // Stagger dot appearance
            />
          ))}

          {/* Axis labels — category names outside ring */}
          {labels.map((lbl, i) => (
            <text
              key={i}
              x={lbl.x}
              y={lbl.y}
              className="sk-radar-label"
              fill="var(--text-secondary)"
              fontSize="7.5"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {lbl.cat.length > 16 ? `${lbl.cat.slice(0, 16)}…` : lbl.cat}
            </text>
          ))}

          {/* Score labels at mid-axis positions */}
          {categories.map((cat, i) => {
            const angle    = (2 * Math.PI * i) / N;
            const midR     = RADAR_MAX_R * 0.55;    // Midpoint on the axis
            const { x, y } = polarToXY(angle, midR);
            const score    = categoryAverages[cat] || 0;
            return (
              <text
                key={i}
                x={x}
                y={y}
                className="sk-radar-score-label"
                fill="var(--text-muted)"
                fontSize="5.5"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {score}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend rows below radar — category + avg score */}
      <div className="sk-radar-legend" role="list">
        {categories.map((cat, i) => (
          <div key={cat} className="sk-radar-legend-item" role="listitem">
            <div
              className="sk-radar-legend-dot"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="sk-radar-legend-label">{cat}</span>
            <span
              className="sk-radar-legend-val"
              style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
            >
              {categoryAverages[cat] || 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: BarsPanel
   Horizontal animated progress bars grouped by category
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ grouped: object, categories: string[], activeFilter: string }} props
 */
function BarsPanel({ grouped, categories, activeFilter }) {

  const scrollRef = useRef(null);               // Ref for IntersectionObserver on scroll area

  /* Animate bars when panel enters viewport */
  useEffect(() => {
    if (!scrollRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          // Trigger scaleX(1) on all fill bars to animate them
          entry.target
            .querySelectorAll('.sk-row__fill')
            .forEach((fill, idx) => {
              setTimeout(
                () => { fill.style.transform = 'scaleX(1)'; }, // Animate fill
                idx * ANIMATION.BAR_DELAY                      // Stagger by BAR_DELAY ms
              );
            });
          observer.unobserve(entry.target);     // Animate once
        });
      },
      { threshold: ANIMATION.REVEAL_THRESHOLD }
    );

    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [grouped]);                                // Re-run when filtered group changes

  /* ── Determine which categories to show ─────────────────────── */
  const displayCategories = useMemo(() => {
    const keys = Object.keys(grouped);
    // Preserve original category order from the categories prop
    return categories.filter(cat => keys.includes(cat));
  }, [grouped, categories]);

  return (
    <div
      id="skills-bars-panel"
      className="sk-panel sk-panel--bars"
      aria-label="Skill progress bars"
    >
      {/* Panel header */}
      <div className="sk-panel__header">
        <span className="sk-panel__title">
          {activeFilter === 'All' ? 'All Skills' : activeFilter}
        </span>
        <button className="sk-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* Scrollable skill groups */}
      <div className="sk-bars-scroll" ref={scrollRef}>

        {displayCategories.length === 0 && (
          /* Empty state when filter returns no skills */
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.80rem' }}>
            No skills in this category yet.
          </div>
        )}

        {/* Render each category group */}
        {displayCategories.map((cat, catIdx) => {
          const skillList = grouped[cat] || [];  // Skills in this category
          const catColor  = CHART_COLORS[catIdx % CHART_COLORS.length]; // Category color
          const catAvg    = skillList.length
            ? Math.round(skillList.reduce((a, s) => a + (s.score || 0), 0) / skillList.length)
            : 0;                                 // Computed average

          return (
            <div key={cat} className="sk-group" role="group" aria-label={cat}>

              {/* Category group header */}
              <div className="sk-group__header">
                <div
                  className="sk-group__accent"
                  style={{ background: catColor }}
                  aria-hidden="true"
                />
                <span
                  className="sk-group__title"
                  style={{ color: catColor }}
                >
                  {cat}
                </span>
                {/* Avg score pill */}
                <span
                  className="sk-group__avg"
                  style={{
                    color:       catColor,
                    borderColor: catColor,
                    background:  `${catColor}14`,  // 8% opacity tint
                  }}
                >
                  avg {catAvg}%
                </span>
              </div>

              {/* Skill rows — sorted by score descending */}
              {[...skillList]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((skill, skillIdx) => {
                  const band      = scoreToBand(skill.score || 0);   // Band label
                  const bandColor = getBandColor(skill.score || 0);  // Band color

                  return (
                    <div
                      key={skill._id || skill.skill_name || skillIdx}
                      className="sk-row"
                      role="listitem"
                      aria-label={`${skill.skill_name}: ${skill.score}%`}
                    >
                      {/* Skill name */}
                      <span className="sk-row__name" title={skill.skill_name}>
                        {skill.skill_name}
                      </span>

                      {/* Progress track + animated fill */}
                      <div className="sk-row__track">
                        <div
                          className="sk-row__fill"
                          style={{
                            width:      `${skill.score || 0}%`,          // Fill width = score
                            background: `linear-gradient(90deg, ${catColor}, ${bandColor})`,
                            transform:  'scaleX(0)',                      // Start hidden
                          }}
                        />
                      </div>

                      {/* Score + band label */}
                      <div className="sk-row__meta">
                        <span
                          className="sk-row__score"
                          style={{ color: bandColor }}
                        >
                          {skill.score || 0}%
                        </span>
                        <span
                          className="sk-row__band"
                          style={{ color: bandColor, borderColor: `${bandColor}55` }}
                        >
                          {band}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: CloudPanel
   Badge cloud — all skills as pill badges, sorted + searchable
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ skills: Array }} props
 */
function CloudPanel({ skills }) {

  const [search, setSearch]   = useState('');           // Search input value
  const [sortBy, setSortBy]   = useState('score');      // 'score' | 'name'

  /* Filter + sort skills based on search and sortBy */
  const displaySkills = useMemo(() => {
    let list = [...skills];

    // Apply search filter — case-insensitive name match
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.skill_name || '').toLowerCase().includes(q)  // Match skill name
      );
    }

    // Apply sort
    if (sortBy === 'score') {
      list.sort((a, b) => (b.score || 0) - (a.score || 0)); // High score first
    } else {
      list.sort((a, b) =>                                    // Alphabetical A→Z
        (a.skill_name || '').localeCompare(b.skill_name || '')
      );
    }

    return list;
  }, [skills, search, sortBy]);

  return (
    <div className="sk-panel sk-panel--cloud" aria-label="Skill tags cloud">

      {/* Panel header */}
      <div className="sk-panel__header">
        <span className="sk-panel__title">Skill Cloud</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.60rem', color: 'var(--text-muted)' }}>
          {displaySkills.length} skills
        </span>
      </div>

      {/* Search input */}
      <input
        className="sk-cloud-search"
        type="search"
        placeholder="Search skills…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search skills"
      />

      {/* Sort row */}
      <div className="sk-cloud-sort" role="group" aria-label="Sort skills">
        <span className="sk-cloud-sort__label">Sort:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`sk-cloud-sort__btn ${sortBy === opt.key ? 'sk-cloud-sort__btn--active' : ''}`}
            onClick={() => setSortBy(opt.key)}
            aria-pressed={sortBy === opt.key}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Badge cloud — wrapping flex grid */}
      <div className="sk-cloud" role="list" aria-label="Skill badges">

        {displaySkills.length === 0 && (
          /* Empty state when search has no results */
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', width: '100%', textAlign: 'center', padding: '1.5rem 0' }}>
            No skills match "{search}"
          </div>
        )}

        {displaySkills.map((skill, i) => {
          const bandColor = getBandColor(skill.score || 0); // Color from score band
          const bgAlpha   = '14';                           // 8% opacity suffix in hex

          return (
            <span
              key={skill._id || skill.skill_name || i}
              className="sk-badge"
              role="listitem"
              title={`${skill.skill_name} — ${skill.score || 0}% (${scoreToBand(skill.score || 0)})`}
              style={{
                color:            bandColor,
                borderColor:      `${bandColor}55`,          // 33% opacity border
                background:       `${bandColor}${bgAlpha}`,  // 8% opacity fill
                animationDelay:   `${i * 30}ms`,             // Stagger entrance
              }}
              aria-label={`${skill.skill_name}: ${skill.score}%`}
            >
              {/* Score dot */}
              <span className="sk-badge__dot" aria-hidden="true" />
              {/* Skill name */}
              {skill.skill_name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SummaryStrip
   Full-width grid showing count + avg per category
════════════════════════════════════════════════════════════════ */
/**
 * @param {{ categories: string[], grouped: object, categoryAverages: object }} props
 */
function SummaryStrip({ categories, grouped, categoryAverages }) {

  const stripRef = useRef(null);                // Ref for bar animation observer

  /* Animate mini bars when strip enters viewport */
  useEffect(() => {
    if (!stripRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          // Trigger bar fill animations
          entry.target
            .querySelectorAll('.sk-summary-cell__bar-fill')
            .forEach(fill => { fill.style.transform = 'scaleX(1)'; });
          observer.unobserve(entry.target);     // Once only
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(stripRef.current);
    return () => observer.disconnect();
  }, [categories]);

  return (
    <div className="sk-panel sk-summary" aria-label="Skills category summary">

      {/* Panel header */}
      <div className="sk-panel__header">
        <span className="sk-panel__title">Category Summary</span>
        <button className="sk-panel__menu" aria-label="Panel options">···</button>
      </div>

      {/* Summary grid — one cell per category */}
      <div className="sk-summary-grid" ref={stripRef} role="list">
        {categories.map((cat, i) => {
          const skillList = grouped[cat] || [];
          const count     = skillList.length;
          const avg       = categoryAverages[cat] || 0;
          const color     = CHART_COLORS[i % CHART_COLORS.length];

          return (
            <div
              key={cat}
              className="sk-summary-cell"
              role="listitem"
              aria-label={`${cat}: ${count} skills, avg ${avg}%`}
              style={{ '--cat-color': color }}
            >
              <div
                className="sk-summary-cell__accent"
                style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
              />

              <div
                className="sk-summary-cell__count"
                style={{ color }}
              >
                {count}
              </div>

              <div className="sk-summary-cell__cat">{cat}</div>

              <div className="sk-summary-cell__bar-track">
                <div
                  className="sk-summary-cell__bar-fill"
                  style={{
                    width:      `${avg}%`,
                    background: color,
                    transform:  'scaleX(0)',
                  }}
                />
              </div>

              <div className="sk-summary-cell__avg">
                <span className="sk-summary-cell__avg-label">avg</span>
                <span
                  className="sk-summary-cell__avg-val"
                  style={{ color }}
                >
                  {avg}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}