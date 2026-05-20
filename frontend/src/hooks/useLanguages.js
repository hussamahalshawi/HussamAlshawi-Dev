/**
 * useLanguages.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for language proficiency data.
 * API fires only when the Languages widget enters the viewport.
 *
 * Usage:
 *   const { languages, loading, error, sectionRef } = useLanguages();
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';                      // React primitives
import languagesService                from '../services/languagesService'; // Languages API calls
import { useIntersectionLoader } from '../services/useIntersectionLoader';
/**
 * useLanguages — fetches language proficiency when widget enters viewport.
 *
 * @param {React.RefObject} [externalRef] - Optional external ref
 *
 * @returns {{
 *   languages:  Array,       - Language proficiency records with visual tokens
 *   count:      number,      - Total languages count
 *   loading:    boolean,     - True while fetching
 *   error:      string|null, - Error message or null
 *   sectionRef: React.RefObject
 * }}
 */
export function useLanguages(externalRef = null) {

  /* ── Ref management ── */
  const internalRef = useRef(null);                          // Fallback ref
  const sectionRef  = externalRef || internalRef;            // Prefer external

  /* ── Intersection trigger ── */
  const triggered = useIntersectionLoader(sectionRef);       // Fires once when visible

  /* ── Data state ── */
  const [languages, setLanguages] = useState([]);            // Language records array
  const [count,     setCount]     = useState(0);             // Total count
  const [loading,   setLoading]   = useState(false);         // True while fetching
  const [error,     setError]     = useState(null);          // Error message or null

  /* ── Fetch when triggered ── */
  useEffect(() => {
    if (!triggered) return;                                  // Wait until visible

    let cancelled = false;                                   // Prevent stale state

    async function fetchLanguages() {
      setLoading(true);                                      // Show loader
      setError(null);                                        // Clear errors

      try {
        /* GET /portfolio/languages — returns languages with visual tokens */
        const data = await languagesService.getLanguages();

        if (!cancelled) {
          setLanguages(data?.languages || []);               // Update languages list
          setCount(data?.count || 0);                        // Update count
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load languages.');
        }
      } finally {
        if (!cancelled) setLoading(false);                   // Always hide loader
      }
    }

    fetchLanguages();                                        // Execute

    return () => { cancelled = true; };                      // Cleanup

  }, [triggered]);                                           // Fires once

  return { languages, count, loading, error, sectionRef };
}

export default useLanguages;                                 // Default export