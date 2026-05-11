/**
 * constants.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for every constant used across
 * the entire frontend. Change a value here → updates
 * everywhere automatically. Never hardcode these values
 * directly inside components or services.
 *
 * Sections:
 *   1. API base URL
 *   2. API endpoint paths
 *   3. Navigation links
 *   4. Social platform config
 *   5. Skill proficiency bands
 *   6. Chart color palette
 *   7. Animation durations
 *   8. Loader messages
 *   9. Request timeout
 * ─────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════════
   1. API BASE URL
   Reads from .env — falls back to local dev if not set
══════════════════════════════════════════════════════════ */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Vite env var with fallback

/* ══════════════════════════════════════════════════════════
   2. API ENDPOINT PATHS
   All paths are relative to API_BASE_URL.
   Function endpoints (e.g. PROJECT_DETAIL) accept an id
   and return the full dynamic path string.
══════════════════════════════════════════════════════════ */
export const ENDPOINTS = {

  // ── Profile ───────────────────────────────────────────
  PROFILE:              '/portfolio/profile',           // GET — public profile data

  // ── Analytics ─────────────────────────────────────────
  ANALYTICS:            '/portfolio/analytics',         // GET — mega aggregate payload
  TECH_STACK:           '/portfolio/analytics/tech-stack', // GET — tech frequency data
  TIMELINE:             '/portfolio/analytics/timeline',   // GET — career timeline

  // ── Skills ────────────────────────────────────────────
  SKILLS:               '/portfolio/skills',            // GET — all skills grouped
  SKILLS_SUMMARY:       '/portfolio/skills/summary',    // GET — lightweight summary

  // ── Projects ──────────────────────────────────────────
  PROJECTS:             '/portfolio/projects',          // GET — all projects (filterable)
  PROJECT_DETAIL:       (id) => `/portfolio/projects/${id}`, // GET — single project by ID

  // ── Experience ────────────────────────────────────────
  EXPERIENCE:           '/portfolio/experience',        // GET — work experience list
  EXPERIENCE_TIMELINE:  '/portfolio/experience/timeline', // GET — timeline format

  // ── Education & Courses ───────────────────────────────
  EDUCATION:            '/portfolio/education',         // GET — education records
  COURSES:              '/portfolio/courses',           // GET — completed courses
  COURSES_STATS:        '/portfolio/courses/stats',     // GET — courses statistics
  ACHIEVEMENTS:         '/portfolio/achievements',      // GET — achievements list
  SELF_STUDY:           '/portfolio/self-study',        // GET — self-study records

  // ── Goals & Languages ─────────────────────────────────
  GOALS:                '/portfolio/goals',             // GET — career roadmap goals
  GOALS_STATS:          '/portfolio/goals/stats',       // GET — goals statistics
  LANGUAGES:            '/portfolio/languages',         // GET — spoken languages

  // ── Feedback / Contact ────────────────────────────────
  FEEDBACK:             '/feedback',                    // POST — submit contact message
  FEEDBACK_FEATURED:    '/feedback/featured',           // GET — approved testimonials
};

/* ══════════════════════════════════════════════════════════
   3. NAVIGATION LINKS
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
   4. SOCIAL PLATFORM CONFIG
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
   5. SKILL PROFICIENCY BANDS
   Maps score ranges (0–100) to proficiency labels and colors.
   Used by SkillsSection, AnalyticsSection, and formatters.
══════════════════════════════════════════════════════════ */
export const SKILL_BANDS = {
  expert: {
    min:   80,          // Minimum score for Expert band
    max:   100,         // Maximum score for Expert band
    label: 'Expert',    // Display label
    color: '#C8FF57',   // Lime green — highest proficiency
  },
  advanced: {
    min:   60,          // Minimum score for Advanced band
    max:   79,          // Maximum score for Advanced band
    label: 'Advanced',  // Display label
    color: '#00E5FF',   // Cyan — strong proficiency
  },
  intermediate: {
    min:   40,          // Minimum score for Intermediate band
    max:   59,          // Maximum score for Intermediate band
    label: 'Intermediate', // Display label
    color: '#9B59F5',   // Violet — growing proficiency
  },
  beginner: {
    min:   0,           // Minimum score for Beginner band
    max:   39,          // Maximum score for Beginner band
    label: 'Beginner',  // Display label
    color: '#F5A623',   // Gold — early stage proficiency
  },
};

/* ══════════════════════════════════════════════════════════
   6. CHART COLOR PALETTE
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
   7. ANIMATION DURATIONS & THRESHOLDS
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
   8. LOADER MESSAGES
   Sequence of messages shown during initial page load.
   Cycled through by the PageLoader component.
══════════════════════════════════════════════════════════ */
export const LOADER_MESSAGES = [
  'Connecting to API...',     // Step 1 — establishing connection
  'Loading profile...',       // Step 2 — fetching profile data
  'Fetching analytics...',    // Step 3 — fetching analytics data
  'Loading skills...',        // Step 4 — fetching skills data
  'Loading projects...',      // Step 5 — fetching projects data
  'Loading experience...',    // Step 6 — fetching experience data
  'All systems ready!',       // Step 7 — everything loaded
];

/* ══════════════════════════════════════════════════════════
   9. REQUEST TIMEOUT
   Maximum time in ms before an API request is cancelled.
   Applied globally in services/api.js Axios instance.
══════════════════════════════════════════════════════════ */
export const REQUEST_TIMEOUT = 8000; // 8 seconds — reasonable for slow connections

/* ══════════════════════════════════════════════════════════
   10. SECTION IDS
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