import { useMemo } from 'react';
import { useCharts } from '../../../hooks/useCharts';
import chartsService from '../../../services/chartsService';
import DonutChart from '../../charts/DonutChart';
import BarChart from '../../charts/BarChart';
import HeatmapChart from '../../charts/HeatmapChart';
import StackedBarChart from '../../charts/StackedBarChart';
import MultiRadarChart from '../../charts/MultiRadarChart';
import { CHART_COLORS, SOURCE_COLORS } from '../../../utils/constants';
import { useState, useEffect } from 'react';

export default function SkillsTab() {

  const { data, sectionRef } = useCharts('skills');

  const [domainCoverage, setDomainCoverage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    chartsService.skills.domainCoverage().then(res => {
      if (!cancelled) setDomainCoverage(res);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const sourcesData = useMemo(() => {
    if (!data?.sources) return null;
    const src = data.sources;
    const topSkills = (src.top_skills || []).slice(0, 8).map(item => {
      const flat = { skill: item.skill || item.skill_name };
      const srcObj = item.sources || item.source_counts || {};
      Object.keys(srcObj).forEach(key => { flat[key] = srcObj[key]; });
      return flat;
    });
    return {
      topSkills,
      sources: src.sources || [],
      colors: src.colors || SOURCE_COLORS,
    };
  }, [data]);

  return (
    <div className="career-tab" ref={sectionRef}>
      {/* ROW 1: Skills Heatmap */}
      <div className="analytics-glass-panel career-gantt-panel">
        <div className="analytics-panel__header">
          <p className="skill-group__title" style={{ margin: 0 }}>
            Skills Heatmap
          </p>
          <span className="portfolio-chart-sub">
            Category x Proficiency Band
          </span>
        </div>
        <div className="career-gantt-fill">
          {data?.heatmap ? (
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
              {data?.distribution?.total || 0} skills
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
      {sourcesData && (
        <div className="analytics-glass-panel career-gantt-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Skills by Source
            </p>
            <span className="portfolio-chart-sub">
              Top 8 — frequency per learning source
            </span>
          </div>
          <div className="career-gantt-fill">
            <StackedBarChart
              data={sourcesData.topSkills}
              barKey="skill"
              stackKeys={sourcesData.sources}
              stackColors={sourcesData.colors}
              showLegend
            />
          </div>
        </div>
      )}

      {/* ROW 4: Domain Coverage Radar */}
      {domainCoverage && (
        <div className="analytics-glass-panel career-gantt-panel">
          <div className="analytics-panel__header">
            <p className="skill-group__title" style={{ margin: 0 }}>
              Domain Coverage
            </p>
            <span className="portfolio-chart-sub">
              Combined vs each source
            </span>
          </div>
          <div className="career-gantt-fill">
            <MultiRadarChart data={domainCoverage} />
          </div>
        </div>
      )}
    </div>
  );
}
