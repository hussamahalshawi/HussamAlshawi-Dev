/**
 * useProjects.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching projects data.
 * Use in ProjectsSection and any component that needs
 * the full projects list with optional type filtering.
 *
 * Supports:
 *   - Fetching all projects (no params)
 *   - Filtering by type: useProjects({ type: 'Web' })
 *   - Limiting results: useProjects({ limit: 6 })
 *
 * Usage:
 *   const { projects, count, types, loading, error } = useProjects();
 *   const { projects } = useProjects({ type: 'Mobile', limit: 3 });
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';               // React hooks
import projectsService          from '../services/projectsService'; // Projects API calls

/**
 * useProjects — fetches all projects with optional query filters.
 *
 * @param {object} [params={}]          - Optional query parameters
 * @param {string} [params.type]        - Filter by project type (e.g. 'Web', 'Mobile')
 * @param {number} [params.limit]       - Max number of projects to return
 *
 * @returns {{
 *   projects: Array,   - Flat array of project objects
 *   count:    number,  - Total count of returned projects
 *   types:    Array,   - All available project type strings
 *   loading:  boolean, - True while fetching
 *   error:    string|null, - Error message or null
 *   refetch:  Function - Call to manually re-fetch
 * }}
 */
export function useProjects(params = {}) {

  const [projects, setProjects] = useState([]);   // Flat projects array from API
  const [count,    setCount]    = useState(0);    // Total count from API response
  const [types,    setTypes]    = useState([]);   // Available type strings for filters
  const [loading,  setLoading]  = useState(true); // True while request is in-flight
  const [error,    setError]    = useState(null); // Error message string or null

  /**
   * fetchProjects — core fetching function.
   * Extracted so refetch() can call it directly.
   */
  async function fetchProjects() {
    setLoading(true);                              // Show loading state
    setError(null);                               // Clear any previous error

    try {
      /* Fire GET /portfolio/projects with optional query params */
      const data = await projectsService.getProjects(params);

      /* Safely extract fields — API returns { count, types, projects } */
      setProjects(data?.projects || []);           // Set projects array
      setCount(data?.count       || 0);            // Set total count
      setTypes(data?.types       || []);           // Set available type filters
    } catch (err) {
      /* Set error message — use API message or generic fallback */
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);                           // Always hide loader
    }
  }

  /* Run on mount and whenever params change */
  useEffect(() => {
    let cancelled = false;                         // Prevent stale state updates

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await projectsService.getProjects(params);

        /* Only update state if component is still mounted */
        if (!cancelled) {
          setProjects(data?.projects || []);       // Update projects list
          setCount(data?.count       || 0);        // Update count
          setTypes(data?.types       || []);       // Update type options
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load projects.'); // Set error
        }
      } finally {
        if (!cancelled) setLoading(false);         // Hide loader
      }
    }

    run();                                         // Execute fetch on mount

    /* Cleanup: cancel state updates if component unmounts */
    return () => { cancelled = true; };
  }, [
    params.type,   // Re-fetch when type filter changes
    params.limit,  // Re-fetch when limit changes
  ]);

  return {
    projects,        // Array of project objects
    count,           // Total number of projects
    types,           // Available type filter options
    loading,         // Boolean loading state
    error,           // Error string or null
    refetch: fetchProjects, // Manual refresh function
  };
}

export default useProjects;    // Default export for convenient importing