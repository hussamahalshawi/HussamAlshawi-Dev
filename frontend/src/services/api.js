/**
 * api.js — Axios instance مركزي لكل طلبات الـ API
 * كل service يستورد من هنا فقط
 */

import axios from 'axios';

// ── BASE URL من environment variable ─────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Axios instance مع timeout ────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,                                  // 8 ثوان max
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ──────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // أضف token لو عندك auth في المستقبل
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response.data,                    // رجّع البيانات مباشرة
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.error || error.message;

    // Log للـ console فقط — مو للـ UI
    console.error(`[API Error] ${status || 'NETWORK'}: ${message}`);

    return Promise.reject({
      status,
      message,
      isNetworkError: !error.response,            // true = الباكند وقع
      isTimeout:      error.code === 'ECONNABORTED',
    });
  }
);

export default apiClient;