/**
 * useEducation.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for education, courses, achievements,
 * and self-study data.
 * All four endpoints fire in parallel when the section
 * enters the viewport — single loading state for the whole section.
 *
 * Usage:
 *   const { education, courses, achievements, selfStudy, loading, error, sectionRef }
 *     = useEducation();
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';                     // React primitives
import educationService                from '../services/educationService'; // Education API calls
import { useIntersectionLoader }       from './useIntersectionLoader';     // Shared observer hook

/**
 * useEducation — fetches all learning data when section enters the viewport.
 * Loads education, courses, achievements, and self-study in parallel.
 *
 * @param {React.RefObject} [externalRef] - Optional external ref from the section component
 * @param {object}          [params]      - Optional query params { courseCategory, selfStudyType }
 *
 * @returns {{
 *   education:    Array,       - Academic records array
 *   courses:      Array,       - Certification records array
 *   achievements: Array,       - Awards array
 *   selfStudy:    Array,       - Self-learning records array
 *   categories:   Array,       - Available course category filters
 *   types:        Array,       - Available self-study type filters
 *   loading:      boolean,     - True while any fetch is in progress
 *   error:        string|null, - Error message or null
 *   sectionRef:   React.RefObject
 * }}
 */
export function useEducation(externalRef = null, params = {}) {

  /* ── Ref management ── */
  const internalRef = useRef(null);                            // Fallback ref for section element
  const sectionRef  = externalRef || internalRef;              // Prefer external, fallback internal

  /* ── Intersection trigger ── */
  const triggered = useIntersectionLoader(sectionRef);         // Fires once when visible

  /* ── Data state ── */
  const [education,    setEducation]    = useState([]);        // Academic records
  const [courses,      setCourses]      = useState([]);        // Course records
  const [achievements, setAchievements] = useState([]);        // Achievement records
  const [selfStudy,    setSelfStudy]    = useState([]);        // Self-study records
  const [categories,   setCategories]   = useState([]);        // Course category filter options
  const [types,        setTypes]        = useState([]);        // Self-study type filter options
  const [loading,      setLoading]      = useState(false);     // True while fetching
  const [error,        setError]        = useState(null);      // Error message or null

  /* ── Fetch all four endpoints in parallel when triggered ── */
  useEffect(() => {
    if (!triggered) return;                                    // Wait until section is visible

    let cancelled = false;                                     // Prevent stale state on unmount

    async function fetchEducationData() {
      setLoading(true);                                        // Show loading state
      setError(null);                                          // Clear previous errors

      /* Fire all four in parallel — settled so one failure won't block others */
      const [eduResult, coursesResult, achResult, studyResult] = await Promise.allSettled([
        educationService.getEducation(),                       // GET /portfolio/education
        educationService.getCourses(params.courseCategory      // GET /portfolio/courses?category=...
          ? { category: params.courseCategory } : {}),
        educationService.getAchievements(),                    // GET /portfolio/achievements
        educationService.getSelfStudy(params.selfStudyType     // GET /portfolio/self-study?type=...
          ? { type: params.selfStudyType } : {}),
      ]);

      if (cancelled) return;                                   // Abort if unmounted

      /* Extract values safely — null on failure */
      const eduData    = eduResult.status     === 'fulfilled' ? eduResult.value     : null;
      const coursesData= coursesResult.status === 'fulfilled' ? coursesResult.value : null;
      const achData    = achResult.status      === 'fulfilled' ? achResult.value     : null;
      const studyData  = studyResult.status    === 'fulfilled' ? studyResult.value   : null;

      setEducation(eduData?.education       || []);            // Update education list
      setCourses(coursesData?.courses       || []);            // Update courses list
      setCategories(coursesData?.categories || []);            // Update category filter options
      setAchievements(achData?.achievements || []);            // Update achievements list
      setSelfStudy(studyData?.self_study    || []);            // Update self-study list
      setTypes(studyData?.types             || []);            // Update type filter options

      /* Set error only if ALL four failed */
      const allFailed = [eduResult, coursesResult, achResult, studyResult]
        .every(r => r.status === 'rejected');

      if (allFailed) {
        setError('Failed to load education data.');            // All endpoints failed
      }

      setLoading(false);                                       // Hide loader
    }

    fetchEducationData();                                      // Execute fetch

    return () => { cancelled = true; };                        // Cleanup on unmount

  }, [triggered]);                                             // Only re-run when trigger flips

  return {
    education, courses, achievements, selfStudy,               // Data arrays
    categories, types,                                         // Filter options
    loading, error, sectionRef,                                // State + ref
  };
}

export default useEducation;                                   // Default export