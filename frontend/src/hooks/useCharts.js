/**
 * useCharts.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for chart data grouped by section.
 * Each chart group fires only when its section enters the viewport.
 * Uses Promise.allSettled so one failing chart never blocks others.
 *
 * Usage:
 *   const { data, loading, error, sectionRef } = useCharts('skills');
 *   // groups: 'skills' | 'career' | 'learning' | 'goals'
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';              // React primitives
import chartsService                   from '../services/chartsService'; // Charts API calls
import { useIntersectionLoader }       from './useIntersectionLoader';   // Shared observer hook

/* ── Chart group → composite loader map ─────────────────────────── */
/* Maps group name to the correct composite loader in chartsService  */
const CHART_LOADERS = {
  skills  : () => chartsService.composite.allSkillsCharts(),   // radar, distribution, topBars, heatmap, sources
  career  : () => chartsService.composite.allCareerCharts(),   // gantt, employmentMix, treemap, heatmap, stack, achievements
  learning: () => chartsService.composite.allLearningCharts(), // coursesByYear, providers, wordCloud, types, tracks, vsOutput
  goals   : () => chartsService.composite.allGoalsCharts(),    // gauge, statusDonut, priorityDonut, yearProgress, skillGap, roadmap
};

/**
 * useCharts — lazy loads a group of charts when the section enters the viewport.
 *
 * @param {'skills'|'career'|'learning'|'goals'} group - Chart group to load
 * @param {React.RefObject} [externalRef]               - Optional external ref
 *
 * @returns {{
 *   data:       object|null,  - All chart data for the group (null until loaded)
 *   loading:    boolean,      - True while fetching
 *   error:      string|null,  - Error message if all charts failed
 *   sectionRef: React.RefObject
 * }}
 */
export function useCharts(group, externalRef = null) {

  /* ── Validate group ── */
  if (!CHART_LOADERS[group]) {
    console.warn(`[useCharts] Unknown group: "${group}". Use: skills | career | learning | goals`);
  }

  /* ── Ref management ── */
  const internalRef = useRef(null);                            // Fallback ref
  const sectionRef  = externalRef || internalRef;              // Prefer external

  /* ── Intersection trigger ── */
  const triggered = useIntersectionLoader(sectionRef, 0.05);  // Lower threshold for chart sections

  /* ── Data state ── */
  const [data,    setData]    = useState(null);                // All chart data for the group
  const [loading, setLoading] = useState(false);              // True while fetching
  const [error,   setError]   = useState(null);               // Error if all charts failed

  /* ── Fetch chart group when triggered ── */
  useEffect(() => {
    if (!triggered) return;                                    // Wait until visible

    const loader = CHART_LOADERS[group];                       // Get the correct loader
    if (!loader) return;                                       // Guard: unknown group

    let cancelled = false;

    async function fetchCharts() {
      setLoading(true);                                        // Show loading state
      setError(null);                                          // Clear previous errors

      try {
        /* Call the composite loader — returns partial data even on partial failure */
        const result = await loader();

        if (!cancelled) {
          setData(result);                                     // Update chart data object

          /* Check if every chart in the group failed (all null) */
          const allNull = Object.values(result).every(v => v === null);
          if (allNull) setError(`Failed to load ${group} charts.`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || `Failed to load ${group} charts.`);
        }
      } finally {
        if (!cancelled) setLoading(false);                     // Always hide loader
      }
    }

    fetchCharts();                                             // Execute

    return () => { cancelled = true; };                        // Cleanup

  }, [triggered, group]);                                      // Re-run if group changes

  return { data, loading, error, sectionRef };
}

export default useCharts;                                      // Default export