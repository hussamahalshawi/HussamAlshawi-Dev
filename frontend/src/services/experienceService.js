/**
 * experienceService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to work experience endpoints.
 * Consumes: GET /api/portfolio/experience
 *           GET /api/portfolio/experience/timeline
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';                        // Central Axios instance
import { ENDPOINTS } from '../utils/constants';       // API path constants

const experienceService = {

  /**
   * Fetches all professional experience records sorted by date.
   * Used by: ExperienceSection, career timeline chart
   * @returns {Promise<{count, experience[]}>}
   */
  getExperience: () =>
    apiClient.get(ENDPOINTS.EXPERIENCE),              // GET /portfolio/experience

  /**
   * Fetches a compact timeline format for visual timeline components.
   * Used by: Timeline chart, Gantt chart
   * @returns {Promise<{timeline[]}>}
   */
  getExperienceTimeline: () =>
    apiClient.get(ENDPOINTS.EXPERIENCE_TIMELINE),     // GET /portfolio/experience/timeline

};

export default experienceService;                     // Default export for consistent importing