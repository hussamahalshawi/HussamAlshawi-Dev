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
 *  │  Languages panel (full width)                        │
 *  └──────────────────────────┴──────────────────────────┘
 *
 * Refactor notes (v2):
 *   - ScoreDistributionPanel  → uses <DonutChart>   (replaces manual SVG)
 *   - SkillsByCategoryPanel   → uses <BarChart>     (replaces manual rows)
 *   - SkillScoresPanel        → uses <ProgressBar>  (replaces manual fills)
 *   - PortfolioRecordsPanel   → uses <StatCard>     (replaces plain numbers)
 *   - ProfileCardPanel        → UNCHANGED
 *   - LanguagesPanel          → UNCHANGED
 *   - All CSS classes          → UNCHANGED
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useCallback } from 'react'; // React hooks
import { motion }                                    from 'framer-motion';
import { formatExperience, getInitials }             from '../../utils/formatters';  // Pure helpers
import { CHART_COLORS, SOCIAL_PLATFORMS }            from '../../utils/constants';   // Global tokens

/* ── Reusable chart components ────────────────────────────────── */
import DonutChart   from '../charts/DonutChart';   // Score distribution donut
import BarChart     from '../charts/BarChart';     // Skills by category bars
import ProgressBar  from '../charts/ProgressBar';  // Skill score rows
import StatCard     from '../charts/StatCard';     // Portfolio record counts

import '../../styles/components/OverviewSection.css'; // Section styles — UNCHANGED
import ParticleBackground from '../ui/ParticleBackground';

/* ══════════════════════════════════════════════════════════════
   CONSTANTS — unchanged from original
══════════════════════════════════════════════════════════════ */

/* ── SVG Social Icons ─────────────────────────────────────────── */
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

/* ── Social platform config ───────────────────────────────────── */
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

/* ── Score bands — maps API distribution keys to display ─────── */
const SCORE_BANDS = [
  { key: 'excellent', label: 'Excellent', min: 80, max: 100, color: '#4FC3F7' },
  { key: 'good',      label: 'Good',      min: 60, max: 79,  color: '#4ECCA3' },
  { key: 'growing',   label: 'Growing',   min: 40, max: 59,  color: '#9B7FEA' },
  { key: 'learning',  label: 'Learning',  min: 0,  max: 39,  color: '#F5A623' },
];

/* ── Portfolio record model labels ───────────────────────────── */
const RECORD_ITEMS = [
  { key: 'skills',       label: 'Skills',       icon: '⚙',  color: CHART_COLORS[0] },
  { key: 'goals',        label: 'Goals',        icon: '◈',  color: CHART_COLORS[1] },
  { key: 'experience',   label: 'Experience',   icon: '💼', color: CHART_COLORS[2] },
  { key: 'courses',      label: 'Courses',      icon: '📚', color: CHART_COLORS[3] },
  { key: 'projects',     label: 'Projects',     icon: '⊡',  color: CHART_COLORS[4] },
  { key: 'education',    label: 'Education',    icon: '🎓', color: CHART_COLORS[5] },
  { key: 'self_study',   label: 'Self Study',   icon: '✍',  color: CHART_COLORS[6] },
  { key: 'languages',    label: 'Languages',    icon: '🌐', color: CHART_COLORS[7] },
  { key: 'feedback',     label: 'Feedback',     icon: '💬', color: CHART_COLORS[0] },
  { key: 'achievements', label: 'Achievements', icon: '🏆', color: CHART_COLORS[3] },
];

