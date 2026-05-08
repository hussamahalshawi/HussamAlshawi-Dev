/**
 * constants.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for every constant used across the
 * frontend. Change a value here → updates everywhere.
 * ─────────────────────────────────────────────────────────
 */

// ── API base URL — reads from .env, falls back to local dev ──
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── API endpoint paths ────────────────────────────────────────
export const ENDPOINTS = {
  // Profile
  PROFILE:            '/portfolio/profile',

  // Analytics
  ANALYTICS:          '/portfolio/analytics',
  TECH_STACK:         '/portfolio/analytics/tech-stack',
  TIMELINE:           '/portfolio/analytics/timeline',

  // Skills
  SKILLS:             '/portfolio/skills',
  SKILLS_SUMMARY:     '/portfolio/skills/summary',

  // Projects
  PROJECTS:           '/portfolio/projects',
  PROJECT_DETAIL:     (id) => `/portfolio/projects/${id}`,

  // Experience
  EXPERIENCE:         '/portfolio/experience',
  EXPERIENCE_TIMELINE:'/portfolio/experience/timeline',

  // Education & Courses
  EDUCATION:          '/portfolio/education',
  COURSES:            '/portfolio/courses',
  COURSES_STATS:      '/portfolio/courses/stats',
  ACHIEVEMENTS:       '/portfolio/achievements',
  SELF_STUDY:         '/portfolio/self-study',

  // Goals & Languages
  GOALS:              '/portfolio/goals',
  GOALS_STATS:        '/portfolio/goals/stats',
  LANGUAGES:          '/portfolio/languages',

  // Feedback
  FEEDBACK:           '/feedback',
  FEEDBACK_FEATURED:  '/feedback/featured',
};

// ── Navigation links ──────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'About',      href: '#about'       },
  { label: 'Analytics',  href: '#analytics'   },
  { label: 'Skills',     href: '#skills'       },
  { label: 'Projects',   href: '#projects'     },
  { label: 'Experience', href: '#experience'   },
  { label: 'Goals',      href: '#goals'        },
  { label: 'Contact',    href: '#contact'      },
];

// ── Social platform config ────────────────────────────────────
export const SOCIAL_PLATFORMS = [
  { key: 'github',    icon: '⚙',  label: 'GitHub'   },
  { key: 'linkedin',  icon: '💼', label: 'LinkedIn' },
  { key: 'medium',    icon: '✍',  label: 'Medium'   },
  { key: 'instagram', icon: '📸', label: 'Instagram' },
  { key: 'facebook',  icon: '🔗', label: 'Facebook' },
];

// ── Skill proficiency bands ───────────────────────────────────
export const SKILL_BANDS = {
  expert:       { min: 80, max: 100, label: 'Expert',       color: '#C8FF57' },
  advanced:     { min: 60, max: 79,  label: 'Advanced',     color: '#00E5FF' },
  intermediate: { min: 40, max: 59,  label: 'Intermediate', color: '#9B59F5' },
  beginner:     { min: 0,  max: 39,  label: 'Beginner',     color: '#F5A623' },
};

// ── Chart color palette (consistent across all charts) ───────
export const CHART_COLORS = [
  '#C8FF57', // lime
  '#00E5FF', // cyan
  '#9B59F5', // violet
  '#F5A623', // gold
  '#FF6B6B', // coral
  '#1D9E75', // green
  '#185FA5', // blue
  '#854F0B', // amber
];

// ── Animation durations (ms) ─────────────────────────────────
export const ANIMATION = {
  COUNTER_DURATION:  1800,   // count-up animation ms
  BAR_DELAY:          120,   // stagger delay between skill bars ms
  REVEAL_THRESHOLD:  0.12,  // IntersectionObserver threshold
  TIMELINE_THRESHOLD:0.20,
};

// ── Loader messages sequence ──────────────────────────────────
export const LOADER_MESSAGES = [
  'Connecting to API...',
  'Loading profile...',
  'Fetching analytics...',
  'Loading skills...',
  'Loading projects...',
  'Loading experience...',
  'All systems ready!',
];

// ── Request timeout in ms ─────────────────────────────────────
export const REQUEST_TIMEOUT = 8000;