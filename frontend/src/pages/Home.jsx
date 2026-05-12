/**
 * Home.jsx — Main Portfolio Dashboard Page
 * ─────────────────────────────────────────────────────────
 * This is the Devoryn-style dashboard home.
 * It wraps all portfolio sections inside DashboardLayout
 * (which provides the fixed glass sidebar + sticky topbar).
 *
 * Data Strategy:
 *   usePortfolioData() fires all API requests in parallel via
 *   Promise.allSettled — so a single failing endpoint never
 *   blocks the entire page. Each section receives its slice
 *   of data as a prop and handles its own loading/error state.
 *
 * Section render order (matches sidebar nav):
 *   #overview   → OverviewSection   (profile card + KPI bento)
 *   #analytics  → AnalyticsSection  (charts + distributions)
 *   #skills     → SkillsSection     (bars + radar + cloud)
 *   #projects   → ProjectsSection   (filterable grid)
 *   #experience → ExperienceSection (career timeline)
 *   #goals      → GoalsSection      (roadmap cards)
 *   #contact    → ContactForm       (message form)
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useState }          from 'react';                    // React hooks

// ── Central data hook ─────────────────────────────────────────────
import { usePortfolioData }             from '../hooks/usePortfolioData'; // Parallel API fetcher

// ── Layout shell ──────────────────────────────────────────────────
import DashboardLayout                  from '../components/layout/DashboardLayout'; // Sidebar + topbar

// ── Portfolio sections ─────────────────────────────────────────────
import OverviewSection                  from '../components/sections/OverviewSection';   // Section 1
import AnalyticsSection                 from '../components/sections/AnalyticsSection';  // Section 2
import SkillsSection                    from '../components/sections/SkillsSection';     // Section 3

// ── UI helpers ────────────────────────────────────────────────────
import PageLoader                       from '../components/ui/PageLoader';              // Full-screen loader

// ── Shared section layout styles ──────────────────────────────────
import '../styles/layout/Sections.css';                                  // Section padding + container

/* ── Section IDs — must match each <section id="..."> element ───── */
/* Used by IntersectionObserver to highlight the active nav link      */
const SECTION_IDS = [
  'overview',    // Dashboard overview
  'analytics',   // Analytics charts
  'skills',      // Skills visualization
  'projects',    // Projects grid
  'experience',  // Career timeline
  'goals',       // Goals roadmap
  'contact',     // Contact form
];

/* ── Offline banner component — shown when all APIs fail ─────────── */
/**
 * OfflineBanner — displays a warning strip when backend is offline.
 * @param {{ message: string }} props
 * @returns {JSX.Element}
 */
function OfflineBanner({ message }) {
  return (
    <div
      className="offline-banner"               /* Styled in index.css                  */
      role="alert"                             /* ARIA: announces as alert             */
      aria-live="assertive"                    /* Screen reader announces immediately  */
    >
      {/* Warning icon */}
      <span aria-hidden="true">⚠</span>
      {/* Error message from API */}
      <span>{message}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT: Home
   ──────────────────────────────────────────────────────────────
   Updated to pass real-time progress to the PageLoader.
════════════════════════════════════════════════════════════════ */
export default function Home() {

  /* ── 1. Extract 'progress' from the hook ────────────────────── */
  // We add 'progress' to the destructuring to get the number of settled API calls
  const { data, loading, error, progress } = usePortfolioData();

  /* ── Track which section is currently in the viewport ────────── */
  const [activeSection, setActiveSection] = useState('overview');

  /* ── IntersectionObserver — sync active nav with scroll ──────── */
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );

    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  /* ── 2. Pass 'progress' to the PageLoader ───────────────────── */
  if (loading) {
    // We pass the numeric progress value so the loader dots and messages sync
    return <PageLoader visible progress={progress} />;
  }

  /* ── Render dashboard ───────────────────────────────────────── */
  return (
    <DashboardLayout
      activeSection={activeSection}
      profile={data.profile}
    >
      {error && (
        <OfflineBanner message={error} />
      )}

      {/* SECTION 1 — Overview */}
      <OverviewSection
        profile={data.profile}
        analytics={data.analytics}
      />

      {/* Rest of sections... */}
    </DashboardLayout>
  );
}