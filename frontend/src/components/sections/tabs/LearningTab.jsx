import { useMemo } from 'react';
import useCharts from '../../../hooks/useCharts';
import DonutChart from '../../charts/DonutChart';
import BarChart from '../../charts/BarChart';
import WordCloudChart from '../../charts/WordCloudChart';
import { CHART_COLORS } from '../../../utils/constants';

export default function LearningTab() {
  const { data, loading, error, sectionRef } = useCharts('learning');

  const providerData = useMemo(() => {
    if (!data?.providers?.series) return [];
    return data.providers.series.map(s => ({
      label: s.provider || s.label,
      value: s.count || s.value,
      color: CHART_COLORS[data.providers.labels.indexOf(s.provider) % CHART_COLORS.length],
    }));
  }, [data]);

  const studyTypeData = useMemo(() => {
    if (!data?.selfStudyTypes?.series) return [];
    return data.selfStudyTypes.series.map(s => ({
      label: s.label || s.type,
      value: s.count || s.value,
      color: s.color || CHART_COLORS[0],
    }));
  }, [data]);

  const trackData = useMemo(() => {
    if (!data?.tracks?.series) return [];
    return data.tracks.series.map(s => ({
      label: s.track || s.label || s.category,
      value: s.count || s.value,
      color: CHART_COLORS[data.tracks.labels.indexOf(s.track) % CHART_COLORS.length],
    }));
  }, [data]);

  const vsData = useMemo(() => {
    if (!data?.vsOutput?.series) return [];
    return data.vsOutput.series;
  }, [data]);

  const vsBarData = useMemo(() => {
    if (!data?.vsOutput?.categories) return [];
    return data.vsOutput.categories.map((cat, i) => ({
      label: cat,
      value: data.vsOutput.learning_counts?.[i] || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {loading && (
        <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading learning data...</p>
        </div>
      )}

      {error && (
        <div className="analytics-glass-panel" style={{ padding: 'var(--s6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {/* ROW 1: Courses + Providers */}
          <div className="analytics-tab-row-2col">
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Courses by Year
                </p>
                <span className="portfolio-chart-sub">
                  Completions over time
                </span>
              </div>
              <div className="career-chart-fill">
                {data.coursesByYear?.series && data.coursesByYear.series.length > 0 ? (
                  <BarChart
                    data={data.coursesByYear.series.map(s => ({
                      label: s.year || s.label,
                      value: s.count || s.value,
                      color: CHART_COLORS[0],
                    }))}
                    size="sm"
                    showValues
                    emptyMessage="No course data"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No course data available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Top Providers
                </p>
                <span className="portfolio-chart-sub">
                  Course sources
                </span>
              </div>
              <div className="career-chart-fill career-chart-fill--scroll">
                {providerData.length > 0 ? (
                  <BarChart
                    data={providerData}
                    size="xs"
                    showValues
                    emptyMessage="No provider data"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No provider data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Word Cloud + Study Types */}
          <div className="analytics-tab-row-2col">
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Skills Word Cloud
                </p>
                <span className="portfolio-chart-sub">
                  Across learning sources
                </span>
              </div>
              <div className="career-chart-fill">
                {data.wordCloud?.words && data.wordCloud.words.length > 0 ? (
                  <WordCloudChart
                    words={data.wordCloud.words}
                    maxCount={data.wordCloud.max_count}
                    totalUnique={data.wordCloud.total_unique}
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No word cloud data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Self-Study Types
                </p>
                <span className="portfolio-chart-sub">
                  {data.selfStudyTypes?.total || 0} entries
                </span>
              </div>
              <div className="career-chart-fill">
                {studyTypeData.length > 0 ? (
                  <DonutChart
                    data={studyTypeData}
                    size="sm"
                    showLegend
                    centerLabel="Entries"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No study type data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 3: Tracks + Learning vs Output */}
          <div className="analytics-tab-row-2col">
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Self-Study Tracks
                </p>
                <span className="portfolio-chart-sub">
                  By category
                </span>
              </div>
              <div className="career-chart-fill career-chart-fill--scroll">
                {trackData.length > 0 ? (
                  <BarChart
                    data={trackData}
                    size="xs"
                    showValues
                    emptyMessage="No track data"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No track data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="analytics-glass-panel career-chart-panel">
              <div className="analytics-panel__header">
                <p className="skill-group__title" style={{ margin: 0 }}>
                  Learning vs Output
                </p>
                <span className="portfolio-chart-sub">
                  Input per category
                </span>
              </div>
              <div className="career-chart-fill career-chart-fill--scroll">
                {vsBarData.length > 0 ? (
                  <BarChart
                    data={vsBarData}
                    size="xs"
                    showValues
                    emptyMessage="No comparison data"
                  />
                ) : (
                  <div className="portfolio-chart-empty">
                    <p>No comparison data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
