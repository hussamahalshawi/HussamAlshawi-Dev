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

import AnimatedSection from '../components/ui/AnimatedSection';
// ── Shared section layout styles ──────────────────────────────────
import '../styles/layout/Sections.css';                                  // Section padding + container

/** Section IDs — must match NAV_ITEMS order */
const SECTION_IDS = [
  'overview',
  'experience',
  'projects',
  'skills',
  'education',
  'courses',
  'selfstudy',
  'analytics',
  'goals',
  'feedback',
  'about',
  'contact',
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
    <DashboardLayout activeSection={activeSection} profile={data.profile}>

  {error && <OfflineBanner message={error} />}

  {/* SECTION 1 — Overview */}
  <AnimatedSection id="overview" className="section">
    <OverviewSection profile={data.profile} analytics={data.analytics} />
  </AnimatedSection>

  {/* SECTION 2 — Experience & Achievements */}
  <AnimatedSection id="experience" className="section section--alt">
    {/* <ExperienceSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Experience Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 3 — Projects */}
  <AnimatedSection id="projects" className="section">
    {/* <ProjectsSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Projects Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 4 — Skills */}
  <AnimatedSection id="skills" className="section section--alt">
    <SkillsSection skills={data.skills} summary={data.skillsSummary} />
  </AnimatedSection>

  {/* SECTION 5 — Education + Courses */}
  <AnimatedSection id="education" className="section">
    {/* <EducationSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Education Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 6 — Courses */}
  <AnimatedSection id="courses" className="section section--alt">
    {/* <CoursesSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Courses Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 7 — Self Study */}
  <AnimatedSection id="selfstudy" className="section">
    {/* <SelfStudySection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Self Study Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 8 — Analytics */}
  <AnimatedSection id="analytics" className="section section--alt">
    <AnalyticsSection analytics={data.analytics} />
  </AnimatedSection>

  {/* SECTION 9 — Goals */}
  <AnimatedSection id="goals" className="section">
    {/* <GoalsSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Goals Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 10 — Feedback / Testimonials */}
  <AnimatedSection id="feedback" className="section section--alt">
    {/* <FeedbackSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Feedback Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 11 — About */}
  <AnimatedSection id="about" className="section">
    {/* <AboutSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      About Section — Coming Soon
    </div>
  </AnimatedSection>

  {/* SECTION 12 — Contact */}
  <AnimatedSection id="contact" className="section section--alt">
    {/* <ContactSection /> */}
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
      Contact Section — Coming Soon
    </div>
  </AnimatedSection>

</DashboardLayout>
  );
}