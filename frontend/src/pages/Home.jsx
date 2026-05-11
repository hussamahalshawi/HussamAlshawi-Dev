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
 *   #skills     → SkillsSection     (bars + radar)
 *   #projects   → ProjectsSection   (filterable grid)
 *   #experience → ExperienceSection (career timeline)
 *   #goals      → GoalsSection      (roadmap cards)
 *   #contact    → ContactForm       (message form)
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useState }   from 'react';

// ── Central data hook ────────────────────────────────────────────
import { usePortfolioData }      from '@/hooks/usePortfolioData';

// ── Layout shell ─────────────────────────────────────────────────
import DashboardLayout           from '@/components/layout/DashboardLayout';

// ── Portfolio sections ────────────────────────────────────────────
import OverviewSection           from '@/components/sections/OverviewSection';
import AnalyticsSection          from '@/components/sections/AnalyticsSection';
import SkillsSection             from '@/components/sections/SkillsSection';
import ProjectsSection           from '@/components/sections/ProjectsSection';
import ExperienceSection         from '@/components/sections/ExperienceSection';
import GoalsSection              from '@/components/sections/GoalsSection';
import ContactForm               from '@/components/sections/ContactForm';

// ── UI helpers ───────────────────────────────────────────────────
import PageLoader                from '@/components/ui/PageLoader';
import OfflineBanner             from '@/components/ui/OfflineBanner';

// ── Shared section layout styles ─────────────────────────────────
import '@/styles/layout/Sections.css';

/**
 * Section IDs — must match each <section id="..."> element below
 * AND the href values in DashboardLayout's NAV_ITEMS array.
 * Used by IntersectionObserver to highlight the active nav link.
 */
const SECTION_IDS = [
  'overview',
  'analytics',
  'skills',
  'projects',
  'experience',
  'goals',
  'contact',
];

/**
 * Home — assembles the full Devoryn portfolio dashboard.
 *
 * @returns {JSX.Element}
 */
export default function Home() {

  // ── Fetch all portfolio data in parallel ─────────────────────
  const { data, loading, error } = usePortfolioData();

  // ── Track which section is currently in the viewport ─────────
  const [activeSection, setActiveSection] = useState('overview');

  // ── IntersectionObserver — sync active nav with scroll ───────
  useEffect(() => {
    if (loading) return;                          // Wait for sections to render

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Set the active section when it enters the viewport center
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }        // Trigger near vertical center of viewport
    );

    // Observe each registered section by ID
    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);              // Only observe sections that exist in DOM
    });

    return () => observer.disconnect();          // Clean up observer on unmount or re-run
  }, [loading]);                                  // Re-run after page finishes loading

  // ── Full-page loader while data fetches ──────────────────────
  if (loading) return <PageLoader visible />;

  // ── Render dashboard ─────────────────────────────────────────
  return (
    <DashboardLayout
      activeSection={activeSection}              // Passed to sidebar for active link styling
      profile={data.profile}                     // Needed for user card + avatar in sidebar
    >

      {/* Offline / error notification banner (shows only when all APIs fail) */}
      {error && <OfflineBanner message={error} />}

      {/* ──────────────────────────────────────────────────────
          SECTION 1 — Overview
          Profile card + KPI bento grid + top skills panel
      ─────────────────────────────────────────────────────── */}
      <OverviewSection
        profile={data.profile}
        analytics={data.analytics}
      />

      {/* ──────────────────────────────────────────────────────
          SECTION 2 — Analytics
          KPI cards (count-up) + skill bars + distribution bands
      ─────────────────────────────────────────────────────── */}
      <AnalyticsSection
        analytics={data.analytics}
      />

      {/* ──────────────────────────────────────────────────────
          SECTION 3 — Skills
          Animated bars grouped by category + sticky radar chart
      ─────────────────────────────────────────────────────── */}
      <SkillsSection
        skills={data.skills}
      />

      {/* ──────────────────────────────────────────────────────
          SECTION 4 — Projects
          Glass filter tabs + cover-image cards with hover effects
      ─────────────────────────────────────────────────────── */}
      <ProjectsSection
        projects={data.projects}
      />

      {/* ──────────────────────────────────────────────────────
          SECTION 5 — Experience
          Vertical timeline with staggered entrance animations
          (fetches its own data internally via apiClient)
      ─────────────────────────────────────────────────────── */}
      <ExperienceSection />

      {/* ──────────────────────────────────────────────────────
          SECTION 6 — Goals
          Career roadmap glass cards with progress bars
          (fetches its own data internally via goalsService)
      ─────────────────────────────────────────────────────── */}
      <GoalsSection />

      {/* ──────────────────────────────────────────────────────
          SECTION 7 — Contact
          Two-column: glass form panel + contact info cards
          (fetches profile for contact details via useProfile)
      ─────────────────────────────────────────────────────── */}
      <ContactForm />

    </DashboardLayout>
  );
}