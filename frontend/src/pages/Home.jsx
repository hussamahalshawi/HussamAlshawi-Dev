/**
 * Home.jsx — الصفحة الرئيسية
 * تجمع السيكشنز فقط — لا لوجيك هنا
 */
import { usePortfolioData }  from '../hooks/usePortfolioData';
import HeroSection           from '../components/sections/HeroSection';
import AnalyticsSection      from '../components/sections/AnalyticsSection';
import SkillsSection         from '../components/sections/SkillsSection';
import ProjectsSection       from '../components/sections/ProjectsSection';
import GoalsSection          from '../components/sections/GoalsSection';
import ContactForm           from '../components/sections/ContactForm';
import OfflineBanner         from '../components/ui/OfflineBanner';
import PageLoader            from '../components/ui/PageLoader';
import '../styles/pages/Home.css';

export default function Home() {
  const { data, loading, error } = usePortfolioData();

  // ── شاشة التحميل الأولى ────────────────────────────────────────
  if (loading) return <PageLoader />;

  return (
    <>
      {/* بانر واضح لو الـ API وقع */}
      {error && <OfflineBanner message={error} />}

      <HeroSection      profile={data.profile} />
      <AnalyticsSection analytics={data.analytics} />
      <SkillsSection    skills={data.skills} />
      <ProjectsSection  projects={data.projects} />
      <GoalsSection     profile={data.profile} />
      <ContactForm />
    </>
  );
}