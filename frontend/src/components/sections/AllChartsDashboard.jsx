import { useState, useMemo, lazy, Suspense } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  Zap,
  Target,
  Code2,
  BookOpen,
} from 'lucide-react';

/* ── Lazy-loaded chart components ──────────────────────────── */
const SankeyChart           = lazy(() => import('../charts/SankeyChart'));
const TimelineAreaChart     = lazy(() => import('../charts/TimelineAreaChart'));
const DualAxisChart         = lazy(() => import('../charts/DualAxisChart'));
const SunburstChart         = lazy(() => import('../charts/SunburstChart'));
const GanttChart            = lazy(() => import('../charts/GanttChart'));
const ProjectsTreemapChart  = lazy(() => import('../charts/ProjectsTreemapChart'));
const CalendarHeatmap       = lazy(() => import('../charts/CalendarHeatmap'));
const BarChart              = lazy(() => import('../charts/BarChart'));
const AchievementsTimeline  = lazy(() => import('../charts/AchievementsTimeline'));
const StackedBarChart       = lazy(() => import('../charts/StackedBarChart'));
const MultiRadarChart       = lazy(() => import('../charts/MultiRadarChart'));
const GaugeChart            = lazy(() => import('../charts/GaugeChart'));
const DonutChart            = lazy(() => import('../charts/DonutChart'));
const SkillBulletChart      = lazy(() => import('../charts/SkillBulletChart'));
const BubbleTimelineChart   = lazy(() => import('../charts/BubbleTimelineChart'));

import { CHART_COLORS, SOURCE_COLORS, SOURCE_KEYS } from '../../utils/constants';
import '../../styles/sections/AllChartsDashboard.css';

const SECTIONS = [
  { id: 'overview', Icon: BarChart3,          label: 'Portfolio Overview' },
  { id: 'career',   Icon: BriefcaseBusiness,  label: 'Career Journey'     },
  { id: 'skills',   Icon: Zap,                label: 'Skills & Coverage'  },
  { id: 'goals',    Icon: Target,             label: 'Goals & Roadmap'    },
];

/* ── Suspense fallback for chart panels ────────────────────── */
function ChartFallback({ label = 'Loading chart...' }) {
  return (
    <div className="allcharts-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{label}</p>
    </div>
  );
}

function AnimatedKpiCard({ label, value, color, Icon, suffix }) {
  return (
    <div className="allcharts-kpi-card" style={{ '--kpi-color': color }}>
      {Icon && <div className="allcharts-kpi-card__icon"><Icon size={18} /></div>}
      <div className="allcharts-kpi-card__num" style={{ color }}>{value}{suffix || ''}</div>
      <div className="allcharts-kpi-card__label">{label}</div>
    </div>
  );
}

