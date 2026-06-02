/**
 * chartsService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized service for ALL chart API calls.
 * Uses apiClientBackground (no timeout) — chart queries can be heavy.
 *
 * Usage:
 *   import chartsService from '@/services/chartsService';
 *   const data = await chartsService.skills.radar();
 *   const top  = await chartsService.skills.topBars({ limit: 15 });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { apiClientBackground }    from './api';            // No-timeout instance for heavy queries
import { ENDPOINTS, QUERY_DEFAULTS } from '../utils/constants'; // Central endpoint registry


// ─────────────────────────────────────────────────────────────────────────────
// SKILLS CHARTS
// ─────────────────────────────────────────────────────────────────────────────
const skills = {

  /**
   * Radar chart — average score per skill category.
   * @returns {Promise<{labels, scores, counts, colors, series}>}
   */
  radar: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_SKILLS_RADAR),

  /**
   * Score distribution donut — skills per proficiency band.
   * @returns {Promise<{labels, counts, colors, total, series}>}
   */
  distribution: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_SKILLS_DISTRIBUTION),

  /**
   * Top N skills horizontal bar chart.
   * @param {object} params - Optional { limit: number }
   * @returns {Promise<{labels, scores, colors, icons, series}>}
   */
  topBars: (params = {}) =>
    apiClientBackground.get(ENDPOINTS.CHARTS_SKILLS_TOP_BARS, {
      params: { limit: QUERY_DEFAULTS.SKILLS_LIMIT, ...params },
    }),

  /**
   * Skills heatmap grid — category × score band matrix.
   * @returns {Promise<{categories, bands, matrix, band_ranges}>}
   */
  heatmap: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_SKILLS_HEATMAP),

  /**
   * Skill sources stacked bar — frequency per source model.
   * @returns {Promise<{sources, counts, colors, top_skills}>}
   */
  sources: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_SKILLS_SOURCES),

  /**
   * Domain coverage — multi-series radar with per-source scores.
   * @returns {Promise<{labels, series}>}
   */
  domainCoverage: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_SKILLS_DOMAIN_COVERAGE),
};


// ─────────────────────────────────────────────────────────────────────────────
// CAREER CHARTS
// ─────────────────────────────────────────────────────────────────────────────
const career = {

  /**
   * Gantt timeline — merged Education + Experience.
   * @returns {Promise<{min_year, max_year, count, items}>}
   */
  gantt: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_CAREER_GANTT),

  /**
   * Employment mix donut — types by count and months.
   * @returns {Promise<{labels, counts, months, colors, series}>}
   */
  employmentMix: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_CAREER_EMPLOYMENT),

  /**
   * Projects treemap — count per category and type.
   * @returns {Promise<{total, by_category, by_type}>}
   */
  projectsTreemap: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_CAREER_TREEMAP),

  /**
   * Projects activity calendar heatmap — activity by month.
   * @returns {Promise<{min_date, max_date, by_month, by_year}>}
   */
  projectsHeatmap: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_CAREER_PROJ_HEATMAP),

  /**
   * Tech stack frequency bar — hands-on tech from Experience + Projects.
   * @param {object} params - Optional { limit: number }
   * @returns {Promise<{labels, counts, exp_counts, proj_counts, series}>}
   */
  stackFrequency: (params = {}) =>
    apiClientBackground.get(ENDPOINTS.CHARTS_CAREER_STACK_FREQ, {
      params: { limit: QUERY_DEFAULTS.STACK_LIMIT, ...params },
    }),

  /**
   * Achievements timeline — achievements grouped by year.
   * @returns {Promise<{total, by_year}>}
   */
  achievementsTimeline: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_CAREER_ACHIEVEMENTS),
};


// ─────────────────────────────────────────────────────────────────────────────
// LEARNING CHARTS
// ─────────────────────────────────────────────────────────────────────────────
const learning = {

  /**
   * Courses by year area chart.
   * @param {object} params - Optional { granularity: 'year'|'month' }
   * @returns {Promise<{granularity, labels, counts, series}>}
   */
  coursesByYear: (params = {}) =>
    apiClientBackground.get(ENDPOINTS.CHARTS_LEARNING_COURSES_YEAR, {
      params: { granularity: QUERY_DEFAULTS.COURSES_GRANULARITY, ...params },
    }),

  /**
   * Top course providers horizontal bar.
   * @param {object} params - Optional { limit: number }
   * @returns {Promise<{labels, counts, series}>}
   */
  providers: (params = {}) =>
    apiClientBackground.get(ENDPOINTS.CHARTS_LEARNING_PROVIDERS, {
      params: { limit: QUERY_DEFAULTS.PROVIDERS_LIMIT, ...params },
    }),

  /**
   * Skills word cloud — frequency across learning sources.
   * @param {object} params - Optional { limit: number, source: 'all'|'courses'|'self_study'|'education' }
   * @returns {Promise<{words, max_count, total_unique}>}
   */
  wordCloud: (params = {}) =>
    apiClientBackground.get(ENDPOINTS.CHARTS_LEARNING_WORD_CLOUD, {
      params: {
        limit : QUERY_DEFAULTS.WORD_CLOUD_LIMIT,
        source: QUERY_DEFAULTS.WORD_CLOUD_SOURCE,
        ...params,
      },
    }),

  /**
   * Self-study types donut — count per learning_type.
   * @returns {Promise<{labels, counts, colors, total, series}>}
   */
  selfStudyTypes: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_LEARNING_STUDY_TYPES),

  /**
   * Self-study tracks vertical bar — count per Category.
   * @returns {Promise<{labels, counts, series}>}
   */
  selfStudyTracks: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_LEARNING_TRACKS),

  /**
   * Learning vs output grouped bar — learning vs projects per Category.
   * @returns {Promise<{categories, learning_counts, project_counts, ratios, series}>}
   */
  learningVsOutput: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_LEARNING_VS_OUTPUT),
};


