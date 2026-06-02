/**
 * analyticsService.js — كل طلبات الـ Analytics
 */
import apiClient, { apiClientBackground } from './api';

const analyticsService = {

  /** الـ mega aggregate — يغذي كل الشارتات */
  getAnalytics: () =>
    apiClientBackground.get('/portfolio/analytics'),

  /** Split: counts only (profile summary + model counts) */
  getAnalyticsCounts: () =>
    apiClientBackground.get('/portfolio/analytics/counts'),

  /** Split: skills data (radar + distribution + top skills) */
  getAnalyticsSkills: () =>
    apiClientBackground.get('/portfolio/analytics/skills-data'),

  /** Split: progress data (goals + courses + learning + projects) */
  getAnalyticsProgress: () =>
    apiClientBackground.get('/portfolio/analytics/progress'),

  /** Tech stack frequency */
  getTechStack: () =>
    apiClientBackground.get('/portfolio/analytics/tech-stack'),

  /** Career timeline */
  getCareerTimeline: () =>
    apiClientBackground.get('/portfolio/analytics/timeline'),

  /** Portfolio comprehensive summary (legacy — single fetch) */
  getPortfolioSummary: () =>
    apiClientBackground.get('/charts/portfolio/summary'),

  /** Split portfolio endpoints */
  getPortfolioSkills: () =>
    apiClientBackground.get('/charts/portfolio/skills'),

  getPortfolioGoals: () =>
    apiClientBackground.get('/charts/portfolio/goals'),

  getPortfolioTimeline: () =>
    apiClientBackground.get('/charts/portfolio/timeline'),

  getPortfolioSources: () =>
    apiClientBackground.get('/charts/portfolio/sources'),

};

export default analyticsService;