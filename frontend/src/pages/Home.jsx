/**
 * Home.jsx — Dashboard Portfolio Homepage
 * ─────────────────────────────────────────────────────────
 * Main page assembled inside DashboardLayout.
 * Sections: Overview (Hero), Analytics KPIs, Skills,
 *           Projects, Experience, Goals, Contact.
 * Data fetched via usePortfolioData hook (parallel requests).
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useState }  from 'react';
import { usePortfolioData }      from '../hooks/usePortfolioData';        // Central data hook
import DashboardLayout           from '../components/layout/DashboardLayout'; // Shell layout
import OverviewSection           from '../components/sections/OverviewSection';   // Hero/KPI
import AnalyticsSection          from '../components/sections/AnalyticsSection';  // Charts
import SkillsSection             from '../components/sections/SkillsSection';     // Skill bars
import ProjectsSection           from '../components/sections/ProjectsSection';   // Projects grid
import ExperienceSection         from '../components/sections/ExperienceSection'; // Timeline
import GoalsSection              from '../components/sections/GoalsSection';      // Roadmap
import ContactForm               from '../components/sections/ContactForm';       // Contact
import PageLoader                from '../components/ui/PageLoader';              // Full-page loader
import OfflineBanner             from '../components/ui/OfflineBanner';           // Error banner
import '../styles/layout/Sections.css';                                           // Section layouts
import '../styles/pages/Home.css';                                                // Page styles

/**
 * Section IDs for IntersectionObserver active nav tracking.
 * Must match the 'id' attributes on each <section> element.
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
 * Home — the full portfolio page inside the dashboard shell.
 */
export default function Home() {

  const { data, loading, error } = usePortfolioData();        // Parallel API fetch
  const [activeSection, setActiveSection] = useState('overview'); // Currently in-view section

  // ── Track active section via IntersectionObserver ─────────────────────────
  useEffect(() => {
    if (loading) return;                                        // Wait until data loads

    // Observer detects which section is in the viewport center
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);                  // Update active nav item
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }                     // Trigger near viewport center
    );

    // Observe each registered section element
    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);                            // Only observe existing sections
    });

    return () => observer.disconnect();                         // Cleanup on unmount
  }, [loading]);                                               // Re-run after data loads

  // ── Full-page loader while data fetches ───────────────────────────────────
  if (loading) return <PageLoader visible />;

  return (
    <DashboardLayout
      activeSection={activeSection}
      profile={data.profile}
    >
      {/* Offline / error notification banner */}
      {error && <OfflineBanner message={error} />}

      {/* ─────────────────────────────────────────
          SECTION: Overview — Profile card + KPI stats
      ───────────────────────────────────────── */}
      <OverviewSection
        profile={data.profile}
        analytics={data.analytics}
      />

      {/* ─────────────────────────────────────────
          SECTION: Analytics — KPI cards + distributions
      ───────────────────────────────────────── */}
      <AnalyticsSection analytics={data.analytics} />

      {/* ─────────────────────────────────────────
          SECTION: Skills — Bars + Radar chart
      ───────────────────────────────────────── */}
      <SkillsSection skills={data.skills} />

      {/* ─────────────────────────────────────────
          SECTION: Projects — Filterable grid
      ───────────────────────────────────────── */}
      <ProjectsSection projects={data.projects} />

      {/* ─────────────────────────────────────────
          SECTION: Experience — Career timeline
      ───────────────────────────────────────── */}
      <ExperienceSection />

      {/* ─────────────────────────────────────────
          SECTION: Goals — Career roadmap cards
      ───────────────────────────────────────── */}
      <GoalsSection />

      {/* ─────────────────────────────────────────
          SECTION: Contact — Form + info column
      ───────────────────────────────────────── */}
      <ContactForm />
    </DashboardLayout>
  );
}