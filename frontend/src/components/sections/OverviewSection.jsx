/**
 * OverviewSection.jsx
 * ─────────────────────────────────────────────────────────
 * Redesigned Devoryn-style Overview Dashboard.
 *
 * Layout matches wireframe exactly:
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Page Header: "Dashboard Overview" + availability    │
 *  ├────────────────┬────────────────┬────────────────────┤
 *  │  Profile Card  │ Score Dist.    │  Skill Scores      │
 *  │  (Col 1 tall)  │ (Col 2 top)    │  Top 12 (Col 3)    │
 *  │                ├────────────────┤  Sorted by band    │
 *  │  Name, Title,  │ Skills by Cat  │  Excellent/Good/   │
 *  │  Bio, Social   │ (Col 2 bottom) │  Growing/Learning  │
 *  ├────────────────┴────────────────┴────────────────────┤
 *  │  Portfolio Records — Total documents per model       │
 *  ├──────────────────────────┬──────────────────────────┤
 *  │  (spacer / future)       │  Languages panel          │
 *  └──────────────────────────┴──────────────────────────┘
 *
 * Data flow:
 *   profile   → Col 1 profile card, name/title/bio/social
 *   analytics → Col 2 score distribution donut + skills by category bars
 *               Col 3 top 12 skill scores + Portfolio Records row
 *               Languages row
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useCallback } from 'react'; // React hooks
import { formatExperience, getInitials }             from '../../utils/formatters'; // Pure helpers
import { CHART_COLORS, SOCIAL_PLATFORMS }            from '../../utils/constants';  // Global tokens
import '../../styles/components/OverviewSection.css';                               // Section styles

/* ── Social platform icon map ─────────────────────────────────── */
/* Maps platform keys to display icons */
const SOCIAL_ICONS = {
  github:    '⚙',
  linkedin:  '💼',
  medium:    '✍',
  instagram: '📸',
  facebook:  '🔗',
};

/* ── Band thresholds & labels — matches wireframe description ──── */
/* Excellent (80-100%) / Good (60-79%) / Growing (40-59%) / Learning (0-39%) */
const SCORE_BANDS = [
  { key: 'excellent', label: 'Excellent', min: 80, max: 100, color: '#4FC3F7' }, // Cyan
  { key: 'good',      label: 'Good',      min: 60, max: 79,  color: '#4ECCA3' }, // Green
  { key: 'growing',   label: 'Growing',   min: 40, max: 59,  color: '#9B7FEA' }, // Violet
  { key: 'learning',  label: 'Learning',  min: 0,  max: 39,  color: '#F5A623' }, // Gold
];

/* ── Portfolio record model labels ───────────────────────────── */
/* Maps analytics count keys to display labels for the records strip */
const RECORD_ITEMS = [
  { key: 'skills',       label: 'Skills',      icon: '⚙',  color: CHART_COLORS[0] },
  { key: 'goals',        label: 'Goals',       icon: '◈',  color: CHART_COLORS[1] },
  { key: 'experience',   label: 'Experience',  icon: '💼', color: CHART_COLORS[2] },
  { key: 'courses',      label: 'Courses',     icon: '📚', color: CHART_COLORS[3] },
  { key: 'projects',     label: 'Projects',    icon: '⊡',  color: CHART_COLORS[4] },
  { key: 'education',    label: 'Education',   icon: '🎓', color: CHART_COLORS[5] },
  { key: 'self_study',   label: 'Self Study',  icon: '✍',  color: CHART_COLORS[6] },
  { key: 'languages',    label: 'Languages',   icon: '🌐', color: CHART_COLORS[7] },
  { key: 'feedback',     label: 'Feedback',    icon: '💬', color: CHART_COLORS[0] },
  { key: 'achievements', label: 'Achievements',icon: '🏆', color: CHART_COLORS[3] },
];

