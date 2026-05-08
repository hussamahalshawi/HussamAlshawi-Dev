/**
 * skillsService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to skills endpoints.
 * Consumes: GET /api/portfolio/skills
 *           GET /api/portfolio/skills/summary
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';                        // Central Axios instance
import { ENDPOINTS } from '../utils/constants';       // API path constants

const skillsService = {

  /**
   * Fetches all skills grouped by category.
   * Used by: SkillsSection, BarChart, RadarChart, skill cloud
   * @returns {Promise<{count, skills, grouped, categories}>}
   */
  getPublicSkills: () =>
    apiClient.get(ENDPOINTS.SKILLS),                  // GET /portfolio/skills

  /**
   * Fetches a lightweight summary for dashboard widgets.
   * Used by: AnalyticsSection top-skills bar, distribution donut
   * @returns {Promise<{total_skills, top_skills, category_averages, distribution}>}
   */
  getSkillsSummary: () =>
    apiClient.get(ENDPOINTS.SKILLS_SUMMARY),          // GET /portfolio/skills/summary

};

export default skillsService;