/**
 * useAchievements.js
 * ─────────────────────────────────────────────────────────
 * Lazy-loading hook for achievements data.
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import achievementsService from '../services/achievementsService';
import { useIntersectionLoader } from '../services/useIntersectionLoader';

export function useAchievements(externalRef = null) {
  const internalRef = useRef(null);
  const sectionRef  = externalRef || internalRef;
  const triggered   = useIntersectionLoader(sectionRef);

  const [achievements, setAchievements] = useState([]);
  const [count,        setCount]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!triggered) return;
    let cancelled = false;

    async function fetchAchievements() {
      setLoading(true);
      setError(null);
      try {
        const data = await achievementsService.getAchievements();
        if (!cancelled) {
          setAchievements(data?.achievements || []);
          setCount(data?.count || 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load achievements.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAchievements();
    return () => { cancelled = true; };
  }, [triggered]);

  return { achievements, count, loading, error, sectionRef };
}

export default useAchievements;