// ─────────────────────────────────────────────────────────────────────────────
// GOALS CHARTS
// ─────────────────────────────────────────────────────────────────────────────
const goals = {

  /**
   * Overall goals gauge — portfolio-level completion %.
   * @returns {Promise<{overall_pct, achieved_count, in_progress_count, total, ...}>}
   */
  gauge: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_GOALS_GAUGE),

  /**
   * Goals status donut — count per status.
   * @returns {Promise<{labels, counts, colors, total, series}>}
   */
  statusDonut: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_GOALS_STATUS),

  /**
   * Goals priority donut — count per priority.
   * @returns {Promise<{labels, counts, colors, total, series}>}
   */
  priorityDonut: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_GOALS_PRIORITY),

  /**
   * Goals by year grouped bar — count + avg progress per year.
   * @returns {Promise<{years, counts, avg_progress, series}>}
   */
  yearProgress: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_GOALS_YEAR),

  /**
   * Skill gap analysis — per-goal current vs required scores.
   * @returns {Promise<{count, goals}>}  — each goal has skill_gaps[]
   */
  skillGap: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_GOALS_SKILL_GAP),

  /**
   * Roadmap timeline — all goals on a year axis.
   * @returns {Promise<{min_year, max_year, count, goals}>}
   */
  roadmapTimeline: () =>
    apiClientBackground.get(ENDPOINTS.CHARTS_GOALS_ROADMAP),
};


// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE LOADERS — load multiple charts at once for a full section
// ─────────────────────────────────────────────────────────────────────────────
const composite = {

  /**
   * Load all skills chart data in parallel.
   * Returns a settled object — partial failure won't break the whole section.
   *
   * @returns {Promise<{radar, distribution, topBars, heatmap, sources, domainCoverage}>}
   */
  allSkillsCharts: async () => {
    const [radar, distribution, topBars, heatmap, sources, domainCoverage] = await Promise.allSettled([
      skills.radar(),
      skills.distribution(),
      skills.topBars(),
      skills.heatmap(),
      skills.sources(),
      skills.domainCoverage(),
    ]);

    // Extract value or null for each settled result
    const extract = (r) => (r.status === 'fulfilled' ? r.value : null);

    return {
      radar          : extract(radar),
      distribution   : extract(distribution),
      topBars        : extract(topBars),
      heatmap        : extract(heatmap),
      sources        : extract(sources),
      domainCoverage : extract(domainCoverage),
    };
  },

  /**
   * Load all career chart data in parallel.
   * @returns {Promise<{gantt, employmentMix, projectsTreemap, projectsHeatmap, stackFrequency, achievements}>}
   */
  allCareerCharts: async () => {
    const [gantt, employ, treemap, heatmap, stack, achieve] = await Promise.allSettled([
      career.gantt(),
      career.employmentMix(),
      career.projectsTreemap(),
      career.projectsHeatmap(),
      career.stackFrequency(),
      career.achievementsTimeline(),
    ]);

    const extract = (r) => (r.status === 'fulfilled' ? r.value : null);

    return {
      gantt           : extract(gantt),
      employmentMix   : extract(employ),
      projectsTreemap : extract(treemap),
      projectsHeatmap : extract(heatmap),
      stackFrequency  : extract(stack),
      achievements    : extract(achieve),
    };
  },

  /**
   * Load all goals chart data in parallel.
   * @returns {Promise<{gauge, statusDonut, priorityDonut, yearProgress, skillGap, roadmap}>}
   */
  allGoalsCharts: async () => {
    const [gauge, status, priority, year, gap, roadmap] = await Promise.allSettled([
      goals.gauge(),
      goals.statusDonut(),
      goals.priorityDonut(),
      goals.yearProgress(),
      goals.skillGap(),
      goals.roadmapTimeline(),
    ]);

    const extract = (r) => (r.status === 'fulfilled' ? r.value : null);

    return {
      gauge        : extract(gauge),
      statusDonut  : extract(status),
      priorityDonut: extract(priority),
      yearProgress : extract(year),
      skillGap     : extract(gap),
      roadmap      : extract(roadmap),
    };
  },

  /**
   * Load all learning chart data in parallel.
   * @returns {Promise<{coursesByYear, providers, wordCloud, selfStudyTypes, tracks, vsOutput}>}
   */
  allLearningCharts: async () => {
    const [courses, providers, cloud, types, tracks, vs] = await Promise.allSettled([
      learning.coursesByYear(),
      learning.providers(),
      learning.wordCloud(),
      learning.selfStudyTypes(),
      learning.selfStudyTracks(),
      learning.learningVsOutput(),
    ]);

    const extract = (r) => (r.status === 'fulfilled' ? r.value : null);

    return {
      coursesByYear : extract(courses),
      providers     : extract(providers),
      wordCloud     : extract(cloud),
      selfStudyTypes: extract(types),
      tracks        : extract(tracks),
      vsOutput      : extract(vs),
    };
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT — namespaced service object
// ─────────────────────────────────────────────────────────────────────────────
const chartsService = { skills, career, learning, goals, composite };

export default chartsService;