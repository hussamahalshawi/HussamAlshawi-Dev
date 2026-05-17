/**
 * useCourses.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for courses with live category filtering.
 * Initial load fires on intersection.
 * Filter changes trigger a background refetch without re-showing
 * the full loader — only a subtle loading indicator.
 *
 * Usage:
 *   const { courses, categories, loading, error, setCategory, sectionRef }
 *     = useCourses();
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';       // React primitives
import educationService                              from '../services/educationService'; // Education API
import { useIntersectionLoader }                     from './useIntersectionLoader';      // Shared observer

/**
 * useCourses — lazy loads courses with live category filter support.
 *
 * @param {React.RefObject} [externalRef] - Optional external ref
 *
 * @returns {{
 *   courses:     Array,        - Filtered course records
 *   categories:  Array,        - All available category filters
 *   category:    string,       - Currently active category filter
 *   setCategory: Function,     - Call to change active category
 *   loading:     boolean,      - True on initial load
 *   filtering:   boolean,      - True on filter refetch (subtle indicator)
 *   error:       string|null,
 *   sectionRef:  React.RefObject
 * }}
 */
export function useCourses(externalRef = null) {

  /* ── Ref management ── */
  const internalRef = useRef(null);                          // Fallback ref
  const sectionRef  = externalRef || internalRef;            // Prefer external

  /* ── Intersection trigger ── */
  const triggered = useIntersectionLoader(sectionRef);       // Fires once when visible

  /* ── Filter state ── */
  const [category,   setCategory]   = useState('');          // Active category filter ('' = all)

  /* ── Data state ── */
  const [courses,    setCourses]    = useState([]);           // Filtered course records
  const [categories, setCategories] = useState([]);           // All available categories
  const [loading,    setLoading]    = useState(false);        // True on initial load only
  const [filtering,  setFiltering]  = useState(false);        // True on filter change refetch
  const [error,      setError]      = useState(null);         // Error message or null

  /* ── Fetch function — reused for initial load and filter changes ── */
  const fetchCourses = useCallback(async (cat, isInitial) => {
    isInitial ? setLoading(true) : setFiltering(true);        // Initial = full loader, filter = subtle
    setError(null);                                           // Clear previous errors

    let cancelled = false;

    try {
      const params = cat ? { category: cat } : {};            // Build query params
      const data   = await educationService.getCourses(params); // GET /portfolio/courses

      if (!cancelled) {
        setCourses(data?.courses       || []);                 // Update filtered list
        if (isInitial) setCategories(data?.categories || []); // Only update categories on initial load
      }
    } catch (err) {
      if (!cancelled) setError(err.message || 'Failed to load courses.');
    } finally {
      if (!cancelled) {
        setLoading(false);                                     // Hide initial loader
        setFiltering(false);                                   // Hide filter indicator
      }
    }

    return () => { cancelled = true; };                        // Return cleanup
  }, []);

  /* ── Initial load on intersection ── */
  useEffect(() => {
    if (!triggered) return;                                    // Wait for visibility
    fetchCourses(category, true);                              // First load
  }, [triggered]);                                             // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Refetch on category change — skips if not yet triggered ── */
  useEffect(() => {
    if (!triggered) return;                                    // Don't fetch before visible
    fetchCourses(category, false);                             // Filter refetch — subtle indicator
  }, [category]);                                              // eslint-disable-line react-hooks/exhaustive-deps

  return {
    courses, categories,                                       // Data
    category, setCategory,                                     // Filter state + setter
    loading, filtering, error,                                 // Loading states
    sectionRef,                                                // Ref for section element
  };
}

export default useCourses;                                     // Default export