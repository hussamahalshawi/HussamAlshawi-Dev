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
════════════════════════════════════════════════════════════════ */
/**
 * Home — assembles the full Devoryn portfolio dashboard.
 * @returns {JSX.Element}
 */
export default function Home() {

  /* ── Fetch all portfolio data in parallel ───────────────────── */
  const { data, loading, error } = usePortfolioData();  // Fires all API calls at once

  /* ── Track which section is currently in the viewport ────────── */
  const [activeSection, setActiveSection] = useState('overview'); // Default to overview

  /* ── IntersectionObserver — sync active nav with scroll ──────── */
  useEffect(() => {
    if (loading) return;                        // Wait for sections to mount after load

    /* Create observer that fires near the vertical center of viewport */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          /* Update active section when it enters the viewport */
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id); // Set to the visible section's ID
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }      // Trigger when section hits vertical center
    );

    /* Observe every registered section by ID */
    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);  // Find section element in DOM
      if (el) observer.observe(el);            // Only observe if section exists
    });

    /* Cleanup: disconnect observer when component unmounts or re-runs */
    return () => observer.disconnect();
  }, [loading]);                                // Re-run after data finishes loading

  /* ── Full-page loader while data fetches ────────────────────── */
  if (loading) {
    return <PageLoader visible />;              // Shows spinner until all API calls settle
  }

  /* ── Render dashboard ───────────────────────────────────────── */
  return (
    <DashboardLayout
      activeSection={activeSection}             /* Passed to sidebar for active link    */
      profile={data.profile}                    /* Needed for user card + avatar        */
    >

      {/* ── Offline / error notification banner ── */}
      {/* Shown only when ALL API endpoints fail simultaneously */}
      {error && (
        <OfflineBanner message={error} />
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — Overview
          Profile card + KPI bento grid + performance chart
      ══════════════════════════════════════════════════════ */}
      <OverviewSection
        profile={data.profile}                  /* Profile data for card + avatar       */
        analytics={data.analytics}              /* Analytics data for KPIs + charts     */
      />

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — Analytics
          KPI cards (count-up) + skill bars + distribution bands
      ══════════════════════════════════════════════════════ */}
      <AnalyticsSection
        analytics={data.analytics}              /* Full analytics payload               */
      />

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — Skills
          Radar chart + animated bars by category + skill cloud
      ══════════════════════════════════════════════════════ */}
      <SkillsSection
        skills={data.skills}                    /* Grouped skills from API              */
        summary={null}                          /* Summary fetched separately if needed */
      />

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — Projects
          Glass filter tabs + cover-image cards
          TODO: wire ProjectsSection when built in Phase 7
      ══════════════════════════════════════════════════════ */}
      <section
        id="projects"
        className="section section--alt"
        aria-label="Projects — coming soon"
        style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.10em' }}>
          PROJECTS — COMING SOON
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — Experience
          Vertical timeline with staggered entrance animations
          TODO: wire ExperienceSection when built in Phase 7
      ══════════════════════════════════════════════════════ */}
      <section
        id="experience"
        className="section"
        aria-label="Experience — coming soon"
        style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.10em' }}>
          EXPERIENCE — COMING SOON
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 6 — Goals
          Career roadmap glass cards with progress bars
          TODO: wire GoalsSection when built in Phase 7
      ══════════════════════════════════════════════════════ */}
      <section
        id="goals"
        className="section section--alt"
        aria-label="Goals — coming soon"
        style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.10em' }}>
          GOALS — COMING SOON
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 7 — Contact
          Two-column: glass form panel + contact info cards
          TODO: wire ContactForm when built in Phase 7
      ══════════════════════════════════════════════════════ */}
      <section
        id="contact"
        className="section"
        aria-label="Contact — coming soon"
        style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.10em' }}>
          CONTACT — COMING SOON
        </p>
      </section>

    </DashboardLayout>
  );
}