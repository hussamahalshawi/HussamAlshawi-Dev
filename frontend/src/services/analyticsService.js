/**
 * analyticsService.js — كل طلبات الـ Analytics
 */
import apiClient from './api';

const analyticsService = {

  /** الـ mega aggregate — يغذي كل الشارتات */
  getAnalytics: () =>
    apiClient.get('/portfolio/analytics'),

  /** Tech stack frequency */
  getTechStack: () =>
    apiClient.get('/portfolio/analytics/tech-stack'),

  /** Career timeline */
  getCareerTimeline: () =>
    apiClient.get('/portfolio/analytics/timeline'),

};

export default analyticsService;