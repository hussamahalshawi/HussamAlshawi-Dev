/**
 * Home.jsx — Main Portfolio Dashboard Page
 * ─────────────────────────────────────────────────────────
 * Section visibility is controlled by sidebar nav clicks + URL hash.
 * Each section has its own hash (#overview, #analytics, etc.)
 * so page reload preserves the active section.
 * No scroll between sections — each section shows/hides via CSS.
 * Data loads once on mount and stays alive (keep-alive pattern).
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect }                  from 'react';
import { usePortfolioData }                     from '../hooks/usePortfolioData';
import { usePortfolio }                         from '../hooks/usePortfolio';
import DashboardLayout                          from '../components/layout/DashboardLayout';
import OverviewSection                          from '../components/sections/OverviewSection';
import AnalyticsSection                         from '../components/sections/AnalyticsSection';
import SkillsSection                            from '../components/sections/SkillsSection';
import PageLoader                               from '../components/ui/PageLoader';
import '../styles/layout/Sections.css';

/* ── Section IDs — must match NAV_ITEMS order ───────────────── */
const SECTION_IDS = [
  'overview',
  'experience',  // Experience & Achievements معاً
  'projects',
  'skills',
  'education',   // Education & Courses معاً
  'selfstudy',
  'analytics',
  'goals',
  'feedback',
  'about',
  'contact',
];

/* ── Default active section on first load ───────────────────── */
const DEFAULT_SECTION = 'overview';

/* ── Read active section from URL hash ──────────────────────── */
function getSectionFromHash() {
  const hash = window.location.hash.replace('#', '');
  const sectionId = hash.split('/')[0]; // Handle sub-hashes like #analytics/skills
  return SECTION_IDS.includes(sectionId) ? sectionId : DEFAULT_SECTION;
}

/* ── Offline banner ─────────────────────────────────────────── */
function OfflineBanner({ message }) {
  return (
    <div
      className="offline-banner"
      role="alert"
      aria-live="assertive"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function Home() {

  /* ── Portfolio data — loads once, stays alive ───────────── */
  const { data, loading, error, progress } = usePortfolioData();
  const { portfolioData, loading: portfolioLoading, error: portfolioError } = usePortfolio();

  /* ── Active section — driven by sidebar clicks + URL hash ─ */
  const [activeSection, setActiveSection] = useState(getSectionFromHash);

  /* ── Sync activeSection with URL hash changes ────────────── */
  useEffect(() => {
    const onHashChange = () => setActiveSection(getSectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  /* ── Show loader while phase 1 data is loading ──────────── */
  if (loading) {
    return <PageLoader visible progress={progress} />;
  }

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}        /* Pass setter to layout for nav clicks */
      profile={data.profile}
    >

      {error && <OfflineBanner message={error} />}

      {/* ── Each section is always mounted but only visible when active ── */}
      {/* CSS handles show/hide — no remount, no data refetch             */}

      {/* SECTION 1 — Overview */}
      <div
        id="overview"
        role="region"
        aria-label="Overview"
        style={{ display: activeSection === 'overview' ? 'block' : 'none' }}
      >
        <OverviewSection
          profile={data.profile}
          analytics={data.analytics}
          languages={data.languages?.languages || []}
        />
      </div>

      {/* SECTION 2 — Experience & Achievements */}
        <div
          id="experience"
          role="region"
          aria-label="Experience and Achievements"
          style={{ display: activeSection === 'experience' ? 'block' : 'none' }}
        >
          <div className="section-placeholder">
            Experience &amp; Achievements Section — Coming Soon
          </div>
        </div>

      {/* SECTION 3 — Projects */}
      <div
        id="projects"
        role="region"
        aria-label="Projects"
        style={{ display: activeSection === 'projects' ? 'block' : 'none' }}
      >
        <div className="section-placeholder">
          Projects Section — Coming Soon
        </div>
      </div>

      {/* SECTION 4 — Skills */}
      <div
        id="skills"
        role="region"
        aria-label="Skills"
        style={{ display: activeSection === 'skills' ? 'block' : 'none' }}
      >
        <SkillsSection
          skills={data.skills}
          summary={data.skillsSummary}
        />
      </div>

      {/* SECTION 5 — Education & Courses */}
        <div
          id="education"
          role="region"
          aria-label="Education and Courses"
          style={{ display: activeSection === 'education' ? 'block' : 'none' }}
        >
          <div className="section-placeholder">
            Education &amp; Courses Section — Coming Soon
          </div>
        </div>



      {/* SECTION 7 — Self Study */}
      <div
        id="selfstudy"
        role="region"
        aria-label="Self Study"
        style={{ display: activeSection === 'selfstudy' ? 'block' : 'none' }}
      >
        <div className="section-placeholder">
          Self Study Section — Coming Soon
        </div>
      </div>

      {/* SECTION 8 — Analytics */}
      <div
        id="analytics"
        role="region"
        aria-label="Analytics"
        style={{ display: activeSection === 'analytics' ? 'block' : 'none' }}
      >
        <AnalyticsSection analytics={data.analytics} portfolio={portfolioData} portfolioLoading={portfolioLoading} portfolioError={portfolioError} />
      </div>

      {/* SECTION 9 — Goals */}
      <div
        id="goals"
        role="region"
        aria-label="Goals"
        style={{ display: activeSection === 'goals' ? 'block' : 'none' }}
      >
        <div className="section-placeholder">
          Goals Section — Coming Soon
        </div>
      </div>

      {/* SECTION 10 — Feedback */}
      <div
        id="feedback"
        role="region"
        aria-label="Feedback"
        style={{ display: activeSection === 'feedback' ? 'block' : 'none' }}
      >
        <div className="section-placeholder">
          Feedback Section — Coming Soon
        </div>
      </div>

      {/* SECTION 11 — About */}
      <div
        id="about"
        role="region"
        aria-label="About"
        style={{ display: activeSection === 'about' ? 'block' : 'none' }}
      >
        <div className="section-placeholder">
          About Section — Coming Soon
        </div>
      </div>

      {/* SECTION 12 — Contact */}
      <div
        id="contact"
        role="region"
        aria-label="Contact"
        style={{ display: activeSection === 'contact' ? 'block' : 'none' }}
      >
        <div className="section-placeholder">
          Contact Section — Coming Soon
        </div>
      </div>

    </DashboardLayout>
  );
}