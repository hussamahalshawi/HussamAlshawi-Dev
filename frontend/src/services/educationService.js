/**
 * educationService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to education and courses endpoints.
 * Consumes: GET /api/portfolio/education
 *           GET /api/portfolio/courses
 *           GET /api/portfolio/courses/stats
 *           GET /api/portfolio/achievements
 *           GET /api/portfolio/self-study
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';                        // Central Axios instance
import { ENDPOINTS } from '../utils/constants';       // API path constants

const educationService = {

  /**
   * Fetches all academic records sorted by start_date descending.
   * Used by: EducationSection, academic timeline
   * @returns {Promise<{count, education[]}>}
   */
  getEducation: () =>
    apiClient.get(ENDPOINTS.EDUCATION),               // GET /portfolio/education

  /**
   * Fetches all certification and course records with optional filters.
   * Used by: CoursesSection, certificate gallery
   * @param {object} params - Optional { category, limit }
   * @returns {Promise<{count, categories[], courses[]}>}
   */
  getCourses: (params = {}) =>
    apiClient.get(ENDPOINTS.COURSES, { params }),     // GET /portfolio/courses?category=...

  /**
   * Fetches aggregated course statistics for charts.
   * Used by: Analytics section, learning trajectory chart
   * @returns {Promise<{total_courses, by_category[], by_year[], providers[]}>}
   */
  getCoursesStats: () =>
    apiClient.get(ENDPOINTS.COURSES_STATS),           // GET /portfolio/courses/stats

  /**
   * Fetches all awards and professional recognitions.
   * Used by: AchievementsSection, award badges
   * @returns {Promise<{count, achievements[]}>}
   */
  getAchievements: () =>
    apiClient.get(ENDPOINTS.ACHIEVEMENTS),            // GET /portfolio/achievements

  /**
   * Fetches all independent learning activities with optional type filter.
   * Used by: SelfStudySection, reading list
   * @param {object} params - Optional { type }
   * @returns {Promise<{count, types[], self_study[]}>}
   */
  getSelfStudy: (params = {}) =>
    apiClient.get(ENDPOINTS.SELF_STUDY, { params }),  // GET /portfolio/self-study?type=...

};

export default educationService;                      // Default export for consistent importing