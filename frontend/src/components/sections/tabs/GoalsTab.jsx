import { useMemo } from 'react';
import { useCharts } from '../../../hooks/useCharts';
import DonutChart from '../../charts/DonutChart';
import SkillBulletChart from '../../charts/SkillBulletChart';
import { CHART_COLORS } from '../../../utils/constants';

export default function GoalsTab() {

  const { data, sectionRef } = useCharts('goals');

  const statusData = useMemo(() => {
    if (!data?.statusDonut?.series) return [];
    return data.statusDonut.series.map(s => ({
      label: s.status,
      value: s.count,
      color: s.color,
    }));
  }, [data]);

  const priorityData = useMemo(() => {
    if (!data?.priorityDonut?.series) return [];
    return data.priorityDonut.series.map(s => ({
      label: s.priority,
      value: s.count,
      color: s.color,
    }));
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {/* ROW 1: Gauge + Status */}
      <div className="analytics-tab-row-2col">
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Goals Progress
            </p>
            <span className="portfolio-chart-sub">
              Average completion
            </span>
          </div>
          <div className="career-chart-fill">
            <div className="portfolio-chart-gauge-wrap">
              <div
                className="portfolio-chart-gauge-ring"
                style={{ '--progress-pct': `${data?.gauge?.avg_progress ?? 0}%` }}
              >
                <span className="portfolio-chart-gauge-pct">
                  {Math.round(data?.gauge?.avg_progress ?? 0)}%
                </span>
              </div>
              <p className="portfolio-chart-gauge-label">
                Average Progress
              </p>
            </div>
          </div>
        </div>
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Status Distribution
            </p>
            <span className="portfolio-chart-sub">
              {data?.statusDonut?.total || 0} goals
            </span>
          </div>
          <div className="career-chart-fill">
            {statusData.length > 0 ? (
              <DonutChart
                data={statusData}
                size="md"
                showLegend
                centerLabel="Goals"
                title="Status distribution across all goals"
              />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No status data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Priority + Year Progress */}
      <div className="analytics-tab-row-2col">
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Priority Breakdown
            </p>
            <span className="portfolio-chart-sub">
              Low → Critical
            </span>
          </div>
          <div className="career-chart-fill">
            {priorityData.length > 0 ? (
              <DonutChart
                data={priorityData}
                size="md"
                showLegend
                centerLabel="Priority"
                title="Priority distribution across goals"
              />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No priority data</p>
              </div>
            )}
          </div>
        </div>
        {data?.yearProgress?.labels && (
          <div className="analytics-glass-panel career-chart-panel">
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Year Progress
              </p>
              <span className="portfolio-chart-sub">
                {data.yearProgress.total || 0} goals
              </span>
            </div>
            <div className="career-chart-fill career-chart-fill--scroll">
              <div className="year-progress-bars">
                {data.yearProgress.labels.map((year, i) => (
                  <div key={year} className="year-bar-row">
                    <span className="year-bar-row__name">{year}</span>
                    <div className="year-bar-row__track">
                      <div
                        className="year-bar-row__fill"
                        style={{
                          width: `${data.yearProgress.values[i] || 0}%`,
                          background: data.yearProgress.colors?.[i] || CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="year-bar-row__count">{data.yearProgress.values[i] || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ROW 3: Goals Skill Gap */}
      {data?.skillGap && (
        <div className="analytics-glass-panel career-gantt-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Goals — Skill Gap Analysis
            </p>
            <span className="portfolio-chart-sub">
              Required vs current score
            </span>
          </div>
          <div className="career-gantt-fill">
            <SkillBulletChart goalSkillGap={data.skillGap} />
          </div>
        </div>
      )}
    </div>
  );
}
