/**
 * useExperience.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for work experience data.
 * API fires only when the Experience section enters the viewport.
 * Uses useIntersectionLoader to avoid duplicating Observer logic.
 *
 * Usage:
 *   const sectionRef = useRef(null);
 *   const { experience, loading, error } = useExperience(sectionRef);
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef }  from 'react';                        // React primitives
import experienceService                from '../services/experienceService'; // Experience API calls
import { useIntersectionLoader }        from '../services/useIntersectionLoader';       // Shared observer hook

/**
 * useExperience — fetches experience data when section enters the viewport.
 *
 * @param {React.RefObject} [externalRef] - Optional external ref from the section component
 *
 * @returns {{
 *   experience: Array,     - Work experience records array
 *   count:      number,    - Total count from API
 *   loading:    boolean,   - True while fetching
 *   error:      string|null, - Error message or null
 *   sectionRef: React.RefObject - Attach to the section element if no external ref
 * }}
 */
export function useExperience(externalRef = null) {

  /* ── Internal ref — used when no external ref is provided ── */
  const internalRef = useRef(null);                          // Fallback ref for the section element
  const sectionRef  = externalRef || internalRef;            // Prefer external, fallback to internal

  /* ── Intersection trigger — fires once when section is visible ── */
  const triggered = useIntersectionLoader(sectionRef);       // Returns true when section enters viewport

  /* ── Data state ── */
  const [experience, setExperience] = useState([]);          // Work experience records
  const [count,      setCount]      = useState(0);           // Total count from API
  const [loading,    setLoading]    = useState(false);       // True while fetching
  const [error,      setError]      = useState(null);        // Error message or null

  /* ── Fetch when intersection triggers — runs once only ── */
  useEffect(() => {
    if (!triggered) return;                                  // Wait until section is visible

    let cancelled = false;                                   // Prevent stale state on unmount

    async function fetchExperience() {
      setLoading(true);                                      // Show loading state
      setError(null);                                        // Clear previous errors

      try {
        /* GET /portfolio/experience — full work history */
        const data = await experienceService.getExperience();

        if (!cancelled) {
          setExperience(data?.experience || []);             // Update experience list
          setCount(data?.count || 0);                        // Update count
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load experience.');  // Set error message
        }
      } finally {
        if (!cancelled) setLoading(false);                   // Always hide loader
      }
    }

    fetchExperience();                                       // Execute fetch

    /* Cleanup: cancel state updates if component unmounts */
    return () => { cancelled = true; };

  }, [triggered]);                                           // Only re-run when trigger flips

  return { experience, count, loading, error, sectionRef };  // Expose all state + ref
}

export default useExperience;                                // Default export for convenient importing