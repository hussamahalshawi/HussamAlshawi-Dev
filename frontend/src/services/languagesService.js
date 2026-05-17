/**
 * languagesService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to language proficiency endpoints.
 * Consumes: GET /api/portfolio/languages
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';                        // Central Axios instance
import { ENDPOINTS } from '../utils/constants';       // API path constants

const languagesService = {

  /**
   * Fetches all language proficiency records with visual metadata.
   * Used by: LanguagesWidget, proficiency progress bars
   * @returns {Promise<{count, languages[]}>}
   */
  getLanguages: () =>
    apiClient.get(ENDPOINTS.LANGUAGES),               // GET /portfolio/languages

};

export default languagesService;                      // Default export for consistent importing