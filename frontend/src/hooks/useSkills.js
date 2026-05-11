/**
 * useSkills.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching skills data.
 * Use in SkillsSection and chart components.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import skillsService           from '../services/skillsService';    // Skills API calls

/**
 * @returns {{ skills, loading, error }}
 * skills shape: { count, skills[], grouped{}, categories[] }
 */
export function useSkills() {
  const [skills,  setSkills]  = useState(null);   // Full skills response
  const [loading, setLoading] = useState(true);   // Fetching state
  const [error,   setError]   = useState(null);   // Error message or null

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const data = await skillsService.getPublicSkills();   // GET /portfolio/skills
        if (!cancelled) setSkills(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load skills.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { skills, loading, error };
}