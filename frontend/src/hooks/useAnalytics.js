/**
 * useAnalytics.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching the analytics mega-payload.
 * Use in AnalyticsSection and all dashboard charts.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import analyticsService        from '../services/analyticsService'; // Analytics API calls

/**
 * @returns {{ analytics, loading, error }}
 * analytics shape: { profile_summary, counts, skills_radar,
 *                    top_skills, goals_by_status, ... }
 */
export function useAnalytics() {
  const [analytics, setAnalytics] = useState(null); // Analytics response object
  const [loading,   setLoading]   = useState(true); // Fetching state
  const [error,     setError]     = useState(null); // Error message or null

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const data = await analyticsService.getAnalytics(); // GET /portfolio/analytics
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { analytics, loading, error };
}