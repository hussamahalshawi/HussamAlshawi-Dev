import { useMemo } from 'react';
import useCharts from '../../../hooks/useCharts';
import DonutChart from '../../charts/DonutChart';
import BarChart from '../../charts/BarChart';
import GaugeChart from '../../charts/GaugeChart';
import BubbleTimelineChart from '../../charts/BubbleTimelineChart';
import { CHART_COLORS } from '../../../utils/constants';

export default function GoalsTab() {
  const { data, loading, error, sectionRef } = useCharts('goals');

  const statusData = useMemo(() => {
    if (!data?.statusDonut?.series) return [];
    return data.statusDonut.series.map(s => ({
      label: s.label || s.status,
      value: s.count || s.value,
      color: s.color || CHART_COLORS[0],
    }));
  }, [data]);

  const priorityData = useMemo(() => {
    if (!data?.priorityDonut?.series) return [];
    return data.priorityDonut.series.map(s => ({
      label: s.label || s.priority,
      value: s.count || s.value,
      color: s.color || CHART_COLORS[1],
    }));
  }, [data]);

  const yearData = useMemo(() => {
    if (!data?.yearProgress?.series) return [];
    return data.yearProgress.series.map(s => ({
      label: String(s.year || s.label),
      value: s.avg_progress || s.value || 0,
      color: CHART_COLORS[data.yearProgress.years.indexOf(s.year) % CHART_COLORS.length],
    }));
  }, [data]);

  const skillGaps = useMemo(() => {
    if (!data?.skillGap?.goals) return [];
    return data.skillGap.goals;
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {loading && (
        <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading goals data...</p>
        </div>
      )}

      {error && (
        <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {/* ROW 1: Gauge + Status Donut + Priority Donut */}
          <div className="analytics-tab-row-3col">
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Overall Progress
                </p>
                <span className="portfolio-chart-sub">
                  {data.gauge?.achieved_count || 0}/{data.gauge?.total || 0} achieved
                </span>
              </div>
              <div className="career-chart-fill" style={{ display: 'flex', justifyContent: 'center' }}>
                {data.gauge ? (
                  <GaugeChart
                    value={data.gauge.overall_pct || 0}
                    maxValue={100}
                    label="Goals Complete"
                    subLabel={`${data.gauge.achieved_count || 0} of ${data.gauge.total || 0}`}
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No gauge data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  By Status
                </p>
                <span className="portfolio-chart-sub">
                  {data.statusDonut?.total || 0} goals
                </span>
              </div>
              <div className="career-chart-fill">
                {statusData.length > 0 ? (
                  <DonutChart
                    data={statusData}
                    size="sm"
                    showLegend
                    centerLabel="Goals"
                    title="Goals by status"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No status data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  By Priority
                </p>
                <span className="portfolio-chart-sub">
                  {data.priorityDonut?.total || 0} goals
                </span>
              </div>
              <div className="career-chart-fill">
                {priorityData.length > 0 ? (
                  <DonutChart
                    data={priorityData}
                    size="sm"
                    showLegend
                    centerLabel="Goals"
                    title="Goals by priority"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No priority data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Year Progress + Skill Gap */}
          <div className="analytics-tab-row-2col">
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Progress by Year
                </p>
                <span className="portfolio-chart-sub">
                  Average completion %
                </span>
              </div>
              <div className="career-chart-fill">
                {yearData.length > 0 ? (
                  <BarChart
                    data={yearData}
                    size="sm"
                    showValues
                    emptyMessage="No year progress data"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No year progress data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Skill Gap Analysis
                </p>
                <span className="portfolio-chart-sub">
                  {data.skillGap?.count || 0} goals analyzed
                </span>
              </div>
              <div className="career-chart-fill career-chart-fill--scroll">
                {skillGaps.length > 0 ? (
                  skillGaps.slice(0, 8).map((goal, i) => (
                    <div key={goal.goal_name || i} className="cat-avg-row" style={{ marginBottom: 'var(--s2)' }}>
                      <span className="cat-avg-row__name" style={{ fontSize: '0.75rem' }}>
                        {goal.goal_name}
                      </span>
                      <span className="cat-avg-row__score" style={{
                        color: goal.current_score >= goal.target_score * 0.8 ? '#4ECCA3' : goal.current_score >= goal.target_score * 0.5 ? '#4FC3F7' : '#F5A623',
                        fontSize: '0.75rem',
                      }}>
                        {goal.current_score}/{goal.target_score}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No skill gap data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 3: Roadmap Timeline */}
          <div className="analytics-glass-panel career-gantt-panel">
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Goals Roadmap
              </p>
              <span className="portfolio-chart-sub">
                {data.roadmap?.count || 0} goals
              </span>
            </div>
            <div className="career-gantt-fill">
              {data.roadmap?.goals && data.roadmap.goals.length > 0 ? (
                <BubbleTimelineChart
                  goals={data.roadmap.goals}
                  minYear={data.roadmap.min_year}
                  maxYear={data.roadmap.max_year}
                />
              ) : (
                <div className="portfolio-chart-empty">
                  <p>No roadmap data</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
