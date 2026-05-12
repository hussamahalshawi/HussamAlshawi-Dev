/**
 * useSkills.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching skills data.
 * Use in SkillsSection and chart components.
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';               // React hooks
import skillsService            from '../services/skillsService'; // Skills API calls

/**
 * useSkills — fetches all skills grouped by category once on mount.
 *
 * skills shape:
 *   { count, skills[], grouped{}, categories[] }
 *
 * @returns {{
 *   skills:  object|null, - Full skills response object or null
 *   loading: boolean,     - True while fetching
 *   error:   string|null  - Error message or null
 * }}
 */
export function useSkills() {

  const [skills,  setSkills]  = useState(null);   // Full skills response
  const [loading, setLoading] = useState(true);   // Fetching state
  const [error,   setError]   = useState(null);   // Error message or null

  useEffect(() => {
    let cancelled = false;                         // Prevent stale state updates

    /* Named fetchSkills to avoid shadowing the browser's global fetch() */
    async function fetchSkills() {
      setLoading(true);                            // Show loading indicator
      setError(null);                              // Clear previous errors

      try {
        /* GET /portfolio/skills — returns skills grouped by category */
        const data = await skillsService.getPublicSkills();
        if (!cancelled) setSkills(data);           // Only update if still mounted
      } catch (err) {
        /* Set error message — use API error or generic fallback */
        if (!cancelled) setError(err.message || 'Failed to load skills.');
      } finally {
        if (!cancelled) setLoading(false);         // Always hide loader
      }
    }

    fetchSkills();                                 // Execute fetch on mount

    /* Cleanup: mark as cancelled if component unmounts before fetch completes */
    return () => { cancelled = true; };
  }, []);                                          // Empty deps — run once on mount

  return { skills, loading, error };
}