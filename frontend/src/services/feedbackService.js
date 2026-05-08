/**
 * feedbackService.js
 * ─────────────────────────────────────────────────────────
 * All API calls related to feedback / contact form.
 * Consumes: POST /api/feedback
 *           GET  /api/feedback/featured
 * ─────────────────────────────────────────────────────────
 */
import apiClient from './api';                        // Central Axios instance
import { ENDPOINTS } from '../utils/constants';       // API path constants

const feedbackService = {

  /**
   * Submits a new contact/feedback message.
   * @param {{name, email, company, job_title, message}} payload
   * @returns {Promise<{success, message}>}
   */
  submitFeedback: (payload) =>
    apiClient.post(ENDPOINTS.FEEDBACK, payload),      // POST /feedback

  /**
   * Fetches approved testimonials for the public portfolio.
   * @returns {Promise<{testimonials}>}
   */
  getFeaturedTestimonials: () =>
    apiClient.get(ENDPOINTS.FEEDBACK_FEATURED),       // GET /feedback/featured

};

export default feedbackService;