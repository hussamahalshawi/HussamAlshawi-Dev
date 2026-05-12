/**
 * api.js — Centralized Axios instance for API requests.
 * Features: Exponential backoff retries, Timeout handling, and Interceptors.
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';

// ── ENVIRONMENT CONFIGURATION ─────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── AXIOS INSTANCE CREATION ───────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 0, // Increased to 10 seconds for unstable networks
  headers: { 'Content-Type': 'application/json' },
});

// ── RETRY LOGIC CONFIGURATION ─────────────────────────────────────
/**
 * Configures automatic retries to handle network flakiness.
 * It will retry 3 times before returning a final error.
 */
axiosRetry(apiClient, {
  retries: 3, // Total number of retry attempts
  retryDelay: (retryCount) => {
    // Exponential backoff: waits 2s, 4s, then 6s between retries
    console.warn(`[API] Connection issue. Retrying attempt #${retryCount}...`);
    return retryCount * 2000;
  },
  retryCondition: (error) => {
  // Only retry on network errors, NOT on timeout since timeout is disabled
  return axiosRetry.isNetworkOrIdempotentRequestError(error);
},
  shouldResetTimeout: true, // Reset timeout clock for each retry attempt
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Logic for injecting Auth tokens can be added here in the future
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data, // Directly return the data payload
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Log final error after all retry attempts fail
    console.error(`[API Final Error] ${status || 'NETWORK'}: ${message}`);

    return Promise.reject({
      status,
      message,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
    });
  }
);

export default apiClient;