function CollapsibleSection({ section, open, onToggle, children }) {
  return (
    <div className={`allcharts-section ${open ? 'allcharts-section--open' : ''}`}>
      <button
        className="allcharts-section__header"
        onClick={onToggle}
        aria-expanded={open}
      >
        <section.Icon className="allcharts-section__icon" size={18} />
        <span className="allcharts-section__label">{section.label}</span>
        <span className={`allcharts-section__chevron ${open ? 'allcharts-section__chevron--open' : ''}`}>
          ▼
        </span>
      </button>
      <div className={`allcharts-section__body ${open ? 'allcharts-section__body--open' : ''}`}>
        <div className="allcharts-section__content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AllChartsDashboard({
  analytics,
  portfolio,
  careerData,
  goalsData,
  skillsData,
  learningData,
  domainCoverage,
}) {
  const [openSections, setOpenSections] = useState(new Set());

  const toggleSection = (id) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const kpiBarData = useMemo(() => {
    if (!careerData?.stackFrequency?.series) return [];
    return careerData.stackFrequency.series.map(s => ({
      label: s.tech || s.label,
      value: s.total || 0,
      color: CHART_COLORS[0],
    }));
  }, [careerData]);

  const achievementsByYear = useMemo(() => {
    return careerData?.achievements?.by_year || [];
  }, [careerData]);

  const gaugeDonutData = useMemo(() => {
    if (!goalsData?.statusDonut?.series) return [];
    return goalsData.statusDonut.series.map(s => ({
      label: s.label || s.status,
      value: Number(s.count ?? s.value) || 0,
      color: s.color || CHART_COLORS[1],
    }));
  }, [goalsData]);

  const priorityDonutData = useMemo(() => {
    if (!goalsData?.priorityDonut?.series) return [];
    return goalsData.priorityDonut.series.map(s => ({
      label: s.label || s.priority,
      value: Number(s.count ?? s.value) || 0,
      color: s.color || CHART_COLORS[2],
    }));
  }, [goalsData]);

  const yearProgData = useMemo(() => {
    if (!goalsData?.yearProgress?.series) return [];
    return goalsData.yearProgress.series.map(s => ({
      label: String(s.year || s.label),
      value: Number(s.avg_progress ?? s.value) || 0,
      color: CHART_COLORS[3],
    }));
  }, [goalsData]);

  const sourcesData = useMemo(() => {
    if (!skillsData?.sources) return null;
    const src = skillsData.sources;
    const topSkills = (src.top_skills || []).slice(0, 8).map(item => {
      const flat = { skill: item.skill || item.skill_name };
      const srcObj = item.sources || item.source_counts || {};
      Object.keys(srcObj).forEach(key => { flat[key] = srcObj[key]; });
      return flat;
    });
    return {
      topSkills,
      sources: SOURCE_KEYS,
      colors: SOURCE_COLORS,
    };
  }, [skillsData]);

  const counts = analytics?.counts || {};
  const profSummary = analytics?.profile_summary || {};

  const empSeries = careerData?.employmentMix?.series || [];
  const ganttItems = careerData?.gantt?.items || [];
  const ganttMinYear = careerData?.gantt?.min_year;
  const ganttMaxYear = careerData?.gantt?.max_year;

  const coursesSeries = learningData?.coursesByYear?.series || [];

  return (
    <div className="allcharts-dashboard">
      <div className="allcharts-dashboard__title">
        <BarChart3 className="allcharts-dashboard__icon" size={20} />
        All Charts Dashboard
      </div>

      {SECTIONS.map(section => {
        const isOpen = openSections.has(section.id);
        return (
          <CollapsibleSection
            key={section.id}
            section={section}
            open={isOpen}
            onToggle={() => toggleSection(section.id)}
          >
            {/* ── Portfolio Overview ── */}
            {section.id === 'overview' && (
              <div className="allcharts-group">

                {/* KPI Row */}
                <div className="allcharts-kpi-row">
                  <AnimatedKpiCard label="Skills" value={counts.skills || 34} color="#378ADD" Icon={Code2} />
                  <AnimatedKpiCard label="Experience yrs" value={profSummary.experience_years ?? counts.experience_years ?? 5.2} color="#1D9E75" Icon={BriefcaseBusiness} />
                  <AnimatedKpiCard label="Goals completion" value={goalsData?.gauge?.overall_pct ?? 68} color="#BA7517" Icon={Target} />
                  <AnimatedKpiCard label="Courses done" value={counts.courses || 36} color="#7F77DD" Icon={BookOpen} />
                </div>

                {/* Sankey */}
                {portfolio?.skills_with_sources && portfolio?.goals && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Learning Flow</span>
                      <span className="allcharts-panel__sub">Sources → Skills → Goals</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading Sankey..." />}>
                      <SankeyChart
                        skillsWithSources={portfolio.skills_with_sources}
                        goals={portfolio.goals}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Stacked Area */}
                {portfolio?.learning_timeline && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Learning Timeline</span>
                      <span className="allcharts-panel__sub">Skills acquired per year by source</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading timeline..." />}>
                      <TimelineAreaChart timeline={portfolio.learning_timeline} />
                    </Suspense>
                  </div>
                )}

                {/* Dual Axis */}
                <div className="allcharts-panel">
                  <div className="allcharts-panel__header">
                    <span className="allcharts-panel__title">Experience vs Learning</span>
                    <span className="allcharts-panel__sub">Employment months + Courses per year</span>
                  </div>
                  <Suspense fallback={<ChartFallback label="Loading dual axis..." />}>
                    <DualAxisChart ganttItems={ganttItems} coursesSeries={coursesSeries} />
                  </Suspense>
                </div>

                {/* Sunburst */}
                {portfolio?.skills_by_type && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Skills Hierarchy</span>
                      <span className="allcharts-panel__sub">Category → Skill → Proficiency Band</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading sunburst..." />}>
                      <SunburstChart skillsByType={portfolio.skills_by_type} />
                    </Suspense>
                  </div>
                )}

              </div>
            )}

            {/* ── Career Journey ── */}
            {section.id === 'career' && (
              <div className="allcharts-group">

                {/* KPI Employment Mix */}
                {empSeries.length > 0 && (
                  <div className="allcharts-kpi-row">
                    {empSeries.map((s, i) => (
                      <AnimatedKpiCard
                        key={s.type || i}
                        label={s.type}
                        value={s.months || s.count || 0}
                        color={s.color || CHART_COLORS[i]}
                      />
                    ))}
                  </div>
                )}

                {/* Gantt */}
                {ganttItems.length > 0 && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Career Timeline</span>
                      <span className="allcharts-panel__sub">Education + Experience</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading Gantt..." />}>
                      <GanttChart items={ganttItems} minYear={ganttMinYear} maxYear={ganttMaxYear} />
                    </Suspense>
                  </div>
                )}

                {/* Treemap + Calendar Heatmap (2-col) */}
                <div className="allcharts-row-2col">
                  {careerData?.projectsTreemap && (
                    <div className="allcharts-panel">
                      <div className="allcharts-panel__header">
                        <span className="allcharts-panel__title">Projects by Type</span>
                      </div>
                      <Suspense fallback={<ChartFallback label="Loading treemap..." />}>
                        <ProjectsTreemapChart data={careerData.projectsTreemap} />
                      </Suspense>
                    </div>
                  )}
                  {careerData?.projectsHeatmap && (
                    <div className="allcharts-panel">
                      <div className="allcharts-panel__header">
                        <span className="allcharts-panel__title">Monthly Activity</span>
                      </div>
                      <Suspense fallback={<ChartFallback label="Loading heatmap..." />}>
                        <CalendarHeatmap
                          byMonth={careerData.projectsHeatmap.by_month}
                          minDate={careerData.projectsHeatmap.min_date}
                          maxDate={careerData.projectsHeatmap.max_date}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>

                {/* Tech Stack Bar */}
                {kpiBarData.length > 0 && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Tech Frequency</span>
                      <span className="allcharts-panel__sub">All technologies across projects & experience</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading bars..." />}>
                      <BarChart data={kpiBarData} size="sm" showValues />
                    </Suspense>
                  </div>
                )}

                {/* Achievements Timeline */}
                {achievementsByYear.length > 0 && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Achievements</span>
                      <span className="allcharts-panel__sub">Awards & recognitions</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading achievements..." />}>
                      <AchievementsTimeline byYear={achievementsByYear} />
                    </Suspense>
                  </div>
                )}

              </div>
            )}

            {/* ── Skills & Coverage ── */}
            {section.id === 'skills' && (
              <div className="allcharts-group">

                {/* Stacked Bar — Skills by Source */}
                {sourcesData && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Skills by Source</span>
                      <span className="allcharts-panel__sub">Top 8 skills — frequency per learning source</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading stacked bars..." />}>
                      <StackedBarChart
                        data={sourcesData.topSkills}
                        barKey="skill"
                        stackKeys={SOURCE_KEYS}
                        stackColors={SOURCE_COLORS}
                        showLegend
                      />
                    </Suspense>
                  </div>
                )}

                {/* Multi Radar — Domain Coverage */}
                {domainCoverage && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Domain Coverage</span>
                      <span className="allcharts-panel__sub">Combined vs each source</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading radar..." />}>
                      <MultiRadarChart data={domainCoverage} />
                    </Suspense>
                  </div>
                )}

              </div>
            )}

            {/* ── Goals & Roadmap ── */}
            {section.id === 'goals' && (
              <div className="allcharts-group">

                {/* KPI Row */}
                {goalsData?.gauge && (
                  <div className="allcharts-kpi-row">
                    <AnimatedKpiCard label="Overall progress" value={goalsData.gauge.overall_pct || 0} color="#1D9E75" />
                    <AnimatedKpiCard label="Achieved" value={goalsData.gauge.achieved_count || 0} color="#1D9E75" />
                    <AnimatedKpiCard label="In Progress" value={goalsData.gauge.in_progress_count || 0} color="#378ADD" />
                    <AnimatedKpiCard label="Total goals" value={goalsData.gauge.total || 0} />
                  </div>
                )}

                {/* Gauge + Status + Priority (3-col) */}
                <div className="allcharts-row-3col">
                  {goalsData?.gauge && (
                    <div className="allcharts-panel">
                      <div className="allcharts-panel__header">
                        <span className="allcharts-panel__title">Overall Progress</span>
                        <span className="allcharts-panel__sub">{goalsData.gauge.achieved_count}/{goalsData.gauge.total} achieved</span>
                      </div>
                      <Suspense fallback={<ChartFallback label="Loading gauge..." />}>
                        <GaugeChart
                          value={goalsData.gauge.overall_pct || 0}
                          maxValue={100}
                          label="Goals Complete"
                          subLabel={`${goalsData.gauge.achieved_count || 0} of ${goalsData.gauge.total || 0}`}
                        />
                      </Suspense>
                    </div>
                  )}
                  {gaugeDonutData.length > 0 && (
                    <div className="allcharts-panel">
                      <div className="allcharts-panel__header">
                        <span className="allcharts-panel__title">By Status</span>
                      </div>
                      <Suspense fallback={<ChartFallback label="Loading donut..." />}>
                        <DonutChart
                          data={gaugeDonutData}
                          size="sm"
                          showLegend
                          centerLabel="Goals"
                          title="Goals by status"
                        />
                      </Suspense>
                    </div>
                  )}
                  {priorityDonutData.length > 0 && (
                    <div className="allcharts-panel">
                      <div className="allcharts-panel__header">
                        <span className="allcharts-panel__title">By Priority</span>
                      </div>
                      <Suspense fallback={<ChartFallback label="Loading donut..." />}>
                        <DonutChart
                          data={priorityDonutData}
                          size="sm"
                          showLegend
                          centerLabel="Goals"
                          title="Goals by priority"
                        />
                      </Suspense>
                    </div>
                  )}
                </div>

                {/* Year Progress Bar */}
                {yearProgData.length > 0 && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Progress by Year</span>
                      <span className="allcharts-panel__sub">Average completion %</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading bars..." />}>
                      <BarChart data={yearProgData} size="sm" showValues />
                    </Suspense>
                  </div>
                )}

                {/* Skill Bullet Chart */}
                {goalsData?.skillGap?.goals && goalsData.skillGap.goals.length > 0 && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Skill Gap Analysis</span>
                      <span className="allcharts-panel__sub">Current vs Target — red line = target</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading bullet chart..." />}>
                      <SkillBulletChart goals={goalsData.skillGap.goals} />
                    </Suspense>
                  </div>
                )}

                {/* Bubble Roadmap */}
                {goalsData?.roadmap?.goals && goalsData.roadmap.goals.length > 0 && (
                  <div className="allcharts-panel">
                    <div className="allcharts-panel__header">
                      <span className="allcharts-panel__title">Goals Roadmap</span>
                      <span className="allcharts-panel__sub">{goalsData.roadmap.count || goalsData.roadmap.goals.length} goals</span>
                    </div>
                    <Suspense fallback={<ChartFallback label="Loading roadmap..." />}>
                      <BubbleTimelineChart
                        goals={goalsData.roadmap.goals}
                        minYear={goalsData.roadmap.min_year}
                        maxYear={goalsData.roadmap.max_year}
                      />
                    </Suspense>
                  </div>
                )}

              </div>
            )}

          </CollapsibleSection>
        );
      })}
    </div>
  );
}
