/**
 * projectsService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to projects endpoints.
 * Consumes: GET /api/portfolio/projects
 *           GET /api/portfolio/projects/:id
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';                        // Central Axios instance
import { ENDPOINTS } from '../utils/constants';       // API path constants

const projectsService = {

  /**
   * Fetches all projects. Supports optional filters.
   * @param {object} params - Optional query params { type, limit }
   * @returns {Promise<{count, types, projects}>}
   */
  getProjects: (params = {}) =>
    apiClient.get(ENDPOINTS.PROJECTS, { params }),    // GET /portfolio/projects?type=...&limit=...

  /**
   * Fetches a single project by MongoDB ObjectId.
   * @param {string} id - Project ObjectId string
   * @returns {Promise<{id, project_name, ...}>}
   */
  getProjectById: (id) =>
    apiClient.get(ENDPOINTS.PROJECT_DETAIL(id)),      // GET /portfolio/projects/:id

};

export default projectsService;