/**
 * api.js — Centralized Axios instance for API requests.
 * Simplified: fast timeout + no retry = faster failure feedback.
 */

import axios from 'axios';                              // HTTP client library

// ── ENVIRONMENT CONFIGURATION ─────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL           // Read from .env file
  || 'http://localhost:5000/api';                       // Fallback for local dev

// ── AXIOS INSTANCE CREATION ───────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,                                    // All requests relative to this
  timeout: 8000,                                        // 8s max — fail fast, no hanging
  headers: { 'Content-Type': 'application/json' },     // Default JSON header
});

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data,                          // Unwrap data directly
  (error) => {
    const status  = error.response?.status;             // HTTP status code if any
    const message = error.response?.data?.message      // Server error message
      || error.message;                                 // Fallback to axios message

    console.error(`[API Error] ${status || 'NETWORK'}: ${message}`); // Dev log

    return Promise.reject({
      status,                                           // e.g. 404, 500
      message,                                          // Human-readable error
      isNetworkError: !error.response,                  // True if no response at all
      isTimeout:      error.code === 'ECONNABORTED',    // True if 8s exceeded
    });
  }
);

export default apiClient;                               // Single instance for all services