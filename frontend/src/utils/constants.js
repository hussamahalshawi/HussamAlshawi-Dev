/**
 * constants.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for every constant used across
 * the entire frontend. Change a value here → updates
 * everywhere automatically. Never hardcode these values
 * directly inside components or services.
 *
 * Sections:
 *   1.  API base URL
 *   2.  API endpoint paths — Portfolio (existing)
 *   3.  API endpoint paths — Charts (new dedicated endpoints)
 *   4.  Navigation links
 *   5.  Social platform config
 *   6.  Skill proficiency bands
 *   7.  Chart color palette
 *   8.  Animation durations
 *   9.  Loader messages
 *   10. Request timeout
 *   11. Section IDs
 *   12. Chart query param defaults
 * ─────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════════
   1. API BASE URL
   Reads from .env — falls back to local dev if not set
══════════════════════════════════════════════════════════ */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Vite env var with fallback

/* ══════════════════════════════════════════════════════════
   2. API ENDPOINT PATHS — Portfolio (existing)
   All paths are relative to API_BASE_URL.
   Function endpoints (e.g. PROJECT_DETAIL) accept an id
   and return the full dynamic path string.
══════════════════════════════════════════════════════════ */
export const ENDPOINTS = {

  // ── Profile ───────────────────────────────────────────
  PROFILE:              '/portfolio/profile',                  // GET — public profile data
  ALL_PROFILES:         '/profiles',                           // GET — admin selector list
  PROFILE_BY_ID:        (id) => `/profile/${id}`,              // GET — single profile metrics

  // ── Analytics ─────────────────────────────────────────
  ANALYTICS:            '/portfolio/analytics',                // GET — mega aggregate payload
  TECH_STACK:           '/portfolio/analytics/tech-stack',     // GET — tech frequency data
  TIMELINE:             '/portfolio/analytics/timeline',       // GET — career timeline

  // ── Skills ────────────────────────────────────────────
  SKILLS:               '/portfolio/skills',                   // GET — all skills grouped
  SKILLS_SUMMARY:       '/portfolio/skills/summary',           // GET — lightweight summary

  // ── Projects ──────────────────────────────────────────
  PROJECTS:             '/portfolio/projects',                 // GET — all projects (filterable)
  PROJECT_DETAIL:       (id) => `/portfolio/projects/${id}`,   // GET — single project by ID

  // ── Experience ────────────────────────────────────────
  EXPERIENCE:           '/portfolio/experience',               // GET — work experience list
  EXPERIENCE_TIMELINE:  '/portfolio/experience/timeline',      // GET — compact timeline format

  // ── Education & Courses ───────────────────────────────
  EDUCATION:            '/portfolio/education',                // GET — education records
  COURSES:              '/portfolio/courses',                  // GET — completed courses
  COURSES_STATS:        '/portfolio/courses/stats',            // GET — courses statistics
  ACHIEVEMENTS:         '/portfolio/achievements',             // GET — achievements list
  SELF_STUDY:           '/portfolio/self-study',               // GET — self-study records

  // ── Goals & Languages ─────────────────────────────────
  GOALS:                '/portfolio/goals',                    // GET — career roadmap goals
  GOALS_STATS:          '/portfolio/goals/stats',              // GET — goals statistics
  LANGUAGES:            '/portfolio/languages',                // GET — spoken languages

  // ── Feedback / Contact ────────────────────────────────
  FEEDBACK:             '/feedback',                           // POST — submit contact message
  FEEDBACK_FEATURED:    '/feedback/featured',                  // GET — approved testimonials

  // ══════════════════════════════════════════════════════
  // 3. CHARTS ENDPOINTS — dedicated per-chart APIs (new)
  // Each endpoint returns data shaped specifically for one
  // chart type — no reshaping needed in the component.
  // ══════════════════════════════════════════════════════

  // ── Skills Charts ─────────────────────────────────────
  CHARTS_SKILLS_RADAR:        '/charts/skills/radar',
  // GET → Radar: avg score per category
  // Response: { labels, scores, counts, colors, series }

  CHARTS_SKILLS_DISTRIBUTION: '/charts/skills/distribution',
  // GET → Donut: skill count per score band (Expert/Advanced/Intermediate/Beginner)
  // Response: { labels, counts, colors, total, series }

  CHARTS_SKILLS_TOP_BARS:     '/charts/skills/top-bars',
  // GET → Horizontal bar: top N skills by score  (?limit=12)
  // Response: { labels, scores, colors, icons, series }

  CHARTS_SKILLS_HEATMAP:      '/charts/skills/heatmap',
  // GET → 2D matrix: category (row) × score band (column)
  // Response: { categories, bands, matrix, band_ranges }

  CHARTS_SKILLS_SOURCES:      '/charts/skills/sources',
  // GET → Multi-series radar: per-source scores per category
  // Response: { labels, series: [{ name, color, values, dash, width }] }

  CHARTS_SKILLS_DOMAIN_COVERAGE: '/charts/skills/domain-coverage',
  // GET → Stacked bar: skill frequency per source model
  // Response: { sources, counts, colors, top_skills }

  // ── Career Charts ─────────────────────────────────────
  CHARTS_CAREER_GANTT:        '/charts/career/gantt',
  // GET → Gantt/Timeline: Education + Experience merged
  // Response: { min_year, max_year, count, items }

  CHARTS_CAREER_EMPLOYMENT:   '/charts/career/employment-mix',
  // GET → Donut: employment types by count + months duration
  // Response: { labels, counts, months, colors, series }

  CHARTS_CAREER_TREEMAP:      '/charts/career/projects-treemap',
  // GET → Treemap: project count per category + type
  // Response: { total, by_category, by_type }

  CHARTS_CAREER_PROJ_HEATMAP: '/charts/career/projects-heatmap',
  // GET → Calendar heatmap: project activity by month
  // Response: { min_date, max_date, by_month, by_year }

  CHARTS_CAREER_STACK_FREQ:   '/charts/career/stack-frequency',
  // GET → Horizontal bar: tech frequency — Experience + Projects only  (?limit=15)
  // Response: { labels, counts, exp_counts, proj_counts, series }

  CHARTS_CAREER_ACHIEVEMENTS: '/charts/career/achievements-timeline',
  // GET → Vertical timeline: achievements grouped by year
  // Response: { total, by_year }

  // ── Learning Charts ───────────────────────────────────
  CHARTS_LEARNING_COURSES_YEAR: '/charts/learning/courses-by-year',
  // GET → Area chart: completions per year/month  (?granularity=year|month)
  // Response: { granularity, labels, counts, series }

  CHARTS_LEARNING_PROVIDERS:    '/charts/learning/providers',
  // GET → Horizontal bar: top course providers  (?limit=10)
  // Response: { labels, counts, series }

  CHARTS_LEARNING_WORD_CLOUD:   '/charts/learning/skills-word-cloud',
  // GET → Word cloud: skills frequency across learning sources
  // (?limit=40&source=all|courses|self_study|education)
  // Response: { words, max_count, total_unique }

  CHARTS_LEARNING_STUDY_TYPES:  '/charts/learning/self-study-types',
  // GET → Donut: self-study count per learning_type
  // Response: { labels, counts, colors, total, series }

  CHARTS_LEARNING_TRACKS:       '/charts/learning/self-study-tracks',
  // GET → Vertical bar: self-study count per Category track
  // Response: { labels, counts, series }

  CHARTS_LEARNING_VS_OUTPUT:    '/charts/learning/learning-vs-output',
  // GET → Grouped bar: learning input vs project output per Category
  // Response: { categories, learning_counts, project_counts, ratios, series }

  // ── Goals Charts ──────────────────────────────────────
  CHARTS_GOALS_GAUGE:       '/charts/goals/gauge',
  // GET → Gauge: overall portfolio goal completion %
  // Response: { overall_pct, achieved_count, in_progress_count, total, avg_score, avg_target }

  CHARTS_GOALS_STATUS:      '/charts/goals/status-donut',
  // GET → Donut: goals by status (Achieved/In Progress/Planned/Paused)
  // Response: { labels, counts, colors, total, series }

  CHARTS_GOALS_PRIORITY:    '/charts/goals/priority-donut',
  // GET → Donut: goals by priority (Critical/High/Medium/Low)
  // Response: { labels, counts, colors, total, series }

  CHARTS_GOALS_YEAR:        '/charts/goals/year-progress',
  // GET → Grouped bar: goal count + avg progress per target year
  // Response: { years, counts, avg_progress, series }

  CHARTS_GOALS_SKILL_GAP:   '/charts/goals/skill-gap',
  // GET → Skill gap: per-goal current vs required scores
  // Response: { count, goals } — each goal has skill_gaps[] sorted by largest gap

  CHARTS_GOALS_ROADMAP:     '/charts/goals/roadmap-timeline',
  // GET → Bubble/Gantt: all goals on a year axis with priority weights
  // Response: { min_year, max_year, count, goals }
};

