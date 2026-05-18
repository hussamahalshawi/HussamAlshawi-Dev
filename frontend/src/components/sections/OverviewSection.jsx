/**
 * OverviewSection.jsx
 * ─────────────────────────────────────────────────────────
 * Comprehensive Devoryn-style Bento Grid Dashboard Overview.
 *
 * Layout — Full Portfolio Bento Grid:
 *
 *  Row 1 (3 cols):
 *    [Profile Card — tall]  [Goals Donut]  [Projects Donut]
 *
 *  Row 2 (3 cols):
 *    [Skills Radar]  [Experience Bar]  [Courses Timeline]
 *
 *  Row 3 (full width):
 *    [KPI Records Strip — all models]
 *
 *  Row 4 (2 cols):
 *    [Goals Progress Bars — wide]  [Skills Top Bar]
 *
 * Data sources — all from analytics prop:
 *   analytics.counts            → KPI records strip
 *   analytics.skills_distribution → Skills donut
 *   analytics.top_skills         → Skills top bar
 *   analytics.skills_radar       → Skills radar + category bar
 *   analytics.goals_by_status    → Goals donut
 *   analytics.goals_by_priority  → Goals priority bars
 *   analytics.counts.projects    → Projects count card
 *   analytics.counts.courses     → Courses count card
 *   analytics.counts.experience  → Experience bar
 *   profile.*                    → Profile card
 *
 * All CSS classes preserved from original OverviewSection.css
 * New classes added with prefix .ov-bento-*
 * ─────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useMemo } from 'react'; // React hooks
import { motion }                                from 'framer-motion';  // Entrance animations
import { formatExperience, getInitials }         from '../../utils/formatters';  // Pure helpers
import { CHART_COLORS }                          from '../../utils/constants';   // Global tokens

/* ── Reusable chart components ────────────────────────────────── */
import DonutChart  from '../charts/DonutChart';  // Goals + Skills distribution donuts
import BarChart    from '../charts/BarChart';    // Experience + Goals priority bars
import ProgressBar from '../charts/ProgressBar'; // Skills top bar rows
import StatCard    from '../charts/StatCard';    // Portfolio record counts

import '../../styles/components/OverviewSection.css';     // Existing section styles
import '../../styles/components/OverviewBento.css';       // NEW: Bento grid additions
import ParticleBackground from '../ui/ParticleBackground';

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════════ */

/* ── SVG Social Icons map ─────────────────────────────────────── */
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

/* ── Social platform colors for luxury hover effect ──────────── */
const SOCIAL_PLATFORMS_CONFIG = [
  { key: 'github',    label: 'GitHub',    color: '#ffffff' }, // White for GitHub
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2' }, // LinkedIn blue
  { key: 'twitter',   label: 'X',         color: '#ffffff' }, // White for X
  { key: 'instagram', label: 'Instagram', color: '#E1306C' }, // Instagram pink
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000' }, // YouTube red
  { key: 'medium',    label: 'Medium',    color: '#00ab6c' }, // Medium green
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2' }, // Facebook blue
  { key: 'telegram',  label: 'Telegram',  color: '#26A5E4' }, // Telegram blue
];

/* ── Goals status → color mapping ───────────────────────────── */
const GOALS_STATUS_COLORS = {
  'Achieved':    '#4ECCA3',  // Green — completed goals
  'In Progress': '#4FC3F7',  // Cyan — active goals
  'Planned':     '#9B7FEA',  // Violet — future goals
  'Paused':      '#F5A623',  // Orange — on hold goals
};

/* ── Goals priority → color mapping ─────────────────────────── */
const GOALS_PRIORITY_COLORS = {
  'Critical': '#FF6B6B',  // Red — must do now
  'High':     '#F5A623',  // Orange — very important
  'Medium':   '#4FC3F7',  // Cyan — standard
  'Low':      '#9B7FEA',  // Violet — nice to have
};