/* ── Language level → color ───────────────────────────────────── */
const LANG_LEVEL_COLORS = {
  native:       '#4FC3F7',
  fluent:       '#4ECCA3',
  intermediate: '#F5A623',
  beginner:     '#9B7FEA',
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: OverviewSection
════════════════════════════════════════════════════════════════ */
/**
 * OverviewSection — assembles the full overview dashboard.
 * @param {object}      props
 * @param {object|null} props.profile   - Profile data from API
 * @param {object|null} props.analytics - Analytics data from API
 */
export default function OverviewSection({ profile, analytics }) {

  /* ── Safe display values ─────────────────────────────────────── */
  const fullName  = profile?.full_name             || 'Hussam Alshawi';
  const title     = profile?.title                 || 'Full Stack Developer';
  const bio       = profile?.bio                   || '';
  const avatar    = profile?.profile_gallery?.[0]?.url
    || profile?.profile_gallery?.[0]
    || profile?.primary_avatar
    || null;
  const available = profile?.is_available_for_hire || false;
  const social    = profile?.social                || {};
  const languages = profile?.languages             || [];

  /* ── Analytics derived values ─────────────────────────────────── */
  const counts     = analytics?.counts             || {};
  const topSkills  = analytics?.top_skills         || [];
  const skillsDist = analytics?.skills_distribution || {};
  const radarData  = analytics?.skills_radar       || [];

  /* ── Top 12 skills sorted by score ───────────────────────────── */
  const top12Skills = [...topSkills]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 12);

  /* ── Band counts: map API keys → display band keys ───────────── */
  const bandCounts = {
    excellent: skillsDist.expert       || 0,
    good:      skillsDist.advanced     || 0,
    growing:   skillsDist.intermediate || 0,
    learning:  skillsDist.beginner     || 0,
  };

  const totalSkills = counts.skills || 1;           // Avoid division by zero

  return (
    <section id="overview" className="overview-section" aria-label="Dashboard Overview">

      {/* ══════════════════════════════════════
          MAIN 3-COLUMN GRID
      ══════════════════════════════════════ */}
      <div className="ov-main-grid">

        {/* ── COL 1: PROFILE CARD — UNCHANGED ────────────────────── */}
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

        {/* ── COL 2 TOP: SCORE DISTRIBUTION — now uses DonutChart ── */}
        <ScoreDistributionPanel
          bandCounts={bandCounts}
          totalSkills={totalSkills}
        />

        {/* ── COL 3: SKILL SCORES — now uses ProgressBar ───────── */}
        <SkillScoresPanel skills={top12Skills} />

        {/* ── COL 2 BOTTOM: SKILLS BY CATEGORY — now uses BarChart */}
        <SkillsByCategoryPanel radarData={radarData} />

      </div>

      {/* ══════════════════════════════════════
          PORTFOLIO RECORDS — now uses StatCard
      ══════════════════════════════════════ */}
      <PortfolioRecordsPanel counts={counts} />

      {/* ══════════════════════════════════════
          LANGUAGES — UNCHANGED
      ══════════════════════════════════════ */}
      <LanguagesPanel languages={languages} />

    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: ProfileCardPanel — UNCHANGED
   Avatar + Name + Title + Bio + Social + Stats
════════════════════════════════════════════════════════════════ */
function ProfileCardPanel({ fullName, title, bio, avatar, available, social, profile, counts, analytics }) {

  const initials = getInitials(fullName);           // "HA" from full name

  /* ── Normalize social URL — handles flat or nested API format ── */
  const getSocialUrl = (key) => {
    const val = social[key] || social[key.toLowerCase()];
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.url || val.link || val.href || null;
    return null;
  };

  return (
    <motion.div
      className="ov-panel ov-panel--profile"
      role="complementary"
      aria-label="Profile summary"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Particle background layer */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
        <ParticleBackground />
      </div>

      {/* Decorative water drops */}
      <div className="ov-drops" aria-hidden="true">
        <div className="ov-drop ov-drop--a" />
        <div className="ov-drop ov-drop--b" />
      </div>

      {/* Avatar */}
      <div className="ov-profile__avatar-wrap">
        <div className="ov-profile__avatar" aria-label={`${fullName} profile photo`}>
          {avatar
            ? <img src={avatar} alt={fullName} />
            : <span>{initials}</span>
          }
        </div>
        <div className="ov-profile__online" title="Online" aria-label="Status: active" />
      </div>

      {/* Name */}
      <div className="ov-profile__name">{fullName}</div>

      {/* Title */}
      <div className="ov-profile__title">{title}</div>

      {/* Social links */}
      <div className="ov-profile__social--luxury" role="list" aria-label="Social links">
        {SOCIAL_PLATFORMS_CONFIG.map(platform => {
          const url  = getSocialUrl(platform.key);
          const icon = SOCIAL_ICONS[platform.key];
          if (!url || !icon) return null;
          return (
            <a
              key={platform.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`ov-social-link--luxury ${platform.key}`}
              role="listitem"
              aria-label={`${platform.label} profile`}
              style={{ '--social-color': platform.color }}
            >
              <span className="ov-social-link__icon--luxury" aria-hidden="true">
                {icon}
              </span>
            </a>
          );
        })}

        {/* Fallback when social is empty */}
        {Object.keys(social).length === 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            No social links configured
          </span>
        )}
      </div>

      {/* Bio */}
      {bio && <p className="ov-profile__bio">{bio}</p>}

      {/* Quick Stats — 4 cards */}
      <div className="ov-profile__stats" role="list" aria-label="Profile statistics">

        <div className="ov-stat" role="listitem"
          style={{ background: 'rgba(79,195,247,0.07)', borderColor: 'rgba(79,195,247,0.22)', color: '#4FC3F7' }}>
          <span className="ov-stat__tag">Exp</span>
          <div className="ov-stat__num">
            {profile?.experience_years ? `${profile.experience_years}+` : '—'}
          </div>
          <span className="ov-stat__label">Years</span>
        </div>

        <div className="ov-stat" role="listitem"
          style={{ background: 'rgba(78,204,163,0.07)', borderColor: 'rgba(78,204,163,0.22)', color: '#4ECCA3' }}>
          <span className="ov-stat__tag">Score</span>
          <div className="ov-stat__num">
            {profile?.overall_score ? `${Math.round(profile.overall_score)}%` : '—'}
          </div>
          <span className="ov-stat__label">Goals</span>
        </div>

        <div className="ov-stat" role="listitem"
          style={{ background: 'rgba(155,127,234,0.07)', borderColor: 'rgba(155,127,234,0.22)', color: '#9B7FEA' }}>
          <span className="ov-stat__tag">Work</span>
          <div className="ov-stat__num">
            {analytics ? (counts?.experience || '0') : '...'}
          </div>
          <span className="ov-stat__label">Experience</span>
        </div>

        <div className="ov-stat" role="listitem"
          style={{ background: 'rgba(245,166,35,0.07)', borderColor: 'rgba(245,166,35,0.22)', color: '#F5A623' }}>
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
   SUB-COMPONENT: ScoreDistributionPanel — NOW USES DonutChart
   Replaces: manual SVG circles with strokeDasharray logic
════════════════════════════════════════════════════════════════ */
/**
 * ScoreDistributionPanel — donut chart showing band distribution.
 * @param {{ bandCounts: object, totalSkills: number }} props
 */
function ScoreDistributionPanel({ bandCounts, totalSkills }) {

  /* ── Build DonutChart data format ────────────────────────────── */
  /* Maps SCORE_BANDS to [{ label, value, color }] expected by DonutChart */
  const donutData = SCORE_BANDS.map(band => ({
    label: band.label,                           // Band display name
    value: bandCounts[band.key] || 0,            // Count from analytics API
    color: band.color,                           // Band color constant
  }));

  return (
    <div
      className="ov-panel ov-panel--score-dist"
      aria-label="Score distribution across proficiency bands"
    >
      {/* Panel header — UNCHANGED class names */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Score Distribution</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>
      <p className="ov-panel__subtitle">Skills spread across bands</p>

      {/* ── DonutChart replaces the manual SVG ── */}
      {/* size="md" matches the original 120px container */}
      {/* showLegend renders the same legend rows as before */}
      <DonutChart
        data={donutData}
        total={totalSkills}
        centerValue={totalSkills}
        centerLabel="Total"
        size="md"
        showLegend
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SkillsByCategoryPanel — NOW USES BarChart
   Replaces: manual .ov-proj-row + .ov-proj-row__fill rows
════════════════════════════════════════════════════════════════ */
/**
 * SkillsByCategoryPanel — horizontal bars for category averages.
 * @param {{ radarData: Array }} props
 */
function SkillsByCategoryPanel({ radarData }) {

  /* ── Fallback demo data ────────────────────────────────────────── */
  const source = radarData.length > 0 ? radarData : [
    { category: 'Frontend',  avg_score: 82 },
    { category: 'Backend',   avg_score: 75 },
    { category: 'DevOps',    avg_score: 60 },
    { category: 'Database',  avg_score: 68 },
    { category: 'Mobile',    avg_score: 45 },
  ];

  /* ── Transform radarData → BarChart data format ──────────────── */
  /* BarChart expects [{ label, value, color }] */
  const barData = source.map((cat, i) => ({
    label: cat.category,                         // Category name as label
    value: cat.avg_score,                        // Average score as value
    color: CHART_COLORS[i % CHART_COLORS.length],// Cycle through palette
  }));

  return (
    <div
      className="ov-panel ov-panel--cat"
      aria-label="Skills by category panel"
    >
      {/* Panel header — UNCHANGED */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Skills by Category</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>
      <p className="ov-panel__subtitle">Average score per domain</p>

      {/* ── BarChart replaces manual .ov-proj-row rows ── */}
      {/* size="sm" matches the original 4px track height */}
      <BarChart
        data={barData}
        direction="horizontal"
        size="sm"
        showValues
        showLabels
        maxValue={100}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: SkillScoresPanel — NOW USES ProgressBar
   Replaces: manual .ov-skill-fill with scaleX animation
════════════════════════════════════════════════════════════════ */
/**
 * SkillScoresPanel — top 12 skills with animated progress bars.
 * @param {{ skills: Array }} props
 */
function SkillScoresPanel({ skills }) {

  /* ── Fallback demo data ─────────────────────────────────────── */
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
      aria-label="Top 12 skill scores"
    >
      {/* Panel header — UNCHANGED */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Skill Scores</span>
        <button className="ov-panel__menu" aria-label="Panel options">···</button>
      </div>
      <p className="ov-panel__subtitle">Top 12 · Sorted by proficiency</p>

      {/* ── Band legend pills — UNCHANGED markup ── */}
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

      {/* ── ProgressBar list replaces manual .ov-skill-row items ── */}
      {/* Uses .ov-skill-list wrapper to preserve scroll + max-height CSS */}
      <div className="ov-skill-list" role="list" aria-label="Top skills list">
        {displaySkills.map((skill, i) => (
          <div
            key={skill._id || skill.skill_name || i}
            role="listitem"
            style={{ marginBottom: 'var(--s3)' }}
          >
            {/* ProgressBar auto-colors from skill band score */}
            {/* showBand=true shows Expert/Advanced/Intermediate/Beginner label */}
            <ProgressBar
              value={skill.score || 0}
              label={skill.skill_name}
              showValue
              showBand
              size="xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: PortfolioRecordsPanel — NOW USES StatCard
   Replaces: plain count numbers with animated StatCard components
════════════════════════════════════════════════════════════════ */
/**
 * PortfolioRecordsPanel — animated count cards per entity model.
 * @param {{ counts: object }} props
 */
function PortfolioRecordsPanel({ counts }) {

  return (
    <div
      className="ov-panel ov-panel--records"
      aria-label="Portfolio records — total documents per model"
    >
      {/* Panel header — UNCHANGED */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Portfolio Records</span>
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.60rem',
          color:         'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          Total documents per model
        </span>
      </div>

      {/* ── StatCard grid replaces plain number divs ── */}
      {/* Reuses .ov-records-grid for layout — CSS UNCHANGED */}
      <div className="ov-records-grid" role="list">
        {RECORD_ITEMS.map((item, i) => (
          <StatCard
            key={item.key}
            value={counts[item.key] || 0}         // Count from analytics API
            label={item.label}                    // Model display name
            icon={item.icon}                      // Model emoji icon
            color={item.color}                    // Palette color
            delay={i * 70}                        // Stagger count-up by 70ms each
            size="sm"                             // Compact size for grid
          />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENT: LanguagesPanel — UNCHANGED
   Language cards with flag + name + level badge
════════════════════════════════════════════════════════════════ */
/**
 * LanguagesPanel — grid of language cards.
 * @param {{ languages: Array }} props
 */
function LanguagesPanel({ languages }) {

  /* Fallback demo languages */
  const displayLangs = languages.length > 0 ? languages : [
    { language: 'Arabic',  flag: '🇸🇦', level: 'native',       proficiency: 'Native'       },
    { language: 'English', flag: '🇬🇧', level: 'intermediate',  proficiency: 'Intermediate' },
  ];

  return (
    <div className="ov-panel ov-panel--languages" aria-label="Languages panel">

      {/* Panel header */}
      <div className="ov-panel__header">
        <span className="ov-panel__title">Languages</span>
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.58rem',
          color:         'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          Communication & literacy levels
        </span>
      </div>

      {/* Language card grid */}
      <div className="ov-lang-grid" role="list" aria-label="Languages list">
        {displayLangs.map((lang, i) => {
          const levelKey  = (lang.level || '').toLowerCase();
          const langColor = LANG_LEVEL_COLORS[levelKey]
            || CHART_COLORS[i % CHART_COLORS.length];

          return (
            <div
              key={lang.language || i}
              className="ov-lang-card"
              role="listitem"
              aria-label={`${lang.language}: ${lang.proficiency || lang.level}`}
              style={{ '--lang-color': langColor }}
            >
              <div className="ov-lang-card__flag" aria-hidden="true">
                {lang.flag || '🌐'}
              </div>
              <div className="ov-lang-card__name">{lang.language}</div>
              <div className="ov-lang-card__level" style={{ color: langColor }}>
                {lang.proficiency || lang.level || 'N/A'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}