/* ══════════════════════════════════════════════════════════
   4. NAVIGATION LINKS
   Used by DashboardLayout sidebar nav items.
   id must match the corresponding <section id="..."> element.
══════════════════════════════════════════════════════════ */
export const NAV_LINKS = [
  { id: 'overview',   label: 'Dashboard',  href: '#overview',   icon: '⊞' },
  { id: 'analytics',  label: 'Analytics',  href: '#analytics',  icon: '↗' },
  { id: 'skills',     label: 'Skills',     href: '#skills',     icon: '◎' },
  { id: 'projects',   label: 'Projects',   href: '#projects',   icon: '⊡' },
  { id: 'experience', label: 'Experience', href: '#experience', icon: '⊛' },
  { id: 'goals',      label: 'Goals',      href: '#goals',      icon: '◈' },
  { id: 'contact',    label: 'Contact',    href: '#contact',    icon: '✉' },
];

/* ══════════════════════════════════════════════════════════
   5. SOCIAL PLATFORM CONFIG
   Used by ProfileCard and ContactSection social links.
   key must match the field name in the profile API response.
══════════════════════════════════════════════════════════ */
export const SOCIAL_PLATFORMS = [
  { key: 'github',    icon: '⚙',  label: 'GitHub'    }, // GitHub profile URL
  { key: 'linkedin',  icon: '💼', label: 'LinkedIn'  }, // LinkedIn profile URL
  { key: 'medium',    icon: '✍',  label: 'Medium'    }, // Medium blog URL
  { key: 'instagram', icon: '📸', label: 'Instagram' }, // Instagram profile URL
  { key: 'facebook',  icon: '🔗', label: 'Facebook'  }, // Facebook profile URL
];

