/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Central data hook — fetches ALL portfolio data in parallel.
 * Uses Promise.allSettled so a single API failure does NOT
 * crash the whole page (partial data is shown instead).
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';  // React hooks — useCallback added
import profileService                        from '../services/profileService';    // Profile API
import analyticsService                      from '../services/analyticsService';  // Analytics API
import skillsService                         from '../services/skillsService';     // Skills API
import projectsService                       from '../services/projectsService';   // Projects API

/** Default empty state — prevents undefined crashes before data loads */
const INITIAL_STATE = {
  profile:   null,   // Profile object from /api/portfolio/profile
  analytics: null,   // Analytics object from /api/portfolio/analytics
  skills:    null,   // Skills object from /api/portfolio/skills
  projects:  null,   // Projects object from /api/portfolio/projects
};

/**
 * usePortfolioData — fetches all portfolio data concurrently.
 * @returns {{ data, loading, error, refetch }}
 */
export function usePortfolioData() {

  const [data,    setData]    = useState(INITIAL_STATE); // Holds all API responses
  const [loading, setLoading] = useState(true);          // True while fetching
  const [error,   setError]   = useState(null);          // null = ok, string = error msg

  /**
   * fetchAll — core fetch function wrapped in useCallback.
   * useCallback prevents a new function reference on every render,
   * which would otherwise cause the useEffect to re-run infinitely.
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);    // Show loader
    setError(null);      // Clear previous errors

    /* Fire all requests simultaneously — no waterfall */
    const results = await Promise.allSettled([
      profileService.getPublicProfile(),       // Slot 0 — profile
      analyticsService.getAnalytics(),         // Slot 1 — analytics
      skillsService.getPublicSkills(),         // Slot 2 — skills
      projectsService.getProjects(),           // Slot 3 — projects
    ]);

    /* Destructure by position (matches order above) */
    const [profileRes, analyticsRes, skillsRes, projectsRes] = results;

    /* Build the data object — null if that specific request failed */
    const newData = {
      profile:   profileRes.status   === 'fulfilled' ? profileRes.value   : null,
      analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
      skills:    skillsRes.status    === 'fulfilled' ? skillsRes.value    : null,
      projects:  projectsRes.status  === 'fulfilled' ? projectsRes.value  : null,
    };

    /* Only show error banner if EVERYTHING failed (full offline) */
    const allFailed = Object.values(newData).every(v => v === null);
    if (allFailed) {
      const firstRejection = results.find(r => r.status === 'rejected'); // First error
      const isOffline      = firstRejection?.reason?.isNetworkError;     // Network down?
      setError(
        isOffline
          ? 'Backend is offline. Showing demo content.'   // Network down
          : 'Failed to load portfolio data.'              // API error
      );
    }

    setData(newData);    // Update state with whatever succeeded
    setLoading(false);   // Hide loader
  }, []);                // Empty deps — fetchAll never changes after mount

  /* Run once on mount — useCallback ensures stable reference */
  useEffect(() => {
    fetchAll();          // Execute the parallel fetch on component mount
  }, [fetchAll]);        // fetchAll is stable due to useCallback([])

  return {
    data,               // { profile, analytics, skills, projects }
    loading,            // boolean
    error,              // null | string
    refetch: fetchAll,  // Call this to manually refresh all data
  };
}