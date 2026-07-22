import { useMemo } from 'react';
import { useCharts } from '../../../hooks/useCharts';
import BarChart from '../../charts/BarChart';
import DonutChart from '../../charts/DonutChart';
import StackedBarChart from '../../charts/StackedBarChart';
import WordCloudChart from '../../charts/WordCloudChart';
import { CHART_COLORS, SOURCE_COLORS } from '../../../utils/constants';

export default function LearningTab() {

  const { data, sectionRef } = useCharts('learning');

  const yearlyData = useMemo(() => {
    if (!data?.coursesByYear?.series) return [];
    return data.coursesByYear.series.map(s => ({
      label: s.year,
      value: s.count,
      color: CHART_COLORS[data.coursesByYear.labels.indexOf(s.year) % CHART_COLORS.length],
    }));
  }, [data]);

  const providersData = useMemo(() => {
    if (!data?.providers) return null;
    const prov = data.providers;
    const topSkills = (prov.top_providers || []).slice(0, 8).map(item => {
      const flat = { skill: item.provider || item.skill_name || item.skill };
      const srcObj = item.skill_counts || item.skill_count || item.sources || {};
      Object.keys(srcObj).forEach(key => { flat[key] = srcObj[key]; });
      return flat;
    });
    return {
      topSkills,
      stackKeys: prov.stack_keys || [],
      colors: prov.colors || SOURCE_COLORS,
    };
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {/* ROW 1: Courses + Study Types */}
      <div className="analytics-tab-row-2col">
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Courses by Year
            </p>
            <span className="portfolio-chart-sub">
              {data?.coursesByYear?.total || 0} total
            </span>
          </div>
          <div className="career-chart-fill">
            {yearlyData.length > 0 ? (
              <BarChart
                data={yearlyData}
                size="md"
                showValues
                emptyMessage="No courses by year"
              />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
        <div className="analytics-glass-panel career-chart-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Study Types
            </p>
            <span className="portfolio-chart-sub">
              Book / Course / Workshop / Other
            </span>
          </div>
          <div className="career-chart-fill">
            {data?.studyTypes?.labels ? (
              <DonutChart
                data={data.studyTypes.labels.map((label, i) => ({
                  label,
                  value: data.studyTypes.values[i] || 0,
                  color: data.studyTypes.colors?.[i] || CHART_COLORS[i % CHART_COLORS.length],
                }))}
                size="md"
                showLegend
                centerLabel="Types"
                title="Self-study type distribution"
              />
            ) : (
              <div className="portfolio-chart-empty">
                <p>No study type data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Self-study Tracks */}
      {data?.studyTracks?.labels && (
        <div className="analytics-glass-panel career-gantt-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Self-Study Tracks
            </p>
            <span className="portfolio-chart-sub">
              {data.studyTracks.total || 0} items across {data.studyTracks.labels.length} tracks
            </span>
          </div>
          <div className="career-gantt-fill">
            <DonutChart
              data={data.studyTracks.labels.map((label, i) => ({
                label,
                value: data.studyTracks.values[i] || 0,
                color: data.studyTracks.colors?.[i] || CHART_COLORS[i % CHART_COLORS.length],
              }))}
              size="lg"
              showLegend
              centerLabel="Tracks"
              title="Self-study type by learning track"
            />
          </div>
        </div>
      )}

      {/* ROW 3: Providers Stacked + Word Cloud */}
      <div className="analytics-tab-row-2col">
        {providersData && (
          <div className="analytics-glass-panel career-chart-panel">
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Learning Providers
              </p>
              <span className="portfolio-chart-sub">
                Top providers — frequency per source
              </span>
            </div>
            <div className="career-gantt-fill">
              <StackedBarChart
                data={providersData.topSkills}
                barKey="skill"
                stackKeys={providersData.stackKeys}
                stackColors={providersData.colors}
                showLegend
              />
            </div>
          </div>
        )}
        {data?.wordCloud?.words && (
          <div className="analytics-glass-panel career-chart-panel">
            <div className="analytics-panel__header">
              <p className="skill-group__title" style={{ margin: 0 }}>
                Skills Word Cloud
              </p>
              <span className="portfolio-chart-sub">
                {data.wordCloud.total || data.wordCloud.words.length} skills
              </span>
            </div>
            <div className="career-chart-fill">
              <WordCloudChart words={data.wordCloud.words} size="md" />
            </div>
          </div>
        )}
      </div>

      {/* ROW 4: Learning vs Output */}
      {data?.learningVsOutput?.labels && (
        <div className="analytics-glass-panel career-gantt-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Learning vs Output
            </p>
            <span className="portfolio-chart-sub">
              {data.learningVsOutput.total_entries || 0} entries
            </span>
          </div>
          <div className="career-gantt-fill">
            <StackedBarChart
              data={data.learningVsOutput.labels.map((label, i) => ({
                skill: label,
                learning: data.learningVsOutput.learning[i] || 0,
                output: data.learningVsOutput.output[i] || 0,
              }))}
              barKey="skill"
              stackKeys={['learning', 'output']}
              stackColors={[
                data.learningVsOutput.colors?.learning || CHART_COLORS[0],
                data.learningVsOutput.colors?.output || CHART_COLORS[1]
              ]}
              showLegend
            />
          </div>
        </div>
      )}
    </div>
  );
}