/* ══════════════════════════════════════════════════════════
   6. SKILL PROFICIENCY BANDS
   Maps score ranges (0–100) to proficiency labels and colors.
   Used by SkillsSection, AnalyticsSection, and formatters.
══════════════════════════════════════════════════════════ */
export const SKILL_BANDS = {
  expert: {
    min:   80,             // Minimum score for Expert band
    max:   100,            // Maximum score for Expert band
    label: 'Expert',       // Display label
    color: '#C8FF57',      // Lime green — highest proficiency
  },
  advanced: {
    min:   60,             // Minimum score for Advanced band
    max:   79,             // Maximum score for Advanced band
    label: 'Advanced',     // Display label
    color: '#00E5FF',      // Cyan — strong proficiency
  },
  intermediate: {
    min:   40,             // Minimum score for Intermediate band
    max:   59,             // Maximum score for Intermediate band
    label: 'Intermediate', // Display label
    color: '#9B59F5',      // Violet — growing proficiency
  },
  beginner: {
    min:   0,              // Minimum score for Beginner band
    max:   39,             // Maximum score for Beginner band
    label: 'Beginner',     // Display label
    color: '#F5A623',      // Gold — early stage proficiency
  },
};

/* ══════════════════════════════════════════════════════════
   7. CHART COLOR PALETTE
   Consistent colors used across all charts and visualizations.
   Access by index: CHART_COLORS[0] = lime, [1] = cyan, etc.
══════════════════════════════════════════════════════════ */
export const CHART_COLORS = [
  '#C8FF57', // [0] Lime    — primary accent
  '#00E5FF', // [1] Cyan    — secondary accent
  '#9B59F5', // [2] Violet  — tertiary accent
  '#F5A623', // [3] Gold    — warning/highlight
  '#FF6B6B', // [4] Coral   — danger/contrast
  '#1D9E75', // [5] Green   — success
  '#185FA5', // [6] Blue    — info
  '#854F0B', // [7] Amber   — deep warm
];

