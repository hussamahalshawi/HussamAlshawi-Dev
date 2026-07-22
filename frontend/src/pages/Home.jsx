/**
 * Home.jsx — Main Portfolio Dashboard Page
 * ─────────────────────────────────────────────────────────
 * Section visibility is controlled by sidebar nav clicks + URL hash.
 * Each section has its own hash (#overview, #analytics, etc.)
 * so page reload preserves the active section.
 * No scroll between sections — each section shows/hides via CSS.
 * Data loads once on mount and stays alive (keep-alive pattern).
 *
 * All sections use eager imports for keep-alive animation state.
 * About and Contact sections are still placeholders.
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect }                            from 'react';
import { usePortfolioData }                                 from '../hooks/usePortfolioData';
import DashboardLayout                                      from '../components/layout/DashboardLayout';
import OverviewSection                                      from '../components/sections/OverviewSection';
import AnalyticsSection                                     from '../components/sections/AnalyticsSection';
import SkillsSection                                        from '../components/sections/SkillsSection';
import ExperienceSection                                    from '../components/sections/ExperienceSection';
import ProjectsSection                                      from '../components/sections/ProjectsSection';
import EducationSection                                     from '../components/sections/EducationSection';
import SelfStudySection                                     from '../components/sections/SelfStudySection';
import GoalsSection                                         from '../components/sections/GoalsSection';
import FeedbackSection                                      from '../components/sections/FeedbackSection';
import PageLoader                                           from '../components/ui/PageLoader';
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

/* ── Section wrapper — controls visibility ──────────────────── */
function SectionWrapper({ id, activeSection, children }) {
  const isVisible = activeSection === id;
  return (
    <div
      role="region"
      aria-label={id}
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function Home() {

  /* ── Portfolio data — loads once, stays alive ───────────── */
  const { data, loading, error, progress } = usePortfolioData();

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

      {/* ── Each section is visible when active, hidden otherwise ── */}
      {/* NOTE: id attributes live on the section components themselves, */}
      {/* not on these wrapper divs — avoids duplicate DOM ids.        */}

      {/* SECTION 1 — Overview (eager, always mounted) */}
      <SectionWrapper id="overview" activeSection={activeSection}>
        <OverviewSection
          profile={data.profile}
          analytics={data.analytics}
          languages={data.languages?.languages || []}
          portfolio={data.portfolioSummary}
          skillsCharts={data.skillsCharts}
          goalsCharts={data.goalsCharts}
          chartsLoading={!data.analytics || !data.portfolioSummary || !data.skillsCharts || !data.goalsCharts}
        />
      </SectionWrapper>

      {/* SECTION 2 — Experience & Achievements */}
      <SectionWrapper id="experience" activeSection={activeSection}>
        <ExperienceSection
          experience={data.experience}
          achievements={data.achievements}
          careerCharts={data.careerCharts}
        />
      </SectionWrapper>

      {/* SECTION 3 — Projects */}
      <SectionWrapper id="projects" activeSection={activeSection}>
        <ProjectsSection projects={data.projects} />
      </SectionWrapper>

      {/* SECTION 4 — Skills (eager, always mounted) */}
      <SectionWrapper id="skills" activeSection={activeSection}>
        <SkillsSection
          skills={data.skills}
          summary={data.skillsSummary}
        />
      </SectionWrapper>

      {/* SECTION 5 — Education & Courses */}
      <SectionWrapper id="education" activeSection={activeSection}>
        <EducationSection education={data.education} courses={data.courses} />
      </SectionWrapper>

      {/* SECTION 7 — Self Study */}
      <SectionWrapper id="selfstudy" activeSection={activeSection}>
        <SelfStudySection selfStudy={data.selfStudy} />
      </SectionWrapper>

      {/* SECTION 8 — Analytics (eager, always mounted) */}
      <SectionWrapper id="analytics" activeSection={activeSection}>
        <AnalyticsSection analytics={data.analytics} portfolio={data.portfolioSummary} />
      </SectionWrapper>

      {/* SECTION 9 — Goals */}
      <SectionWrapper id="goals" activeSection={activeSection}>
        <GoalsSection goals={data.goals} goalsStats={data.goalsStats} />
      </SectionWrapper>

      {/* SECTION 10 — Feedback */}
      <SectionWrapper id="feedback" activeSection={activeSection}>
        <FeedbackSection feedback={data.feedback} />
      </SectionWrapper>

      {/* SECTION 11 — About */}
      <SectionWrapper id="about" activeSection={activeSection}>
        <div className="section-placeholder" style={{ minHeight: '300px', borderRadius: 'var(--r-lg)', background: 'var(--glass-medium)' }}>
          About
        </div>
      </SectionWrapper>

      {/* SECTION 12 — Contact */}
      <SectionWrapper id="contact" activeSection={activeSection}>
        <div className="section-placeholder" style={{ minHeight: '300px', borderRadius: 'var(--r-lg)', background: 'var(--glass-medium)' }}>
          Contact
        </div>
      </SectionWrapper>

    </DashboardLayout>
  );
}
