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
import { motion } from 'framer-motion';
import { formatExperience, getInitials }             from '../../utils/formatters'; // Pure helpers
import { CHART_COLORS, SOCIAL_PLATFORMS }            from '../../utils/constants';  // Global tokens
import '../../styles/components/OverviewSection.css';                               // Section styles

/* ── Social platform icon map ─────────────────────────────────── */
/* ── SVG Social Icons — professional colored icons ───────────── */
/* Each icon is a colored SVG for visual richness                 */
const SOCIAL_ICONS = {

  github: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  ),

  linkedin: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),

  twitter: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),

  instagram: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),

  youtube: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),

  medium: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
    </svg>
  ),

  facebook: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),

  telegram: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
};

/* ── Social platform config — matches API social_links keys ──── */
/* Add or remove platforms here to control what appears in UI     */
const SOCIAL_PLATFORMS_CONFIG = [
  { key: 'github',    label: 'GitHub',    color: '#000000' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2' },
  { key: 'twitter',   label: 'X',         color: '#ffffff' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000' },
  { key: 'medium',    label: 'Medium',    color: '#000000' },
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2' },
  { key: 'telegram',  label: 'Telegram',  color: '#26A5E4' },
];

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
  // Use first image from profile_gallery if available, fallback to primary_avatar
const avatar = profile?.profile_gallery?.[0]?.url
  || profile?.profile_gallery?.[0]
  || profile?.primary_avatar
  || null;             // Cloudinary URL
  const available = profile?.is_available_for_hire  || false;            // Hire status
  const social    = profile?.social           || {};                // Social URLs object
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
          profile={profile}
          counts={counts}
          analytics={analytics}
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
   Avatar + Name + Title + Full Bio + Social Links
════════════════════════════════════════════════════════════════ */
/**
 * ProfileCardPanel — left panel with profile info and social links.
 * Social links check both nested object and flat key formats from API.
 * Card height is controlled by CSS to match Col 2 total height.
 * @param {{ fullName, title, bio, avatar, available, social }} props
 */
function ProfileCardPanel({ fullName, title, bio, avatar, available, social, profile, counts, analytics }) {

  const initials = getInitials(fullName); // Extract initials e.g. "HA"

  /* ── Debug: log social object to verify API key names ─────────── */
  /* Remove this after confirming social links work correctly        */
  console.log('[ProfileCard] social object:', social);

  /* ── Normalize social links — handles nested or flat API formats ── */
  /* Some APIs return { github: { url: '...' } } others { github: '...' } */
  const getSocialUrl = (key) => {
    const val = social[key] || social[key.toLowerCase()];                    // Direct access by key
    if (!val) return null;                      // Key doesn't exist
    if (typeof val === 'string') return val;    // Flat format: { github: 'https://...' }
    if (typeof val === 'object') return val.url || val.link || val.href || null; // Nested format
    return null;
  };

  return (
    <motion.div
      className="ov-panel ov-panel--profile"
      role="complementary"
      aria-label="Profile summary"
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}   /* Lift on hover */
    >
      {/* Decorative water drops */}
      <div className="ov-drops" aria-hidden="true">
        <div className="ov-drop ov-drop--a" />
        <div className="ov-drop ov-drop--b" />
      </div>

      {/* ── Avatar ── */}
      <div className="ov-profile__avatar-wrap">
        <div className="ov-profile__avatar" aria-label={`${fullName} profile photo`}>
          {avatar
            ? <img src={avatar} alt={fullName} />
            : <span>{initials}</span>
          }
        </div>
        <div className="ov-profile__online" title="Online" aria-label="Status: active" />
      </div>

      {/* ── Full name ── */}
      <div className="ov-profile__name">{fullName}</div>

      {/* ── Job title ── */}
      <div className="ov-profile__title">{title}</div>

           {/* ── Luxury Social links ── */}
<div className="ov-profile__social--luxury" role="list" aria-label="Social links">
  {SOCIAL_PLATFORMS_CONFIG.map(platform => {
    const url  = getSocialUrl(platform.key); // Safely get URL
    const icon = SOCIAL_ICONS[platform.key]; // Your SVG icons

    if (!url || !icon) return null;          // Skip if missing

    return (
      <a
        key={platform.key}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        /* Added 'luxury' class and dynamic platform key for specific colors */
        className={`ov-social-link--luxury ${platform.key}`}
        role="listitem"
        aria-label={`${platform.label} profile`}
        /* Keeping your color variable for the glow effect if needed */
        style={{ '--social-color': platform.color }}
      >
        <span
          className="ov-social-link__icon--luxury"
          aria-hidden="true"
        >
          {icon}
        </span>
        {/* Label removed to match the minimalist video style */}
      </a>
    );
  })}

        {/* Fallback message when social object is completely empty */}
        {Object.keys(social).length === 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            No social links configured
          </span>
        )}
      </div>
      {/* ── Full bio — no truncation ── */}
      {bio && <p className="ov-profile__bio">{bio}</p>}


        {/* ── Quick Stats — 4 cards horizontal ── */}
<div className="ov-profile__stats" role="list" aria-label="Profile statistics">

  {/* Yrs Experience */}
  <div
    className="ov-stat"
    role="listitem"
    style={{
      background:   'rgba(79,195,247,0.07)',
      borderColor:  'rgba(79,195,247,0.22)',
      color:        '#4FC3F7',
    }}
  >
    <span className="ov-stat__tag">Exp</span>
    <div className="ov-stat__num">
      {profile?.experience_years ? `${profile.experience_years}+` : '—'}
    </div>
    <span className="ov-stat__label">Years</span>
  </div>

  {/* Overall Score */}
  <div
    className="ov-stat"
    role="listitem"
    style={{
      background:  'rgba(78,204,163,0.07)',
      borderColor: 'rgba(78,204,163,0.22)',
      color:       '#4ECCA3',
    }}
  >
    <span className="ov-stat__tag">Score</span>
    <div className="ov-stat__num">
      {profile?.overall_score ? `${Math.round(profile.overall_score)}%` : '—'}
    </div>
    <span className="ov-stat__label">Goals</span>
  </div>

  {/* Experience count */}
  <div
    className="ov-stat"
    role="listitem"
    style={{
      background:  'rgba(155,127,234,0.07)',
      borderColor: 'rgba(155,127,234,0.22)',
      color:       '#9B7FEA',
    }}
  >
    <span className="ov-stat__tag">Work</span>
    <div className="ov-stat__num">
      {analytics ? (counts?.experience || '0') : '...'}
    </div>
    <span className="ov-stat__label">Experience</span>
  </div>

  {/* Projects count */}
  <div
    className="ov-stat"
    role="listitem"
    style={{
      background:  'rgba(245,166,35,0.07)',
      borderColor: 'rgba(245,166,35,0.22)',
      color:       '#F5A623',
    }}
  >
    <span className="ov-stat__tag">Built</span>
    <div className="ov-stat__num">
      {analytics ? (counts?.projects || '0') : '...'}
    </div>
    <span className="ov-stat__label">Projects</span>
  </div>

</div>
</motion.div>
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