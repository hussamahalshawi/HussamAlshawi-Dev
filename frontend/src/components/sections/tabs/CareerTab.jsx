import { useMemo } from 'react';
import { useCharts } from '../../../hooks/useCharts';
import DonutChart from '../../charts/DonutChart';
import BarChart from '../../charts/BarChart';
import GanttChart from '../../charts/GanttChart';
import CalendarHeatmap from '../../charts/CalendarHeatmap';
import ProjectsTreemapChart from '../../charts/ProjectsTreemapChart';
import AchievementsTimeline from '../../charts/AchievementsTimeline';
import { CHART_COLORS } from '../../../utils/constants';

export default function CareerTab() {

  const { data, sectionRef } = useCharts('career');

  const employData = useMemo(() => {
    if (!data?.employmentMix?.series) return [];
    return data.employmentMix.series.map(s => ({
      label: s.type,
      value: s.months,
      color: s.color,
    }));
  }, [data]);

  const stackData = useMemo(() => {
    if (!data?.stackFrequency?.series) return [];
    return data.stackFrequency.series.map(s => ({
      label: s.tech,
      value: s.total,
      color: CHART_COLORS[data.stackFrequency.labels.indexOf(s.tech) % CHART_COLORS.length],
    }));
  }, [data]);

  const achieveByYear = useMemo(() => {
    return data?.achievements?.by_year || [];
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {/* ROW 1: Employment Mix + Tech Stack */}
      <div className="analytics-tab-row-2col">
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Employment Mix
            </p>
            <span className="portfolio-chart-sub">
              By months
            </span>
          </div>
          <div className="career-chart-fill">
            {employData.length > 0 ? (
              <DonutChart
                data={employData}
                size="md"
                showLegend
                centerLabel="Months"
                title="Employment mix by duration"
              />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No employment data</p>
              </div>
            )}
          </div>
        </div>
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Tech Stack
            </p>
            <span className="portfolio-chart-sub">
              Hands-on frequency
            </span>
          </div>
          <div className="career-chart-fill career-chart-fill--scroll">
            {stackData.length > 0 ? (
              <BarChart
                data={stackData}
                size="xs"
                showValues
                emptyMessage="No stack data available"
              />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No stack data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Career Gantt */}
      <div className="analytics-glass-panel career-gantt-panel">
        <div className="analytics-panel__header">
          <p className="skill-group__title" style={{ margin: 0 }}>
            Career Timeline
          </p>
          <span className="portfolio-chart-sub">
            {data?.gantt?.count || 0} entries
          </span>
        </div>
        <div className="career-gantt-fill">
          <GanttChart
            items={data?.gantt?.items || []}
            minYear={data?.gantt?.min_year}
            maxYear={data?.gantt?.max_year}
          />
        </div>
      </div>

      {/* ROW 3: Projects Treemap + Achievements */}
      <div className="analytics-tab-row-2col">
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Projects by Category
            </p>
            <span className="portfolio-chart-sub">
              {data?.projectsTreemap?.total || 0} total
            </span>
          </div>
          <ProjectsTreemapChart projectsTreemap={data?.projectsTreemap} />
        </div>
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Achievements
            </p>
            <span className="portfolio-chart-sub">
              {achieveByYear.length} years
            </span>
          </div>
          <div className="career-chart-fill">
            {achieveByYear.length > 0 ? (
              <AchievementsTimeline byYear={achieveByYear} />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No achievements data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4: Projects Calendar Heatmap */}
      <div className="analytics-glass-panel career-heatmap-panel">
        <div className="analytics-panel__header">
          <p className="skill-group__title" style={{ margin: 0 }}>
            Project Activity
          </p>
          <span className="portfolio-chart-sub">
            Monthly density
          </span>
        </div>
        <div className="career-heatmap-fill">
          <CalendarHeatmap
            byMonth={data?.projectsHeatmap?.by_month || []}
            minDate={data?.projectsHeatmap?.min_date}
            maxDate={data?.projectsHeatmap?.max_date}
          />
        </div>
      </div>
    </div>
  );
}
