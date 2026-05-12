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
 * usePortfolioData — fetches all portfolio data concurrently with progress tracking.
 * @returns {{ data, loading, error, progress, refetch }}
 */
export function usePortfolioData() {
  const [data, setData] = useState(INITIAL_STATE);       // Holds all API responses
  const [loading, setLoading] = useState(true);          // Global loading state
  const [error, setError] = useState(null);              // API error messages
  const [progress, setProgress] = useState(0);           // Tracks number of completed requests

  /**
   * fetchAll — core fetch function with real-time progress updates.
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);                                    // Initialize loading
    setError(null);                                      // Reset previous errors
    setProgress(0);                                      // Reset progress counter

    /* Define the list of API tasks to be executed in parallel */
    const tasks = [
      profileService.getPublicProfile(),                 // Task 0: Profile data
      analyticsService.getAnalytics(),                   // Task 1: Analytics data
      skillsService.getPublicSkills(),                   // Task 2: Skills list
      projectsService.getProjects(),                     // Task 3: Projects list
      skillsService.getSkillsSummary(),                  // Task 4: Skills summary
    ];

    /* Attach a listener to each task to increment progress regardless of success or failure */
    tasks.forEach(task => {
      task.finally(() => {
        setProgress(prev => prev + 1);                   // Increment counter when a request settles
      });
    });

    /* Execute all requests simultaneously using Promise.allSettled */
    const results = await Promise.allSettled(tasks);

    /* Destructure results for mapping */
    const [profileRes, analyticsRes, skillsRes, projectsRes] = results;

    /* Construct the final data object, defaulting to null for failed requests */
    const newData = {
      profile:   profileRes.status   === 'fulfilled' ? profileRes.value   : null,
      analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
      skills:    skillsRes.status    === 'fulfilled' ? skillsRes.value    : null,
      projects:  projectsRes.status  === 'fulfilled' ? projectsRes.value  : null,
    };

    /* Validation: check if all requests failed to display a global error banner */
    const allFailed = Object.values(newData).every(v => v === null);
    if (allFailed) {
      const firstRejection = results.find(r => r.status === 'rejected');
      const isOffline      = firstRejection?.reason?.isNetworkError;
      setError(isOffline ? 'Backend is offline' : 'Failed to load portfolio data');
    }

    setData(newData);                                    // Update global state
    setLoading(false);                                   // Dismiss loader
  }, []);

  useEffect(() => {
    fetchAll();                                          // Auto-fetch on component mount
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    progress,                                            // Expose progress for UI components
    refetch: fetchAll,
  };
}