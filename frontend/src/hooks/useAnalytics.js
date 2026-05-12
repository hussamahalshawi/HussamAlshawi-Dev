/**
 * useAnalytics.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching the analytics mega-payload.
 * Use in AnalyticsSection and all dashboard charts.
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';               // React hooks
import analyticsService         from '../services/analyticsService'; // Analytics API calls

/**
 * useAnalytics — fetches the full analytics payload once on mount.
 *
 * analytics shape:
 *   { profile_summary, counts, skills_radar,
 *     top_skills, goals_by_status, skills_distribution, ... }
 *
 * @returns {{
 *   analytics: object|null, - Analytics response object or null
 *   loading:   boolean,     - True while fetching
 *   error:     string|null  - Error message or null
 * }}
 */
export function useAnalytics() {

  const [analytics, setAnalytics] = useState(null); // Analytics response object
  const [loading,   setLoading]   = useState(true); // Fetching state
  const [error,     setError]     = useState(null); // Error message or null

  useEffect(() => {
    let cancelled = false;                           // Prevent stale state updates

    /* Named fetchAnalytics to avoid shadowing the browser's global fetch() */
    async function fetchAnalytics() {
      setLoading(true);                              // Show loading indicator
      setError(null);                               // Clear previous errors

      try {
        /* GET /portfolio/analytics — returns the mega aggregate payload */
        const data = await analyticsService.getAnalytics();
        if (!cancelled) setAnalytics(data);          // Only update if still mounted
      } catch (err) {
        /* Set error message — use API error or generic fallback */
        if (!cancelled) setError(err.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);           // Always hide loader
      }
    }

    fetchAnalytics();                                // Execute fetch on mount

    /* Cleanup: mark as cancelled if component unmounts before fetch completes */
    return () => { cancelled = true; };
  }, []);                                            // Empty deps — run once on mount

  return { analytics, loading, error };
}