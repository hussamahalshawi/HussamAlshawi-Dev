/**
 * useGoals.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for career goals and roadmap data.
 * API fires only when the Goals section enters the viewport.
 * Loads both goals list and stats in parallel.
 *
 * Usage:
 *   const sectionRef = useRef(null);
 *   const { goals, stats, loading, error } = useGoals(sectionRef);
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';                  // React primitives
import goalsService                    from '../services/goalsService'; // Goals API calls
import { useIntersectionLoader }       from './useIntersectionLoader';  // Shared observer hook

/**
 * useGoals — fetches goals and stats when section enters the viewport.
 *
 * @param {React.RefObject} [externalRef] - Optional external ref from the section component
 *
 * @returns {{
 *   goals:      Array,       - Career roadmap goals array
 *   stats:      object|null, - Goals statistics object
 *   count:      number,      - Total goals count
 *   loading:    boolean,     - True while fetching
 *   error:      string|null, - Error message or null
 *   sectionRef: React.RefObject
 * }}
 */
export function useGoals(externalRef = null) {

  /* ── Ref management ── */
  const internalRef = useRef(null);                        // Fallback ref for the section element
  const sectionRef  = externalRef || internalRef;          // Prefer external, fallback to internal

  /* ── Intersection trigger ── */
  const triggered = useIntersectionLoader(sectionRef);     // Fires once when section is visible

  /* ── Data state ── */
  const [goals,   setGoals]   = useState([]);              // Goals array from API
  const [stats,   setStats]   = useState(null);            // Goals statistics object
  const [count,   setCount]   = useState(0);               // Total goals count
  const [loading, setLoading] = useState(false);           // True while fetching
  const [error,   setError]   = useState(null);            // Error message or null

  /* ── Fetch both goals and stats in parallel when triggered ── */
  useEffect(() => {
    if (!triggered) return;                                // Wait until section is visible

    let cancelled = false;                                 // Prevent stale state on unmount

    async function fetchGoals() {
      setLoading(true);                                    // Show loading state
      setError(null);                                      // Clear previous errors

      try {
        /* Fire both endpoints in parallel — one round trip delay */
        const [goalsResult, statsResult] = await Promise.all([
          goalsService.getPublicGoals(),                   // GET /portfolio/goals
          goalsService.getGoalsStats(),                    // GET /portfolio/goals/stats
        ]);

        if (!cancelled) {
          setGoals(goalsResult?.goals   || []);            // Update goals list
          setCount(goalsResult?.count   || 0);             // Update count
          setStats(statsResult          || null);          // Update stats object
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load goals.');  // Set error message
        }
      } finally {
        if (!cancelled) setLoading(false);                 // Always hide loader
      }
    }

    fetchGoals();                                          // Execute fetch

    return () => { cancelled = true; };                   // Cleanup on unmount

  }, [triggered]);                                         // Only re-run when trigger flips

  return { goals, stats, count, loading, error, sectionRef };
}

export default useGoals;                                   // Default export for convenient importing