import { useMemo } from 'react';
import useCharts from '../../../hooks/useCharts';
import DonutChart from '../../charts/DonutChart';
import BarChart from '../../charts/BarChart';
import HeatmapChart from '../../charts/HeatmapChart';
import WordCloudChart from '../../charts/WordCloudChart';
import StackedBarChart from '../../charts/StackedBarChart';
import { CHART_COLORS } from '../../../utils/constants';

export default function SkillsTab() {
  const { data, loading, error, sectionRef } = useCharts('skills');

  const distData = useMemo(() => {
    if (!data?.distribution?.series) return [];
    return data.distribution.series.map(s => ({
      label: s.label,
      value: s.count,
      color: s.color,
    }));
  }, [data]);

  const topBarData = useMemo(() => {
    if (!data?.topBars?.series) return [];
    return data.topBars.series.map(s => ({
      label: s.skill || s.label,
      value: s.score || s.value,
      color: s.color || CHART_COLORS[0],
    }));
  }, [data]);

  const sourceColors = useMemo(() => {
    if (!data?.sources?.colors) return {};
    return data.sources.colors;
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {loading && (
        <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading skills data...</p>
        </div>
      )}

      {error && (
        <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {/* ROW 1: Skills Heatmap */}
          <div className="analytics-glass-panel career-gantt-panel">
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Skills Heatmap
              </p>
              <span className="portfolio-chart-sub">
                Category × Proficiency Band
              </span>
            </div>
            <div className="career-gantt-fill">
              {data.heatmap ? (
                <HeatmapChart
                  categories={data.heatmap.categories}
                  bands={data.heatmap.bands}
                  matrix={data.heatmap.matrix}
                  bandRanges={data.heatmap.band_ranges}
                />
              ) : (
                <div className="portfolio-chart-empty">
                  <p>No heatmap data</p>
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Distribution + Top Skills */}
          <div className="analytics-tab-row-2col">
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Proficiency Distribution
                </p>
                <span className="portfolio-chart-sub">
                  {data.distribution?.total || 0} skills
                </span>
              </div>
              <div className="career-chart-fill">
                {distData.length > 0 ? (
                  <DonutChart
                    data={distData}
                    size="md"
                    showLegend
                    centerLabel="Skills"
                    title="Score distribution by band"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No distribution data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Top Skills
                </p>
                <span className="portfolio-chart-sub">
                  By score
                </span>
              </div>
              <div className="career-chart-fill career-chart-fill--scroll">
                {topBarData.length > 0 ? (
                  <BarChart
                    data={topBarData}
                    size="xs"
                    showValues
                    emptyMessage="No skills data available"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No skills data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 3: Skill Sources */}
          {data.sources && (
            <div className="analytics-glass-panel career-gantt-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Skill Sources
                </p>
                <span className="portfolio-chart-sub">
                  Skills acquired per source
                </span>
              </div>
              <div className="career-gantt-fill">
                <StackedBarChart
                  data={data.sources.top_skills || []}
                  barKey="skill"
                  stackKeys={data.sources.sources || []}
                  stackColors={sourceColors}
                  showLegend
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