/* ── Language proficiency level → color mapping ──────────────── */
/* Maps level strings to display colors for the language cards */
const LANG_LEVEL_COLORS = {
  native:       '#4FC3F7',  // Cyan for native
  fluent:       '#4ECCA3',  // Green for fluent
  intermediate: '#F5A623',  // Gold for intermediate
  beginner:     '#9B7FEA',  // Violet for beginner
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: OverviewSection
════════════════════════════════════════════════════════════════ */
/**
 * OverviewSection — assembles the full redesigned overview dashboard.
 * @param {object}      props
 * @param {object|null} props.profile   - Profile data from API
 * @param {object|null} props.analytics - Analytics data from API
 */
export default function OverviewSection({ profile, analytics }) {

  /* ── Safe display values with fallbacks ──────────────────────── */
  const fullName  = profile?.full_name              || 'Hussam Alshawi';  // Display name
  const title     = profile?.title                  || 'Full Stack Developer'; // Job title
  const bio       = profile?.bio                    || '';                 // Bio text
  const avatar    = profile?.primary_avatar         || null;              // Cloudinary URL
  const available = profile?.is_available_for_hire  || false;            // Hire status
  const social    = profile?.social_links           || {};                // Social URLs object
  const languages = profile?.languages              || [];               // Languages array

  /* ── Analytics derived values ─────────────────────────────────── */
  const counts       = analytics?.counts          || {};   // Entity counts
  const topSkills    = analytics?.top_skills      || [];   // Top skills array
  const skillsDist   = analytics?.skills_distribution || {}; // Band distribution
  const radarData    = analytics?.skills_radar    || [];   // Category averages

  /* ── Compute top 12 skills sorted by score desc ──────────────── */
  /* Used by Col 3 skill scores panel */
  const top12Skills = [...topSkills]
    .sort((a, b) => (b.score || 0) - (a.score || 0))  // Sort high → low
    .slice(0, 12);                                       // Take top 12 only

  /* ── Compute band counts from skills distribution ─────────────── */
  /* Maps API distribution keys to band display */
  const bandCounts = {
    excellent: skillsDist.expert       || 0,  // API "expert" → wireframe "Excellent"
    good:      skillsDist.advanced     || 0,  // API "advanced" → wireframe "Good"
    growing:   skillsDist.intermediate || 0,  // API "intermediate" → wireframe "Growing"
    learning:  skillsDist.beginner     || 0,  // API "beginner" → wireframe "Learning"
  };

  /* ── Total skills for donut percentage calculation ─────────────── */
  const totalSkills = counts.skills || 1; // Avoid division by zero

  return (
    <section id="overview" className="overview-section" aria-label="Dashboard Overview">

      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard Overview</h1>
          <p className="page-header__sub">
            {title} · Portfolio Analytics
          </p>
        </div>

        {/* Availability status pill */}
        <div
          className={`availability-pill ${available ? 'availability-pill--open' : ''}`}
          role="status"
          aria-label={available ? 'Available for hire' : 'Currently employed'}
        >
          <span className="availability-pill__dot" aria-hidden="true" />
          {available ? 'Available for Hire' : 'Currently Employed'}
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN 3-COLUMN GRID
          Col 1: Profile Card (tall, spans 2 rows)
          Col 2: Score Distribution (top) + Skills by Category (bottom)
          Col 3: Skill Scores Top 12 (tall, spans 2 rows)
      ══════════════════════════════════════ */}
      <div className="ov-main-grid">

        {/* ── COL 1: PROFILE CARD ─────────────────────────────────── */}
        <ProfileCardPanel
          fullName={fullName}
          title={title}
          bio={bio}
          avatar={avatar}
          available={available}
          social={social}
        />

        {/* ── COL 2 TOP: SCORE DISTRIBUTION DONUT ─────────────────── */}
        <ScoreDistributionPanel
          bandCounts={bandCounts}
          totalSkills={totalSkills}
        />

        {/* ── COL 3: SKILL SCORES TOP 12 ──────────────────────────── */}
        <SkillScoresPanel skills={top12Skills} />

        {/* ── COL 2 BOTTOM: SKILLS BY CATEGORY ────────────────────── */}
        <SkillsByCategoryPanel radarData={radarData} />

      </div>

      {/* ══════════════════════════════════════
          PORTFOLIO RECORDS — full-width strip
          Shows total documents per model
      ══════════════════════════════════════ */}
      <PortfolioRecordsPanel counts={counts} />

      {/* ══════════════════════════════════════
          LANGUAGES PANEL — full-width
          Language cards with flag + name + level
      ══════════════════════════════════════ */}
      <LanguagesPanel languages={languages} />

    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: ProfileCardPanel — Col 1
   Name + Title + Bio + Social Links
════════════════════════════════════════════════════════════════ */
/**
 * ProfileCardPanel — left panel with avatar, bio, social links, CTAs.
 * Spans both grid rows (tall panel matching wireframe Col 1).
 * @param {object} props
 */
function ProfileCardPanel({ fullName, title, bio, avatar, available, social }) {

  const initials = getInitials(fullName); // Extract "HA" from "Hussam Alshawi"

  return (
    <div
      className="ov-panel ov-panel--profile"
      role="complementary"
      aria-label="Profile summary"
    >
      {/* Water drop decorations — Devoryn signature */}
      <div className="ov-drops" aria-hidden="true">
        <div className="ov-drop ov-drop--a" />
        <div className="ov-drop ov-drop--b" />
      </div>

      {/* ── Avatar with triple glow ring ── */}
      <div className="ov-profile__avatar-wrap">
        <div className="ov-profile__avatar" aria-label={`${fullName} profile photo`}>
          {avatar
            ? <img src={avatar} alt={`${fullName}`} />
            : <span>{initials}</span>
          }
        </div>
        {/* Online status indicator dot */}
        <div
          className="ov-profile__online"
          title="Online"
          aria-label="Status: active"
        />
      </div>

      {/* ── Name ── */}
      <div className="ov-profile__name">{fullName}</div>

      {/* ── Role / Title ── */}
      <div className="ov-profile__title">{title}</div>

      {/* ── Bio text — capped at 200 chars for cleanliness ── */}
      {bio && (
        <p className="ov-profile__bio">
          {bio.length > 200 ? `${bio.slice(0, 200)}…` : bio}
        </p>
      )}

      {/* ── Social links — pill badges ── */}
      <div className="ov-profile__social" role="list" aria-label="Social links">
        {SOCIAL_PLATFORMS.map(platform => {
          const url = social[platform.key]; // Get URL from profile social object
          if (!url) return null;            // Skip if no URL for this platform
          return (
            <a
              key={platform.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ov-social-link"
              role="listitem"
              aria-label={`${platform.label} profile`}
            >
              <span aria-hidden="true">{SOCIAL_ICONS[platform.key]}</span>
              {platform.label}
            </a>
          );
        })}

        {/* Fallback social links when API returns empty */}
        {Object.keys(social).length === 0 && (
          <>
            <span className="ov-social-link" aria-hidden="true">⚙ GitHub</span>
            <span className="ov-social-link" aria-hidden="true">💼 LinkedIn</span>
          </>
        )}
      </div>

      {/* ── CTA buttons ── */}
      <div className="ov-profile__actions">
        <a href="#contact" className="btn btn--primary btn--sm" aria-label="Hire Hussam">
          Hire Me
        </a>
        <a href="#projects" className="btn btn--ghost btn--sm" aria-label="View projects">
          Projects →
        </a>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: ScoreDistributionPanel — Col 2 Top
   SVG donut chart: skills spread across Excellent/Good/Growing/Learning
════════════════════════════════════════════════════════════════ */
/**
 * ScoreDistributionPanel — donut chart showing band distribution.
 * @param {{ bandCounts: object, totalSkills: number }} props
 */
function ScoreDistributionPanel({ bandCounts, totalSkills }) {

  /* ── SVG donut geometry ──────────────────────────────────────── */
  const RADIUS  = 52;                              // Donut ring radius in SVG units
  const CIRCUMF = 2 * Math.PI * RADIUS;            // Full circle circumference
  const STROKE  = 10;                              // Ring stroke width

  let cumulativePct = 0;                           // Running total for segment offsets

  /* Build segments with computed percentages */
  const segments = SCORE_BANDS.map(band => {
    const count = bandCounts[band.key] || 0;                    // Skills in this band
    const pct   = totalSkills > 0 ? count / totalSkills : 0;   // Fraction of circle
    const result = { ...band, count, pct, offset: cumulativePct }; // Store offset before advancing
    cumulativePct += pct;                                        // Advance cumulative
    return result;
  });

  return (
    <div
      className="ov-panel ov-panel--score-dist"
      aria-label="Score distribution across proficiency bands"
    >
      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Score Distribution</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>
      <p className="ov-panel__subtitle">Skills spread across bands</p>

      {/* ── SVG Donut ── */}
      <div className="ov-donut-wrap" aria-hidden="true">
        <svg
          className="ov-donut-svg"
          viewBox="0 0 120 120"
          role="img"
          aria-label="Donut chart showing skill score distribution"
        >
          {/* Background track ring — full circle at low opacity */}
          <circle
            className="ov-donut-track"
            cx="60" cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
          />

          {/* Colored segments — one per band */}
          {segments.map((seg, i) => {
            const dashArr = seg.pct * CIRCUMF;              // Filled arc length
            const dashOff = CIRCUMF - seg.offset * CIRCUMF; // Offset from top
            return (
              <circle
                key={seg.key}
                cx="60" cy="60"
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dashArr} ${CIRCUMF}`}
                strokeDashoffset={dashOff}
                strokeLinecap="butt"
                style={{
                  transition: `stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.2}s`,
                }}
              />
            );
          })}
        </svg>

        {/* Center: total skills count */}
        <div className="ov-donut-center" aria-label={`${totalSkills} total skills`}>
          <div className="ov-donut-center__num">{totalSkills}</div>
          <div className="ov-donut-center__sub">Total</div>
        </div>
      </div>

      {/* ── Legend rows ── */}
      <div className="ov-donut-legend" role="list">
        {segments.map(seg => {
          const pctDisplay = totalSkills > 0
            ? Math.round((seg.count / totalSkills) * 100)
            : 0; // Percentage for this band

          return (
            <div key={seg.key} className="ov-legend-row" role="listitem">
              {/* Colored dot */}
              <div
                className="ov-legend-dot"
                style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }}
                aria-hidden="true"
              />
              {/* Band label */}
              <span className="ov-legend-label">{seg.label}</span>
              {/* Score range */}
              <span className="ov-legend-range">{seg.min}–{seg.max}%</span>
              {/* Percentage */}
              <span className="ov-legend-pct" style={{ color: seg.color }}>
                {seg.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SkillsByCategoryPanel — Col 2 Bottom
   Horizontal bars showing average score per domain/category
════════════════════════════════════════════════════════════════ */
/**
 * SkillsByCategoryPanel — horizontal bars for category averages.
 * @param {{ radarData: Array }} props
 */
function SkillsByCategoryPanel({ radarData }) {

  const panelRef = useRef(null); // Ref for IntersectionObserver animation trigger

  /* Animate bar widths when panel scrolls into view */
  useEffect(() => {
    if (!panelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          /* Set each fill bar's width from data attribute */
          entry.target
            .querySelectorAll('.ov-proj-row__fill')
            .forEach(fill => {
              fill.style.width = fill.dataset.pct; // Trigger CSS transition
            });
          observer.unobserve(entry.target); // Animate once only
        });
      },
      { threshold: 0.20 } // Trigger when 20% visible
    );

    observer.observe(panelRef.current);
    return () => observer.disconnect(); // Cleanup on unmount
  }, [radarData]); // Re-observe when data changes

  /* Fallback demo data when API returns nothing */
  const displayData = radarData.length > 0 ? radarData : [
    { category: 'Frontend',  avg_score: 82 },
    { category: 'Backend',   avg_score: 75 },
    { category: 'DevOps',    avg_score: 60 },
    { category: 'Database',  avg_score: 68 },
    { category: 'Mobile',    avg_score: 45 },
  ];

  return (
    <div
      className="ov-panel ov-panel--cat"
      ref={panelRef}
      aria-label="Skills by category panel"
    >
      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Skills by Category</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>
      <p className="ov-panel__subtitle">Average score per domain</p>

      {/* Category bar rows */}
      <div role="list" aria-label="Category average scores">
        {displayData.map((cat, i) => {
          const color = CHART_COLORS[i % CHART_COLORS.length]; // Color per category
          return (
            <div
              key={cat.category}
              className="ov-proj-row"
              role="listitem"
              aria-label={`${cat.category}: ${cat.avg_score}%`}
            >
              {/* Category name */}
              <span className="ov-proj-row__name">{cat.category}</span>

              {/* Animated progress track */}
              <div className="ov-proj-row__track">
                <div
                  className="ov-proj-row__fill"
                  data-pct={`${cat.avg_score}%`}      // Used by IntersectionObserver
                  style={{
                    width:      '0%',                 // Starts at 0, animated to data-pct
                    background: `linear-gradient(90deg, ${color}, var(--cyan))`,
                    transition: 'width 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  role="progressbar"
                  aria-valuenow={cat.avg_score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {/* Percentage label */}
              <span className="ov-proj-row__pct" style={{ color }}>
                {cat.avg_score}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SkillScoresPanel — Col 3
   Top 12 skills sorted by proficiency band
   Excellent (80-100%) / Good (60-79%) / Growing (40-59%) / Learning (0-39%)
════════════════════════════════════════════════════════════════ */
/**
 * SkillScoresPanel — tall right panel with top 12 skills by score.
 * Uses IntersectionObserver to animate fill bars on scroll.
 * @param {{ skills: Array }} props
 */
function SkillScoresPanel({ skills }) {

  const listRef  = useRef(null);                // Ref for observer trigger
  const [visible, setVisible] = useState(false); // Controls bar visibility class

  /* Trigger animations when panel enters viewport */
  useEffect(() => {
    if (!listRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);       // Activate fill bars
          observer.disconnect();  // Only once
        }
      },
      { threshold: 0.15 } // 15% visible trigger
    );

    observer.observe(listRef.current);
    return () => observer.disconnect(); // Cleanup
  }, [skills]);

  /**
   * Returns the band config for a given score
   * @param {number} score - Skill score 0–100
   * @returns {object} Band config with label and color
   */
  const getBand = (score) => {
    return SCORE_BANDS.find(b => score >= b.min && score <= b.max)
      || SCORE_BANDS[SCORE_BANDS.length - 1]; // Fallback to last band
  };

  /* Fallback demo data when API returns nothing */
  const displaySkills = skills.length > 0 ? skills : [
    { skill_name: 'JavaScript', score: 90 },
    { skill_name: 'Python',     score: 85 },
    { skill_name: 'React',      score: 82 },
    { skill_name: 'Flask',      score: 78 },
    { skill_name: 'MongoDB',    score: 74 },
    { skill_name: 'CSS3',       score: 70 },
    { skill_name: 'Git',        score: 65 },
    { skill_name: 'Docker',     score: 58 },
    { skill_name: 'TypeScript', score: 55 },
    { skill_name: 'PostgreSQL', score: 50 },
    { skill_name: 'Redis',      score: 42 },
    { skill_name: 'Kubernetes', score: 35 },
  ];

  return (
    <div
      className="ov-panel ov-panel--skill-scores"
      ref={listRef}
      aria-label="Top 12 skill scores"
    >
      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Skill Scores</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>
      <p className="ov-panel__subtitle">Top 12 · Sorted by proficiency</p>

      {/* ── Band legend pills ── */}
      <div className="ov-score-legend" role="list" aria-label="Score band legend">
        {SCORE_BANDS.map(band => (
          <span
            key={band.key}
            className="ov-score-band-pill"
            role="listitem"
            style={{ color: band.color, borderColor: `${band.color}55` }}
          >
            {band.label} {band.min}–{band.max}%
          </span>
        ))}
      </div>

      {/* ── Skill rows list ── */}
      <div className="ov-skill-list" role="list" aria-label="Top skills list">
        {displaySkills.map((skill, i) => {
          const band = getBand(skill.score || 0); // Get band for this score
          return (
            <div
              key={skill._id || skill.skill_name || i}
              className="ov-skill-row"
              role="listitem"
              aria-label={`${skill.skill_name}: ${skill.score}% — ${band.label}`}
              style={{ animationDelay: `${i * 60}ms` }} // Stagger entrance
            >
              {/* Skill name */}
              <span className="ov-skill-row__name" title={skill.skill_name}>
                {skill.skill_name}
              </span>

              {/* Progress track */}
              <div className="ov-skill-row__track">
                <div
                  className={`ov-skill-fill ${visible ? 'ov-skill-fill--visible' : ''}`}
                  style={{
                    width:            `${skill.score || 0}%`,                  // Fill width
                    background:       `linear-gradient(90deg, ${band.color}, var(--cyan))`, // Band gradient
                    transitionDelay:  `${0.3 + i * 0.06}s`,                   // Stagger timing
                  }}
                  role="progressbar"
                  aria-valuenow={skill.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {/* Score + band label */}
              <div className="ov-skill-row__score" style={{ color: band.color }}>
                {skill.score || 0}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: PortfolioRecordsPanel — Full Width
   Shows total document counts per model from analytics.counts
════════════════════════════════════════════════════════════════ */
/**
 * PortfolioRecordsPanel — horizontal strip with count per entity.
 * Matches wireframe: "Portfolio Records — Total documents per model"
 * @param {{ counts: object }} props
 */
function PortfolioRecordsPanel({ counts }) {

  return (
    <div
      className="ov-panel ov-panel--records"
      aria-label="Portfolio records — total documents per model"
    >
      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Portfolio Records</span>
        <span
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.60rem',
            color:         'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          Total documents per model
        </span>
      </div>

      {/* Record grid — one cell per model */}
      <div className="ov-records-grid" role="list">
        {RECORD_ITEMS.map((item, i) => {
          const count = counts[item.key] || 0; // Count from analytics or 0
          return (
            <div
              key={item.key}
              className="ov-record-item"
              role="listitem"
              aria-label={`${item.label}: ${count}`}
              style={{ '--rec-color': item.color }} // CSS custom prop for glow
            >
              {/* Color accent line at top */}
              <div
                style={{
                  position:   'absolute',
                  top:        0,
                  left:       0,
                  right:      0,
                  height:     '2px',
                  background: `linear-gradient(90deg, ${item.color}, transparent)`,
                }}
                aria-hidden="true"
              />

              {/* Icon */}
              <div style={{ fontSize: '1rem', lineHeight: 1 }} aria-hidden="true">
                {item.icon}
              </div>

              {/* Big count number */}
              <div
                className="ov-record-item__num"
                style={{ color: item.color }}
              >
                {count}
              </div>

              {/* Model label */}
              <div className="ov-record-item__label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: LanguagesPanel — Full Width
   Language cards with emoji flag + name + proficiency level badge
════════════════════════════════════════════════════════════════ */
/**
 * LanguagesPanel — grid of language cards.
 * @param {{ languages: Array }} props
 */
function LanguagesPanel({ languages }) {

  /* Fallback demo languages when API returns empty */
  const displayLangs = languages.length > 0 ? languages : [
    { language: 'Arabic',  flag: '🇸🇦', level: 'native',       proficiency: 'Native'       },
    { language: 'English', flag: '🇬🇧', level: 'intermediate',  proficiency: 'Intermediate' },
  ];

  return (
    <div
      className="ov-panel ov-panel--languages"
      aria-label="Languages panel"
    >
      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Languages</span>
        <span
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.58rem',
            color:         'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          Communication & literacy levels
        </span>
      </div>

      {/* Language card grid */}
      <div className="ov-lang-grid" role="list" aria-label="Languages list">
        {displayLangs.map((lang, i) => {
          const levelKey  = (lang.level || '').toLowerCase(); // Normalize level string
          const langColor = LANG_LEVEL_COLORS[levelKey]
            || CHART_COLORS[i % CHART_COLORS.length];         // Color from level or palette

          return (
            <div
              key={lang.language || i}
              className="ov-lang-card"
              role="listitem"
              aria-label={`${lang.language}: ${lang.proficiency || lang.level}`}
              style={{ '--lang-color': langColor }} // CSS custom prop for hover glow
            >
              {/* Flag emoji */}
              <div className="ov-lang-card__flag" aria-hidden="true">
                {lang.flag || '🌐'}
              </div>

              {/* Language name */}
              <div className="ov-lang-card__name">{lang.language}</div>

              {/* Proficiency level badge */}
              <div
                className="ov-lang-card__level"
                style={{ color: langColor }}
              >
                {lang.proficiency || lang.level || 'N/A'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}