/* ── Portfolio record items — all models ─────────────────────── */
const RECORD_ITEMS = [
  { key: 'skills',       label: 'Skills',       icon: '⚙',  color: CHART_COLORS[0] }, // Lime
  { key: 'projects',     label: 'Projects',     icon: '⊡',  color: CHART_COLORS[1] }, // Cyan
  { key: 'courses',      label: 'Courses',      icon: '📚', color: CHART_COLORS[2] }, // Violet
  { key: 'experience',   label: 'Experience',   icon: '💼', color: CHART_COLORS[3] }, // Gold
  { key: 'education',    label: 'Education',    icon: '🎓', color: CHART_COLORS[4] }, // Coral
  { key: 'achievements', label: 'Achievements', icon: '🏆', color: CHART_COLORS[5] }, // Green
  { key: 'self_study',   label: 'Self Study',   icon: '✍',  color: CHART_COLORS[6] }, // Blue
  { key: 'goals',        label: 'Goals',        icon: '◈',  color: CHART_COLORS[7] }, // Amber
  { key: 'languages',    label: 'Languages',    icon: '🌐', color: CHART_COLORS[0] }, // Lime
  { key: 'feedback',     label: 'Feedback',     icon: '💬', color: CHART_COLORS[3] }, // Gold
];

/* ── Language level → color ───────────────────────────────────── */
const LANG_LEVEL_COLORS = {
  native:       '#4FC3F7',  // Cyan — native speaker
  fluent:       '#4ECCA3',  // Green — fluent
  intermediate: '#F5A623',  // Orange — intermediate
  beginner:     '#9B7FEA',  // Violet — beginner
};

/* ── Framer Motion variants for staggered entrance ───────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },                   // Start state
  visible: { opacity: 1, y: 0,  scale: 1    },                   // End state
};

/* ── Shared transition config ────────────────────────────────── */
const CARD_TRANSITION = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],                                       // Spring ease
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: OverviewSection
════════════════════════════════════════════════════════════════ */
/**
 * OverviewSection — Full Bento Grid portfolio dashboard overview.
 * Displays all models in a single comprehensive grid layout.
 *
 * @param {object}      props
 * @param {object|null} props.profile   - Profile data from API
 * @param {object|null} props.analytics - Analytics mega-payload from API
 *
 * @returns {JSX.Element}
 */
