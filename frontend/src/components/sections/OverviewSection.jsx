/**
 * OverviewSection.jsx
 * ─────────────────────────────────────────────────────────
 * Profile card (full width) + 5 key charts in a grid below.
 * Row 1: Sunburst + Radar (compact SVG matching SkillsSection)
 * Row 2: StackedBar + BubbleTimeline
 * Row 3: Sankey (full width)
 * All charts always render (show empty states if data not yet available).
 * ─────────────────────────────────────────────────────────
 */

import { lazy, Suspense, useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion }                                from 'framer-motion';
import { getInitials }                           from '../../utils/formatters';
import { CHART_COLORS, SOURCE_KEYS, SOURCE_COLORS, ANIMATION } from '../../utils/constants';
import chartsService                             from '../../services/chartsService';

import '../../styles/components/OverviewSection.css';
import '../../styles/components/OverviewBento.css';
import ParticleBackground from '../ui/ParticleBackground';

const StackedBarChart     = lazy(() => import('../charts/StackedBarChart'));
const MultiRadarChart     = lazy(() => import('../charts/MultiRadarChart'));
const BubbleTimelineChart = lazy(() => import('../charts/BubbleTimelineChart'));
const SankeyChart         = lazy(() => import('../charts/SankeyChart'));

/* ── Radar geometry ───────────────────────────────────────────── */
const RC_X  = 150;
const RC_Y  = 150;
const RC_R  = 105;
const RC_RINGS = 4;
const RC_VB = '0 0 300 300';

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
  { key: 'github',    label: 'GitHub',    color: '#ffffff' },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2' },
  { key: 'twitter',   label: 'X',         color: '#ffffff' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000' },
  { key: 'medium',    label: 'Medium',    color: '#00ab6c' },
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2' },
  { key: 'telegram',  label: 'Telegram',  color: '#26A5E4' },
];

/* ── Language level → color ───────────────────────────────────── */
const LANG_LEVEL_COLORS = {
  native:       '#4FC3F7',
  fluent:       '#4ECCA3',
  advanced:     '#9B7FEA',
  intermediate: '#F5A623',
  beginner:     '#4FC3F7',
};

/* ── Framer Motion variants ───────────────────────────────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1    },
};

const CARD_TRANSITION = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: OverviewSection
   Profile card full-width on top, charts grid below
   ════════════════════════════════════════════════════════════════ */
