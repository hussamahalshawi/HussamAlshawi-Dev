/**
 * goalsService.js — All API calls related to goals endpoints
 * Consumes: GET /api/portfolio/goals
 *           GET /api/portfolio/goals/stats
 */
import apiClient from './api';                                // Central Axios instance
import { ENDPOINTS } from '../utils/constants';               // API path constants

const goalsService = {

  /**
   * Fetches all career roadmap goals with skill match data.
   * Used by: GoalsSection, roadmap progress chart
   * @returns {Promise<{count, goals}>}
   */
  getPublicGoals: () =>
    apiClient.get(ENDPOINTS.GOALS),                           // GET /portfolio/goals

  /**
   * Fetches aggregated goals statistics for charts.
   * Used by: AnalyticsSection, roadmap donut
   * @returns {Promise<{total_goals, by_status, by_priority, by_year, avg_progress}>}
   */
  getGoalsStats: () =>
    apiClient.get(ENDPOINTS.GOALS_STATS),                     // GET /portfolio/goals/stats

};

export default goalsService;