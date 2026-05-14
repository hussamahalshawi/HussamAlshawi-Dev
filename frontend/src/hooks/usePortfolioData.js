/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Central data hook — Priority Loading Strategy:
 *   Phase 1 (Critical): Profile + Analytics → hides PageLoader
 *   Phase 2 (Background): Skills + Projects + Summary → silent
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';           // React hooks
import profileService                        from '../services/profileService';   // Profile API
import analyticsService                      from '../services/analyticsService'; // Analytics API
import skillsService                         from '../services/skillsService';    // Skills API
import projectsService                       from '../services/projectsService';  // Projects API
import { apiClientBackground } from '../services/api';

/** Default empty state — prevents undefined crashes before data loads */
const INITIAL_STATE = {
  profile:       null,  // Profile object from /api/portfolio/profile
  analytics:     null,  // Analytics object from /api/portfolio/analytics
  skills:        null,  // Skills object from /api/portfolio/skills
  projects:      null,  // Projects object from /api/portfolio/projects
  skillsSummary: null,  // Skills summary from /api/portfolio/skills/summary
};

/**
 * usePortfolioData — Phase 1 fetches critical data and releases the loader.
 *                    Phase 2 fetches the rest silently after page is visible.
 * @returns {{ data, loading, error, progress, refetch }}
 */
export function usePortfolioData() {

  const [data,     setData]     = useState(INITIAL_STATE); // Holds all API responses
  const [loading,  setLoading]  = useState(true);          // True ONLY during Phase 1
  const [error,    setError]    = useState(null);          // Error from Phase 1 only
  const [progress, setProgress] = useState(0);             // Tracks Phase 1 (0 → 2)

  const fetchAll = useCallback(async () => {
    setLoading(true);   // Show PageLoader
    setError(null);     // Clear previous errors
    setProgress(0);     // Reset progress dots

    /* ═══════════════════════════════════════════════════
       PHASE 1 — Critical APIs
       Blocks the loader until BOTH are done.
       Profile + Analytics are enough for OverviewSection.
    ═══════════════════════════════════════════════════ */
    const criticalTasks = [
      profileService.getPublicProfile(),  // Task 0: Profile data
      analyticsService.getAnalytics(),    // Task 1: Analytics data
    ];

    /* Attach .finally() to each task to advance the progress dots in real time */
    criticalTasks.forEach((task, index) => {
      const names = ['Profile', 'Analytics'];               // Task names for dev logs
      task.finally(() => {
        console.log(`[Phase 1] ✓ ${names[index]} loaded`); // Dev feedback in console
        setProgress(prev => prev + 1);                      // Advance one dot per task
      });
    });

    /* Wait for both — page stays on loader until here */
    const [profileRes, analyticsRes] = await Promise.allSettled(criticalTasks);

    /* Extract values safely — null if the request failed */
    const phase1Data = {
      profile:   profileRes.status   === 'fulfilled' ? profileRes.value   : null,
      analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
    };

    /* Show global error only if BOTH critical APIs failed */
    const bothFailed = phase1Data.profile === null && phase1Data.analytics === null;
    if (bothFailed) {
      const firstRejection = [profileRes, analyticsRes].find(r => r.status === 'rejected');
      const isOffline      = firstRejection?.reason?.isNetworkError; // Check network flag
      setError(isOffline ? 'Backend is offline' : 'Failed to load portfolio data');
    }

    /* Merge Phase 1 data into state */
    setData(prev => ({ ...prev, ...phase1Data })); // Keep existing nulls for Phase 2

    /* ── Release the PageLoader immediately ── */
    setLoading(false); // Page becomes visible NOW — no waiting for Skills/Projects

    /* ═══════════════════════════════════════════════════
       PHASE 2 — Background APIs
       Fires after loader hides. No loading state changes.
       Components receive data via setData when ready.
    ═══════════════════════════════════════════════════ */
    // Phase 2 uses apiClientBackground directly — bypasses 8s timeout on services
    Promise.allSettled([
      apiClientBackground.get('/portfolio/skills'),         // No timeout — wait as long as needed
      apiClientBackground.get('/portfolio/projects'),       // No timeout — wait as long as needed
      apiClientBackground.get('/portfolio/skills/summary'), // No timeout — wait as long as needed
    ]).then(([skillsRes, projectsRes, summaryRes]) => {

      const phase2Data = {
        skills:        skillsRes.status   === 'fulfilled' ? skillsRes.value   : null,
        projects:      projectsRes.status === 'fulfilled' ? projectsRes.value : null,
        skillsSummary: summaryRes.status  === 'fulfilled' ? summaryRes.value  : null,
      };

      console.log('[Phase 2] ✓ Background data loaded');    // Dev feedback
      setData(prev => ({ ...prev, ...phase2Data }));         // Merge into state reactively
    });
    /* No catch needed — allSettled never rejects, errors are per-item */

  }, []); // No dependencies — stable function reference

  /* Auto-fetch on mount */
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,       // Full data object — Phase 2 fields update reactively
    loading,    // False after Phase 1 completes — NOT after Phase 2
    error,      // Only set if Phase 1 entirely fails
    progress,   // 0-2 matching Phase 1 tasks only
    refetch: fetchAll,
  };
}