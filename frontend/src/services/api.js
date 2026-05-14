/**
 * api.js — Two Axios instances:
 *   apiClient         → Phase 1 critical requests (8s timeout)
 *   apiClientBackground → Phase 2 background requests (no timeout)
 */

import axios from 'axios';                              // HTTP client library

// ── BASE URL ──────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL           // Read from .env
  || 'http://localhost:5000/api';                       // Local dev fallback

// ── PHASE 1: Critical instance — fast timeout ─────────────────────
// Used for Profile + Analytics only
const apiClient = axios.create({
  baseURL: BASE_URL,                                    // All requests relative to this
  timeout: 0,                                        // 8s — fail fast for critical data
  headers: { 'Content-Type': 'application/json' },     // Default JSON header
});

// ── PHASE 2: Background instance — no timeout ─────────────────────
// Used for Skills + Projects + Summary — they can take as long as needed
const apiClientBackground = axios.create({
  baseURL: BASE_URL,                                    // Same base URL
  timeout: 0,                                           // No timeout — wait until done
  headers: { 'Content-Type': 'application/json' },     // Default JSON header
});

// ── SHARED RESPONSE HANDLER ───────────────────────────────────────
// Applied to both instances — same error shape
const responseHandler = [
  (response) => response.data,                          // Unwrap data directly
  (error) => {
    const status  = error.response?.status;             // HTTP status if any
    const message = error.response?.data?.message      // Server error message
      || error.message;                                 // Fallback to axios message

    console.error(`[API Error] ${status || 'NETWORK'}: ${message}`); // Dev log

    return Promise.reject({
      status,                                           // e.g. 404, 500
      message,                                          // Human-readable error
      isNetworkError: !error.response,                  // True if no server response
      isTimeout:      error.code === 'ECONNABORTED',    // True if timeout exceeded
    });
  },
];

// Apply same interceptor to both instances
apiClient.interceptors.response.use(...responseHandler);
apiClientBackground.interceptors.response.use(...responseHandler);

export default apiClient;                               // Phase 1 — default export
export { apiClientBackground };                         // Phase 2 — named export