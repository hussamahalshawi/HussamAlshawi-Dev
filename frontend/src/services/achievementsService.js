/**
 * achievementsService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to achievements endpoints.
 * Consumes: GET /api/portfolio/achievements
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';
import { ENDPOINTS } from '../utils/constants';

const achievementsService = {

  /**
   * Fetches all achievements sorted by date.
   * @returns {Promise<{count, achievements[]}>}
   */
  getAchievements: () =>
    apiClient.get(ENDPOINTS.ACHIEVEMENTS),

};

export default achievementsService;
