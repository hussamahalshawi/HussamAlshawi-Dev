/**
 * Home.jsx — Main portfolio landing page
 * Assembles all sections in order.
 * Data is fetched once via usePortfolioData and passed down as props.
 * Sections with their own internal data needs fetch independently.
 */
import { usePortfolioData }   from '../hooks/usePortfolioData'; // Central data hook
import HeroSection            from '../components/sections/HeroSection';      // Hero / landing
import AnalyticsSection       from '../components/sections/AnalyticsSection'; // KPI + charts
import SkillsSection          from '../components/sections/SkillsSection';    // Skill bars + radar
import ProjectsSection        from '../components/sections/ProjectsSection';  // Projects grid
import GoalsSection           from '../components/sections/GoalsSection';     // Career roadmap
import ContactForm            from '../components/sections/ContactForm';      // Contact form
import OfflineBanner          from '../components/ui/OfflineBanner';          // Error banner
import PageLoader             from '../components/ui/PageLoader';             // Initial loader
import '../styles/pages/Home.css';                                            // Page-level styles
import '../styles/components/AnalyticsSection.css';                           // Analytics section styles

/**
 * Home — the single-page portfolio layout.
 * - Shows a full-page loader while data is being fetched
 * - Shows an offline banner if any API call failed
 * - Passes data down to each section as props
 */
export default function Home() {
  const { data, loading, error } = usePortfolioData();          // Fetch all data in parallel

  // ── Show full-page loader on initial data fetch ──────────────────────────
  if (loading) return <PageLoader />;

  return (
    <>
      {/* ── Show banner if API partially or fully failed ── */}
      {error && <OfflineBanner message={error} />}

      {/* ── Sections in order ── */}
      <HeroSection      profile={data.profile}           />  {/* Name, bio, avatar, stats */}
      <AnalyticsSection analytics={data.analytics}       />  {/* KPI cards, top skills, dist */}
      <SkillsSection    skills={data.skills}             />  {/* Animated bars + radar chart */}
      <ProjectsSection  projects={data.projects}         />  {/* Projects grid with filters */}
      <GoalsSection                                      />  {/* Fetches goals internally */}
      <ContactForm                                       />  {/* Form + contact info */}
    </>
  );
}