export default function OverviewSection({ profile, analytics }) {

  /* ── Safe data extraction with fallbacks ──────────────────── */
  const fullName  = profile?.full_name             || 'Hussam Alshawi';  // Full name with fallback
  const title     = profile?.title                 || 'Full Stack Developer'; // Job title
  const bio       = profile?.bio                   || '';                 // Biography text
  const avatar    = profile?.profile_gallery?.[0]?.url                   // Try gallery first
    || profile?.profile_gallery?.[0]                                      // Then plain gallery
    || profile?.primary_avatar                                            // Then primary_avatar
    || null;                                                              // Final fallback
  const available = profile?.is_available_for_hire || false;             // Hire availability
  const social    = profile?.social                || {};                 // Social links object
  const languages = profile?.languages             || [];                 // Languages array

  /* ── Analytics data extraction ───────────────────────────── */
  const counts     = analytics?.counts              || {};                // Entity counts
  const topSkills  = analytics?.top_skills          || [];                // Top skills list
  const skillsDist = analytics?.skills_distribution || {};               // Skills band distribution
  const radarData  = analytics?.skills_radar        || [];               // Category averages

  /* ── Goals data from analytics ───────────────────────────── */
  const goalsByStatus   = analytics?.goals_by_status   || {};            // Goals grouped by status
  const goalsByPriority = analytics?.goals_by_priority || {};            // Goals grouped by priority
  const avgProgress     = analytics?.avg_progress      || 0;             // Average goal progress %

  /* ── Build goals status donut data ───────────────────────── */
  const goalsDonutData = useMemo(() => {
    /* Map status object to DonutChart format */
    const statusEntries = Object.entries(goalsByStatus);                  // Convert to array
    if (!statusEntries.length) {
      /* Return demo data if no goals data available */
      return [
        { label: 'Achieved',    value: 0, color: GOALS_STATUS_COLORS['Achieved']    },
        { label: 'In Progress', value: 0, color: GOALS_STATUS_COLORS['In Progress'] },
        { label: 'Planned',     value: 0, color: GOALS_STATUS_COLORS['Planned']     },
        { label: 'Paused',      value: 0, color: GOALS_STATUS_COLORS['Paused']      },
      ];
    }
    return statusEntries.map(([status, count]) => ({
      label: status,                                                       // Status label
      value: count,                                                        // Count for this status
      color: GOALS_STATUS_COLORS[status] || CHART_COLORS[0],              // Map to color
    }));
  }, [goalsByStatus]);

  /* ── Build goals priority bar data ───────────────────────── */
  const goalsPriorityData = useMemo(() => {
    const entries = Object.entries(goalsByPriority);                      // Convert to array
    if (!entries.length) return [];                                       // Empty fallback
    return entries.map(([priority, count]) => ({
      label: priority,                                                     // Priority label
      value: count,                                                        // Count for this priority
      color: GOALS_PRIORITY_COLORS[priority] || CHART_COLORS[0],          // Map to color
    }));
  }, [goalsByPriority]);

  /* ── Build skills distribution donut data ────────────────── */
  const skillsDonutData = useMemo(() => [
    { label: 'Expert',       value: skillsDist.expert       || 0, color: '#C8FF57' }, // Lime
    { label: 'Advanced',     value: skillsDist.advanced     || 0, color: '#00E5FF' }, // Cyan
    { label: 'Intermediate', value: skillsDist.intermediate || 0, color: '#9B59F5' }, // Violet
    { label: 'Beginner',     value: skillsDist.beginner     || 0, color: '#F5A623' }, // Gold
  ], [skillsDist]);

  /* ── Build category bar data from radar ─────────────────── */
  const categoryBarData = useMemo(() => {
    const source = radarData.length > 0 ? radarData : [];                 // Use radar or empty
    return source.map((cat, i) => ({
      label: cat.category,                                                 // Category name
      value: cat.avg_score,                                               // Average score
      color: CHART_COLORS[i % CHART_COLORS.length],                       // Cycle colors
    }));
  }, [radarData]);

  /* ── Top 8 skills for bar chart ──────────────────────────── */
  const top8Skills = useMemo(() =>
    [...topSkills]
      .sort((a, b) => (b.score || 0) - (a.score || 0))                   // Sort by score desc
      .slice(0, 8)                                                         // Take top 8
      .map((s, i) => ({
        label: s.skill_name,                                               // Skill name
        value: s.score || 0,                                               // Skill score
        color: CHART_COLORS[i % CHART_COLORS.length],                     // Cycle colors
      })),
  [topSkills]);

  /* ── Total goals count ───────────────────────────────────── */
  const totalGoals = useMemo(() =>
    goalsDonutData.reduce((sum, d) => sum + d.value, 0),                  // Sum all goal counts
  [goalsDonutData]);

  /* ── Total skills count ──────────────────────────────────── */
  const totalSkills = counts.skills || 1;                                 // Avoid division by zero

  return (
    <section
      id="overview"
      className="overview-section"
      aria-label="Dashboard Overview"
    >

      {/* ══════════════════════════════════════════════════════
          ROW 1 — Profile + Goals Donut + Skills Donut
          3 columns: Profile tall | Goals Donut | Skills Donut
      ══════════════════════════════════════════════════════ */}
      <div className="ov-bento-row ov-bento-row--3col">

        {/* ── Col 1: Profile Card ─────────────────────────── */}
        <motion.div
          className="ov-panel ov-panel--profile ov-bento-profile"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.0 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          {/* Particle background layer — very subtle */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }}>
            <ParticleBackground />
          </div>

          {/* Decorative water drops */}
          <div className="ov-drops" aria-hidden="true">
            <div className="ov-drop ov-drop--a" />
            <div className="ov-drop ov-drop--b" />
          </div>

          {/* Avatar */}
          <div className="ov-profile__avatar-wrap">
            <div className="ov-profile__avatar" aria-label={`${fullName} photo`}>
              {avatar
                ? <img src={avatar} alt={fullName} />  // Show avatar image
                : <span>{getInitials(fullName)}</span>  // Fallback to initials
              }
            </div>
            <div className="ov-profile__online" title="Active" aria-label="Status: active" />
          </div>

          {/* Name */}
          <div className="ov-profile__name">{fullName}</div>

          {/* Title */}
          <div className="ov-profile__title">{title}</div>

          {/* Social links — luxury square buttons */}
          <div className="ov-profile__social--luxury" role="list" aria-label="Social links">
            {SOCIAL_PLATFORMS_CONFIG.map(platform => {
              /* Build URL from social object — handles nested or flat format */
              const val = social[platform.key] || social[platform.key.toLowerCase()];
              const url = !val ? null
                : typeof val === 'string' ? val
                : val.url || val.link || val.href || null;

              const icon = SOCIAL_ICONS[platform.key];                    // Get SVG icon
              if (!url || !icon) return null;                             // Skip if no URL

              return (
                <a
                  key={platform.key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ov-social-link--luxury"
                  role="listitem"
                  aria-label={`${platform.label} profile`}
                  style={{ '--social-color': platform.color }}            // CSS var for hover glow
                >
                  <span className="ov-social-link__icon--luxury" aria-hidden="true">
                    {icon}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Bio */}
          {bio && <p className="ov-profile__bio">{bio}</p>}

          {/* Quick Stats — 4 metric cards */}
          <div className="ov-profile__stats" role="list" aria-label="Quick stats">

            {/* Experience years */}
            <div className="ov-stat" role="listitem"
              style={{ background: 'rgba(79,195,247,0.07)', borderColor: 'rgba(79,195,247,0.22)', color: '#4FC3F7' }}>
              <span className="ov-stat__tag">Exp</span>
              <div className="ov-stat__num">
                {profile?.experience_years ? `${profile.experience_years}+` : '—'}
              </div>
              <span className="ov-stat__label">Years</span>
            </div>

            {/* Overall score */}
            <div className="ov-stat" role="listitem"
              style={{ background: 'rgba(78,204,163,0.07)', borderColor: 'rgba(78,204,163,0.22)', color: '#4ECCA3' }}>
              <span className="ov-stat__tag">Score</span>
              <div className="ov-stat__num">
                {profile?.overall_score ? `${Math.round(profile.overall_score)}%` : '—'}
              </div>
              <span className="ov-stat__label">Overall</span>
            </div>

            {/* Experience count */}
            <div className="ov-stat" role="listitem"
              style={{ background: 'rgba(155,127,234,0.07)', borderColor: 'rgba(155,127,234,0.22)', color: '#9B7FEA' }}>
              <span className="ov-stat__tag">Work</span>
              <div className="ov-stat__num">{counts?.experience || '0'}</div>
              <span className="ov-stat__label">Roles</span>
            </div>

            {/* Projects count */}
            <div className="ov-stat" role="listitem"
              style={{ background: 'rgba(245,166,35,0.07)', borderColor: 'rgba(245,166,35,0.22)', color: '#F5A623' }}>
              <span className="ov-stat__tag">Built</span>
              <div className="ov-stat__num">{counts?.projects || '0'}</div>
              <span className="ov-stat__label">Projects</span>
            </div>

          </div>

          {/* Languages strip inside profile */}
          {languages.length > 0 && (
            <div className="ov-bento-lang-strip" role="list" aria-label="Languages">
              {languages.slice(0, 4).map((lang, i) => {
                const levelKey  = (lang.level || '').toLowerCase();       // Normalize level key
                const langColor = LANG_LEVEL_COLORS[levelKey]
                  || CHART_COLORS[i % CHART_COLORS.length];               // Fallback to palette

                return (
                  <div
                    key={lang.language || i}
                    className="ov-bento-lang-chip"
                    role="listitem"
                    style={{ '--lang-color': langColor }}                 // CSS var for theming
                  >
                    <span className="ov-bento-lang-chip__flag" aria-hidden="true">
                      {lang.flag || '🌐'}
                    </span>
                    <span className="ov-bento-lang-chip__name">{lang.language}</span>
                    <span className="ov-bento-lang-chip__level" style={{ color: langColor }}>
                      {lang.level || 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Col 2: Goals Status Donut ───────────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.1 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          {/* Panel header */}
          <div className="ov-panel__header">
            <span className="ov-panel__title">Goals Status</span>
            <span className="ov-bento-badge ov-bento-badge--cyan">
              {totalGoals} Total
            </span>
          </div>
          <p className="ov-panel__subtitle">Roadmap progress breakdown</p>

          {/* Goals donut chart */}
          <div className="ov-bento-chart-center">
            <DonutChart
              data={goalsDonutData}
              total={totalGoals || undefined}
              centerValue={totalGoals}
              centerLabel="Goals"
              size="md"
              showLegend
            />
          </div>

          {/* Average progress bar */}
          {avgProgress > 0 && (
            <div className="ov-bento-progress-row" style={{ marginTop: 'var(--s4)' }}>
              <span className="ov-bento-progress-label">Avg Progress</span>
              <div className="ov-bento-progress-track">
                <div
                  className="ov-bento-progress-fill"
                  style={{
                    width:      `${avgProgress}%`,              // Fill width = avg progress
                    background: 'linear-gradient(90deg, var(--cyan), var(--green))', // Gradient fill
                  }}
                />
              </div>
              <span className="ov-bento-progress-value" style={{ color: 'var(--cyan)' }}>
                {Math.round(avgProgress)}%
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Col 3: Skills Distribution Donut ────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.2 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          {/* Panel header */}
          <div className="ov-panel__header">
            <span className="ov-panel__title">Skills Spread</span>
            <span className="ov-bento-badge ov-bento-badge--violet">
              {totalSkills} Skills
            </span>
          </div>
          <p className="ov-panel__subtitle">Proficiency band distribution</p>

          {/* Skills distribution donut */}
          <div className="ov-bento-chart-center">
            <DonutChart
              data={skillsDonutData}
              total={totalSkills}
              centerValue={totalSkills}
              centerLabel="Skills"
              size="md"
              showLegend
            />
          </div>
        </motion.div>

      </div>

      {/* ══════════════════════════════════════════════════════
          ROW 2 — Category Bars + Goals Priority + Top Skills
          3 columns: Skills by Cat | Goals Priority | Top Skills
      ══════════════════════════════════════════════════════ */}
      <div className="ov-bento-row ov-bento-row--3col">

        {/* ── Col 1: Skills by Category Bars ──────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.0 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ov-panel__header">
            <span className="ov-panel__title">Skills by Category</span>
            <button className="ov-panel__menu" aria-label="Panel options">···</button>
          </div>
          <p className="ov-panel__subtitle">Average score per domain</p>

          {/* Category bar chart */}
          <BarChart
            data={categoryBarData.length > 0 ? categoryBarData : [
              { label: 'Frontend',  value: 82, color: CHART_COLORS[0] },
              { label: 'Backend',   value: 75, color: CHART_COLORS[1] },
              { label: 'DevOps',    value: 60, color: CHART_COLORS[2] },
              { label: 'Database',  value: 68, color: CHART_COLORS[3] },
            ]}
            direction="horizontal"
            size="sm"
            showValues
            showLabels
            maxValue={100}
          />
        </motion.div>

        {/* ── Col 2: Goals Priority Bar ────────────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.1 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ov-panel__header">
            <span className="ov-panel__title">Goals by Priority</span>
            <button className="ov-panel__menu" aria-label="Panel options">···</button>
          </div>
          <p className="ov-panel__subtitle">Count per priority level</p>

          {/* Priority bar chart */}
          <BarChart
            data={goalsPriorityData.length > 0 ? goalsPriorityData : [
              { label: 'Critical', value: 0, color: '#FF6B6B' },
              { label: 'High',     value: 0, color: '#F5A623' },
              { label: 'Medium',   value: 0, color: '#4FC3F7' },
              { label: 'Low',      value: 0, color: '#9B7FEA' },
            ]}
            direction="horizontal"
            size="sm"
            showValues
            showLabels
          />

          {/* Goals count mini stats */}
          <div className="ov-bento-mini-stats" style={{ marginTop: 'var(--s4)' }}>
            {Object.entries(goalsByStatus).slice(0, 2).map(([status, count]) => (
              <div key={status} className="ov-bento-mini-stat">
                <span
                  className="ov-bento-mini-stat__dot"
                  style={{ background: GOALS_STATUS_COLORS[status] || 'var(--cyan)' }}
                />
                <span className="ov-bento-mini-stat__label">{status}</span>
                <span
                  className="ov-bento-mini-stat__num"
                  style={{ color: GOALS_STATUS_COLORS[status] || 'var(--cyan)' }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Col 3: Top Skills Progress Bars ─────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.2 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ov-panel__header">
            <span className="ov-panel__title">Top Skills</span>
            <button className="ov-panel__menu" aria-label="Panel options">···</button>
          </div>
          <p className="ov-panel__subtitle">Highest scored abilities</p>

          {/* Scrollable skill progress bars */}
          <div className="ov-bento-skill-scroll">
            {(top8Skills.length > 0 ? top8Skills : [
              { label: 'JavaScript', value: 90, color: CHART_COLORS[0] },
              { label: 'Python',     value: 85, color: CHART_COLORS[1] },
              { label: 'React',      value: 82, color: CHART_COLORS[2] },
              { label: 'Flask',      value: 78, color: CHART_COLORS[3] },
            ]).map((skill, i) => (
              <div key={skill.label || i} style={{ marginBottom: 'var(--s2)' }}>
                <ProgressBar
                  value={skill.value || 0}
                  label={skill.label}
                  color={skill.color}
                  showValue
                  size="xs"
                />
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ══════════════════════════════════════════════════════
          ROW 3 — KPI Records Strip (full width)
          All 10 models as animated count-up StatCards
      ══════════════════════════════════════════════════════ */}
      <motion.div
        className="ov-panel ov-bento-records"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        transition={{ ...CARD_TRANSITION, delay: 0.0 }}
      >
        {/* Panel header */}
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

        {/* StatCard grid — all 10 models */}
        <div className="ov-records-grid" role="list">
          {RECORD_ITEMS.map((item, i) => (
            <StatCard
              key={item.key}
              value={counts[item.key] || 0}   // Count from analytics
              label={item.label}              // Model display name
              icon={item.icon}                // Model emoji
              color={item.color}              // Palette color
              delay={i * 70}                  // Stagger count-up
              size="sm"                       // Compact grid size
            />
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          ROW 4 — Projects Info + Experience Summary
          2 columns: Projects breakdown | Experience timeline bar
      ══════════════════════════════════════════════════════ */}
      <div className="ov-bento-row ov-bento-row--2col">

        {/* ── Col 1: Projects Breakdown ────────────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.0 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ov-panel__header">
            <span className="ov-panel__title">Projects Overview</span>
            <span className="ov-bento-badge ov-bento-badge--gold">
              {counts.projects || 0} Total
            </span>
          </div>
          <p className="ov-panel__subtitle">Portfolio projects summary</p>

          {/* Projects big number + context */}
          <div className="ov-bento-big-stat">
            <div
              className="ov-bento-big-stat__num"
              style={{ color: CHART_COLORS[1] }}  // Cyan
            >
              {counts.projects || 0}
            </div>
            <div className="ov-bento-big-stat__label">Projects Built</div>
          </div>

          {/* Supporting metrics grid */}
          <div className="ov-bento-support-grid">
            <div className="ov-bento-support-item">
              <span className="ov-bento-support-item__num" style={{ color: CHART_COLORS[5] }}>
                {counts.experience || 0}
              </span>
              <span className="ov-bento-support-item__label">Work Roles</span>
            </div>
            <div className="ov-bento-support-item">
              <span className="ov-bento-support-item__num" style={{ color: CHART_COLORS[2] }}>
                {counts.courses || 0}
              </span>
              <span className="ov-bento-support-item__label">Courses Done</span>
            </div>
            <div className="ov-bento-support-item">
              <span className="ov-bento-support-item__num" style={{ color: CHART_COLORS[3] }}>
                {counts.achievements || 0}
              </span>
              <span className="ov-bento-support-item__label">Achievements</span>
            </div>
            <div className="ov-bento-support-item">
              <span className="ov-bento-support-item__num" style={{ color: CHART_COLORS[7] }}>
                {counts.self_study || 0}
              </span>
              <span className="ov-bento-support-item__label">Self Study</span>
            </div>
          </div>
        </motion.div>

        {/* ── Col 2: Learning & Growth ─────────────────────── */}
        <motion.div
          className="ov-panel ov-bento-card"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.1 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ov-panel__header">
            <span className="ov-panel__title">Learning & Growth</span>
            <button className="ov-panel__menu" aria-label="Panel options">···</button>
          </div>
          <p className="ov-panel__subtitle">Education & self-improvement</p>

          {/* Learning metrics as progress bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>

            {/* Courses progress */}
            <div className="ov-bento-metric-row">
              <span className="ov-bento-metric-label">Courses</span>
              <div className="ov-bento-metric-track">
                <div
                  className="ov-bento-metric-fill"
                  style={{
                    width:      `${Math.min((counts.courses || 0) / 50 * 100, 100)}%`, // Scale to 50 max
                    background: CHART_COLORS[2],  // Violet
                  }}
                />
              </div>
              <span className="ov-bento-metric-num" style={{ color: CHART_COLORS[2] }}>
                {counts.courses || 0}
              </span>
            </div>

            {/* Education records */}
            <div className="ov-bento-metric-row">
              <span className="ov-bento-metric-label">Degrees</span>
              <div className="ov-bento-metric-track">
                <div
                  className="ov-bento-metric-fill"
                  style={{
                    width:      `${Math.min((counts.education || 0) / 5 * 100, 100)}%`, // Scale to 5 max
                    background: CHART_COLORS[4],  // Coral
                  }}
                />
              </div>
              <span className="ov-bento-metric-num" style={{ color: CHART_COLORS[4] }}>
                {counts.education || 0}
              </span>
            </div>

            {/* Self study */}
            <div className="ov-bento-metric-row">
              <span className="ov-bento-metric-label">Self Study</span>
              <div className="ov-bento-metric-track">
                <div
                  className="ov-bento-metric-fill"
                  style={{
                    width:      `${Math.min((counts.self_study || 0) / 30 * 100, 100)}%`, // Scale to 30 max
                    background: CHART_COLORS[6],  // Blue
                  }}
                />
              </div>
              <span className="ov-bento-metric-num" style={{ color: CHART_COLORS[6] }}>
                {counts.self_study || 0}
              </span>
            </div>

            {/* Achievements */}
            <div className="ov-bento-metric-row">
              <span className="ov-bento-metric-label">Achievements</span>
              <div className="ov-bento-metric-track">
                <div
                  className="ov-bento-metric-fill"
                  style={{
                    width:      `${Math.min((counts.achievements || 0) / 20 * 100, 100)}%`, // Scale to 20 max
                    background: CHART_COLORS[5],  // Green
                  }}
                />
              </div>
              <span className="ov-bento-metric-num" style={{ color: CHART_COLORS[5] }}>
                {counts.achievements || 0}
              </span>
            </div>

            {/* Goals completion */}
            <div className="ov-bento-metric-row">
              <span className="ov-bento-metric-label">Goals Done</span>
              <div className="ov-bento-metric-track">
                <div
                  className="ov-bento-metric-fill"
                  style={{
                    width:      `${totalGoals > 0
                      ? Math.round((goalsByStatus['Achieved'] || 0) / totalGoals * 100)
                      : 0}%`,                     // % of achieved goals
                    background: 'linear-gradient(90deg, var(--cyan), var(--green))', // Gradient
                  }}
                />
              </div>
              <span className="ov-bento-metric-num" style={{ color: 'var(--green)' }}>
                {goalsByStatus['Achieved'] || 0}/{totalGoals}
              </span>
            </div>

          </div>
        </motion.div>

      </div>

    </section>
  );
}