/* ══════════════════════════════════════════════════════════
   8. ANIMATION DURATIONS & THRESHOLDS
   Used by count-up animations, bar reveals, and observers.
   All durations are in milliseconds unless noted.
══════════════════════════════════════════════════════════ */
export const ANIMATION = {
  COUNTER_DURATION:   1800, // ms — count-up animation total duration
  BAR_DELAY:           120, // ms — stagger delay between each skill bar
  REVEAL_THRESHOLD:   0.12, // IntersectionObserver trigger ratio (0–1)
  TIMELINE_THRESHOLD: 0.20, // IntersectionObserver ratio for timeline items
};

/* ══════════════════════════════════════════════════════════
   9. LOADER MESSAGES
   Sequence of messages shown during initial page load.
   Cycled through by the PageLoader component.
══════════════════════════════════════════════════════════ */
export const LOADER_MESSAGES = [
  'Connecting to server...',  // Step 0 — before any response
  'Loading your profile...',  // Step 1 — profile done
  'Almost ready...',          // Step 2 — analytics done → loader hides next
];

/* ══════════════════════════════════════════════════════════
   10. REQUEST TIMEOUT
   Maximum time in ms before an API request is cancelled.
   Applied globally in services/api.js Axios instance.
══════════════════════════════════════════════════════════ */
export const REQUEST_TIMEOUT = 30000; // 30 seconds — heavy aggregates need more time

/* ══════════════════════════════════════════════════════════
   11. SECTION IDS
   IDs of all portfolio sections — must match <section id="...">
   Used by IntersectionObserver in Home.jsx to track active nav.
══════════════════════════════════════════════════════════ */
export const SECTION_IDS = [
  'overview',    // Dashboard overview section
  'analytics',   // Analytics charts section
  'skills',      // Skills bars section
  'projects',    // Projects grid section
  'experience',  // Career timeline section
  'goals',       // Goals roadmap section
  'contact',     // Contact form section
];

/* ══════════════════════════════════════════════════════════
   12. CHART QUERY PARAM DEFAULTS
   Default values for optional query parameters sent to
   chart endpoints. Override per call when needed.

   Usage in chartsService.js:
     params: { limit: QUERY_DEFAULTS.SKILLS_LIMIT, ...params }
══════════════════════════════════════════════════════════ */
export const QUERY_DEFAULTS = {
  SKILLS_LIMIT:         12,      // /charts/skills/top-bars   → top 12 skills
  STACK_LIMIT:          15,      // /charts/career/stack-frequency → top 15 techs
  PROVIDERS_LIMIT:      10,      // /charts/learning/providers → top 10 providers
  WORD_CLOUD_LIMIT:     40,      // /charts/learning/skills-word-cloud → 40 words
  COURSES_GRANULARITY: 'year',   // /charts/learning/courses-by-year → group by year
  WORD_CLOUD_SOURCE:   'all',    // /charts/learning/skills-word-cloud → all sources
};