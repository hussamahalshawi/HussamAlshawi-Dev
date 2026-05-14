/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Central data hook — Priority Loading Strategy:
 *   Phase 1 (Critical): Profile + Analytics → hides PageLoader
 *   Phase 2 (Background): Skills + Projects + Summary → loads silently
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import profileService                        from '../services/profileService';
import analyticsService                      from '../services/analyticsService';
import skillsService                         from '../services/skillsService';
import projectsService                       from '../services/projectsService';

/** Default empty state */
const INITIAL_STATE = {
  profile:      null,
  analytics:    null,
  skills:       null,
  projects:     null,
  skillsSummary: null,
};

/**
 * usePortfolioData — Phase 1 loads critical data and releases the loader.
 *                    Phase 2 loads the rest silently in the background.
 * @returns {{ data, loading, error, progress, refetch }}
 */
export function usePortfolioData() {

  const [data,     setData]     = useState(INITIAL_STATE); // All API responses
  const [loading,  setLoading]  = useState(true);          // True only during Phase 1
  const [error,    setError]    = useState(null);          // Error from Phase 1 only
  const [progress, setProgress] = useState(0);             // Tracks Phase 1 progress (0-2)

  const fetchAll = useCallback(async () => {
    setLoading(true);                                       // Show PageLoader
    setError(null);                                         // Clear previous errors
    setProgress(0);                                         // Reset progress dots

    /* ─────────────────────────────────────────
       PHASE 1 — Critical APIs (blocks the loader)
       Only Profile + Analytics are needed for OverviewSection
    ───────────────────────────────────────── */
    const criticalTasks = [
      profileService.getPublicProfile(),                    // Task 0: Profile
      analyticsService.getAnalytics(),                      // Task 1: Analytics
    ];

    /* Attach progress listeners to Phase 1 tasks */
    criticalTasks.forEach((task, index) => {
      const names = ['Profile', 'Analytics'];               // Task names for logging
      task.finally(() => {
        console.log(`[Phase 1] ✓ ${names[index]} loaded`); // Dev feedback
        setProgress(prev => prev + 1);                      // Advance progress bar
      });
    });

    /* Wait for both critical APIs before releasing the loader */
    const [profileRes, analyticsRes] = await Promise.allSettled(criticalTasks);

    /* Build Phase 1 data slice */
    const phase1Data = {
      profile:   profileRes.status   === 'fulfilled' ? profileRes.value   : null,
      analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
    };

    /* Check if both critical APIs failed — show error banner */
    const criticalFailed = phase1Data.profile === null && phase1Data.analytics === null;
    if (criticalFailed) {
      const firstRejection = [profileRes, analyticsRes].find(r => r.status === 'rejected');
      const isOffline      = firstRejection?.reason?.isNetworkError;
      setError(isOffline ? 'Backend is offline' : 'Failed to load portfolio data');
    }

    /* Update state with Phase 1 data — this triggers re-render */
    setData(prev => ({ ...prev, ...phase1Data }));          // Merge into existing state

    /* ── Release the PageLoader here ── */
    setLoading(false);                                       // Hide PageLoader — page is visible now

    /* ─────────────────────────────────────────
       PHASE 2 — Background APIs (silent, no loader)
       Skills + Projects + Summary load after page is visible
    ───────────────────────────────────────── */
    const backgroundTasks = [
      skillsService.getPublicSkills(),                      // Background Task 0: Skills
      projectsService.getProjects(),                        // Background Task 1: Projects
      skillsService.getSkillsSummary(),                     // Background Task 2: Skills Summary
    ];

    /* Fire and forget — no await, no loading state change */
    Promise.allSettled(backgroundTasks).then(([skillsRes, projectsRes, summaryRes]) => {

      /* Build Phase 2 data slice */
      const phase2Data = {
        skills:       skillsRes.status   === 'fulfilled' ? skillsRes.value   : null,
        projects:     projectsRes.status === 'fulfilled' ? projectsRes.value : null,
        skillsSummary: summaryRes.status  === 'fulfilled' ? summaryRes.value  : null,
      };

      console.log('[Phase 2] ✓ Background data loaded'); // Dev feedback
      setData(prev => ({ ...prev, ...phase2Data }));       // Merge Phase 2 into state
    });

  }, []);

  useEffect(() => {
    fetchAll();                                              // Auto-fetch on mount
  }, [fetchAll]);

  return {
    data,
    loading,    // Now only true during Phase 1
    error,
    progress,   // 0-2 now (two critical tasks only)
    refetch: fetchAll,
  };
}