export default function OverviewSection({ profile, analytics, languages = [], portfolio, skillsCharts, goalsCharts }) {

  const fullName  = profile?.full_name             || 'Hussam Alshawi';
  const title     = profile?.title                 || 'Full Stack Developer';
  const bio       = profile?.bio                   || '';
  const avatar    = profile?.profile_gallery?.[0]?.url
    || profile?.profile_gallery?.[0]
    || profile?.primary_avatar
    || null;
  const available = profile?.is_available_for_hire || false;
  const social    = profile?.social                || {};
  const counts    = analytics?.counts               || {};

  const sourcesTopSkills = (skillsCharts?.sources?.top_skills || []).slice(0, 8).map(item => {
    const flat = { skill: item.skill || item.skill_name };
    const srcObj = item.sources || item.source_counts || {};
    Object.keys(srcObj).forEach(key => { flat[key] = srcObj[key]; });
    return flat;
  });

  /* ── Radar data from portfolio.skills_by_type ── */
  const radarCategories = useMemo(() =>
    (portfolio?.skills_by_type || []).map(c => c.type), [portfolio]);
  const radarAvgs = useMemo(() => {
    const avgs = {};
    (portfolio?.skills_by_type || []).forEach(c => { avgs[c.type] = c.avg_score || 0; });
    return avgs;
  }, [portfolio]);

  /* ── Domain Coverage radar ── */
  const [domainCoverage, setDomainCoverage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    chartsService.skills.domainCoverage()
      .then(res => { if (!cancelled) setDomainCoverage(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ── Activity Radar data from analytics counts ── */
  const activityCategories = ['Projects', 'Courses', 'Experience', 'Education', 'Self Study', 'Achievements'];
  const activityMax = useMemo(() => {
    const vals = [
      counts?.projects || 0,
      counts?.courses || 0,
      counts?.experience || 0,
      counts?.education || 0,
      counts?.self_study || 0,
      counts?.achievements || 0,
    ];
    return Math.max(...vals, 1);
  }, [counts]);
  const activityAvgs = useMemo(() => ({
    Projects:     counts?.projects     || 0,
    Courses:      counts?.courses      || 0,
    Experience:   counts?.experience   || 0,
    Education:    counts?.education    || 0,
    'Self Study': counts?.self_study   || 0,
    Achievements: counts?.achievements || 0,
  }), [counts]);

  return (
    <section id="overview" className="overview-section" aria-label="Dashboard Overview">
      <div className="ov-overview-grid">

        {/* ═══════ PROFILE CARD — Col 1, spans Rows 1-2 ═══════ */}
        <motion.div
          className="ov-panel ov-panel--profile"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.0 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ov-profile__particles">
            <ParticleBackground />
          </div>
          <div className="ov-drops" aria-hidden="true">
            <div className="ov-drop ov-drop--a" />
            <div className="ov-drop ov-drop--b" />
          </div>

          <div className="ov-profile__header">
            <div className="ov-profile__avatar" aria-label={`${fullName} photo`}>
              {avatar
                ? <img src={avatar} alt={fullName} />
                : <span>{getInitials(fullName)}</span>
              }
            </div>
            <div className="ov-profile__info">
              <div className="ov-profile__name">{fullName}</div>
              <div className="ov-profile__title">{title}</div>
              <div
                className={`availability-pill ${available ? 'availability-pill--open' : ''}`}
                role="status"
                aria-label={available ? 'Available for hire' : 'Currently employed'}
              >
                <span className="availability-pill__dot" aria-hidden="true" />
                {available ? 'Available for Hire' : 'Currently Employed'}
              </div>
              <div className="ov-profile__social--luxury" role="list" aria-label="Social links">
                {SOCIAL_PLATFORMS_CONFIG.map(platform => {
                  const val = social[platform.key] || social[platform.key.toLowerCase()];
                  const url = !val ? null
                    : typeof val === 'string' ? val
                    : val.url || val.link || val.href || null;
                  const icon = SOCIAL_ICONS[platform.key];
                  if (!url || !icon) return null;
                  return (
                    <a key={platform.key} href={url} target="_blank" rel="noopener noreferrer"
                      className="ov-social-link--luxury" role="listitem"
                      aria-label={`${platform.label} profile`}
                      style={{ '--social-color': platform.color }}>
                      <span className="ov-social-link__icon--luxury" aria-hidden="true">{icon}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {bio && <p className="ov-profile__bio">{bio}</p>}

          {languages?.length > 0 && (
            <div className="ov-profile__lang-section">
              <div className="ov-profile__section-label">Languages</div>
              <div className="ov-bento-lang-strip" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }} role="list" aria-label="Languages">
                {languages.slice(0, 6).map((lang, i) => {
                  const levelKey  = (lang.proficiency || '').toLowerCase();
                  const langColor = LANG_LEVEL_COLORS[levelKey] || CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <div key={lang.language_name || i} className="ov-bento-lang-chip" role="listitem" style={{ '--lang-color': langColor }}>
                      <span className="ov-bento-lang-chip__flag" aria-hidden="true">{lang.icon || '🌐'}</span>
                      <span className="ov-bento-lang-chip__name">{lang.language_name}</span>
                      <span className="ov-bento-lang-chip__level" style={{ color: langColor }}>{lang.proficiency || 'N/A'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ov-profile__stats" role="list" aria-label="Quick stats">
            <div className="ov-stat" role="listitem" style={{ '--stat-color': '#4FC3F7' }}>
              <span className="ov-stat__tag">Exp</span>
              <div className="ov-stat__num">{profile?.experience_years ? `${profile.experience_years}+` : '—'}</div>
              <span className="ov-stat__label">Years</span>
            </div>
            <div className="ov-stat" role="listitem" style={{ '--stat-color': '#4ECCA3' }}>
              <span className="ov-stat__tag">Score</span>
              <div className="ov-stat__num">{profile?.overall_score ? `${Math.round(profile.overall_score)}%` : '—'}</div>
              <span className="ov-stat__label">Overall</span>
            </div>
            <div className="ov-stat" role="listitem" style={{ '--stat-color': '#9B7FEA' }}>
              <span className="ov-stat__tag">Work</span>
              <div className="ov-stat__num">{counts?.experience || '0'}</div>
              <span className="ov-stat__label">Roles</span>
            </div>
            <div className="ov-stat" role="listitem" style={{ '--stat-color': '#F5A623' }}>
              <span className="ov-stat__tag">Built</span>
              <div className="ov-stat__num">{counts?.projects || '0'}</div>
              <span className="ov-stat__label">Projects</span>
            </div>
          </div>
        </motion.div>

        {/* ═══════ ROW 1: Skills by Source — Col 2 ═══════ */}
        <motion.div className="ov-panel ov-panel--chart" variants={CARD_VARIANTS} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} transition={{ ...CARD_TRANSITION, delay: 0.1 }}>
          <div className="ov-panel__chart-header">
            <span className="ov-panel__chart-title">Skills by Source</span>
            <span className="ov-panel__chart-sub">Top 8 — frequency per source</span>
          </div>
          <Suspense fallback={<div className="ov-panel__chart-loading">Loading...</div>}>
            <StackedBarChart data={sourcesTopSkills} barKey="skill" stackKeys={SOURCE_KEYS} stackColors={SOURCE_COLORS} showLegend />
          </Suspense>
        </motion.div>

        {/* ═══════ ROW 1: Learning Flow — Col 3 ═══════ */}
        <motion.div className="ov-panel ov-panel--chart" variants={CARD_VARIANTS} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} transition={{ ...CARD_TRANSITION, delay: 0.12 }}>
          <div className="ov-panel__chart-header">
            <span className="ov-panel__chart-title">Learning Flow</span>
            <span className="ov-panel__chart-sub">Sources → Skills → Goals</span>
          </div>
          <Suspense fallback={<div className="ov-panel__chart-loading">Loading...</div>}>
            <SankeyChart skillsWithSources={portfolio?.skills_with_sources} goals={portfolio?.goals} />
          </Suspense>
        </motion.div>

        {/* ═══════ ROW 2: Domain Coverage — Col 2 ═══════ */}
        <motion.div className="ov-panel ov-panel--chart" variants={CARD_VARIANTS} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} transition={{ ...CARD_TRANSITION, delay: 0.15 }}>
          <div className="ov-panel__chart-header">
            <span className="ov-panel__chart-title">Domain Coverage</span>
            <span className="ov-panel__chart-sub">Combined vs each source</span>
          </div>
          <Suspense fallback={<div className="ov-panel__chart-loading">Loading...</div>}>
            <MultiRadarChart data={domainCoverage} />
          </Suspense>
        </motion.div>

        {/* ═══════ ROW 2: Goals Roadmap — Col 3 ═══════ */}
        <motion.div className="ov-panel ov-panel--chart" variants={CARD_VARIANTS} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} transition={{ ...CARD_TRANSITION, delay: 0.18 }}>
          <div className="ov-panel__chart-header">
            <span className="ov-panel__chart-title">Goals Roadmap</span>
            <span className="ov-panel__chart-sub">{goalsCharts?.roadmap?.goals?.length || 0} goals</span>
          </div>
          <Suspense fallback={<div className="ov-panel__chart-loading">Loading...</div>}>
            <BubbleTimelineChart goals={goalsCharts?.roadmap?.goals} minYear={goalsCharts?.roadmap?.min_year} maxYear={goalsCharts?.roadmap?.max_year} />
          </Suspense>
        </motion.div>

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   OverviewRadar — SVG radar matching SkillsSection RadarPanel
   Pure SVG, compact version for overview (no recharts)
   ════════════════════════════════════════════════════════════════ */
function OverviewRadar({ categories = [], avgs = {}, maxVal = 100, compact = false }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const CX = compact ? 110 : RC_X;
  const CY = compact ? 110 : RC_Y;
  const CR = compact ? 75  : RC_R;
  const VB = compact ? '0 0 220 220' : RC_VB;

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: ANIMATION.REVEAL_THRESHOLD });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const N = categories.length;
  const p2xy = useCallback((a, r) => ({ x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) }), [CX, CY]);

  const rings = useMemo(() => {
    if (N < 3) return [];
    return Array.from({ length: RC_RINGS }, (_, ri) => {
      const r = (CR / RC_RINGS) * (ri + 1);
      return Array.from({ length: N }, (_, i) => {
        const { x, y } = p2xy((2 * Math.PI * i) / N, r);
        return `${x},${y}`;
      }).join(' ');
    });
  }, [N, p2xy]);

  const dataPolygon = useMemo(() => {
    if (N < 3) return '';
    return categories.map((cat, i) => {
      const r = ((avgs[cat] || 0) / maxVal) * CR;
      const { x, y } = p2xy((2 * Math.PI * i) / N, r);
      return `${x},${y}`;
    }).join(' ');
  }, [categories, avgs, N, p2xy, maxVal, CR]);

  const dots = useMemo(() => {
    if (N < 3) return [];
    return categories.map((cat, i) => {
      const r = ((avgs[cat] || 0) / maxVal) * CR;
      return { ...p2xy((2 * Math.PI * i) / N, r), score: avgs[cat] || 0, cat };
    });
  }, [categories, avgs, N, p2xy, maxVal]);

  const axes = useMemo(() => {
    if (N < 3) return [];
    return categories.map((_, i) => {
      const { x, y } = p2xy((2 * Math.PI * i) / N, CR);
      return { x1: CX, y1: CY, x2: x, y2: y };
    });
  }, [N, p2xy, categories]);

  const labels = useMemo(() => {
    if (N < 3) return [];
    return categories.map((cat, i) => {
      const { x, y } = p2xy((2 * Math.PI * i) / N, CR + 22);
      return { x, y, cat, score: avgs[cat] || 0 };
    });
  }, [categories, avgs, N, p2xy]);

  if (N < 3) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: '2rem 0' }}>
        Radar requires 3+ categories
      </div>
    );
  }

  return (
    <div className="ov-radar" ref={ref}>
      <svg className="ov-radar-svg" viewBox={VB} role="img" aria-label="Skill radar chart">
        <defs>
          <radialGradient id="ovRadarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--cyan)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        {rings.map((pts, i) => (
          <polygon key={i} className="ov-radar-ring" points={pts} />
        ))}
        {axes.map((a, i) => (
          <line key={i} className="ov-radar-axis" x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />
        ))}
        {dataPolygon && (
          <polygon className={`ov-radar-area ${visible ? 'ov-radar-area--v' : ''}`} points={dataPolygon} fill="url(#ovRadarGrad)" />
        )}
        {dots.map((dot, i) => (
          <circle
            key={i}
            className={`ov-radar-dot ${visible ? 'ov-radar-dot--v' : ''}`}
            cx={dot.x} cy={dot.y} r="3.5"
            fill="var(--cyan)"
            style={{ transitionDelay: `${0.5 + i * 0.08}s` }}
          />
        ))}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} className="ov-radar-label" fill="var(--text-secondary)" fontSize="15" textAnchor="middle" dominantBaseline="middle">
            {l.cat.length > 14 ? `${l.cat.slice(0, 14)}…` : l.cat}
          </text>
        ))}
        {categories.map((cat, i) => {
          const { x, y } = p2xy((2 * Math.PI * i) / N, CR * 0.55);
          return (
            <text key={i} x={x} y={y} className="ov-radar-score" fill="var(--text-muted)" fontSize="13" textAnchor="middle" dominantBaseline="middle">
              {avgs[cat] || 0}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
