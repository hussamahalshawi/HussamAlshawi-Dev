import { useState, useEffect, useRef } from 'react';
import chartsService from '../services/chartsService';
import { useIntersectionLoader } from '../services/useIntersectionLoader';
import { CACHE_KEYS, saveToCache, loadFromCacheAny, isCacheStale } from '../utils/cache';

const CHART_LOADERS = {
  skills  : () => chartsService.composite.allSkillsCharts(),
  career  : () => chartsService.composite.allCareerCharts(),
  learning: () => chartsService.composite.allLearningCharts(),
  goals   : () => chartsService.composite.allGoalsCharts(),
};

const CHART_CACHE_KEYS = {
  skills  : CACHE_KEYS.skillsCharts,
  career  : CACHE_KEYS.careerCharts,
  learning: CACHE_KEYS.learningCharts,
  goals   : CACHE_KEYS.goalsCharts,
};

export function useCharts(group, externalRef = null) {
  if (!CHART_LOADERS[group]) {
    if (import.meta.env.DEV) console.warn(`[useCharts] Unknown group: "${group}". Use: skills | career | learning | goals`);
  }

  const internalRef = useRef(null);
  const sectionRef  = externalRef || internalRef;
  const triggered   = useIntersectionLoader(sectionRef, 0.05);
  const cacheKey    = CHART_CACHE_KEYS[group];

  const [data,    setData]    = useState(() => loadFromCacheAny(cacheKey));
  const [loading, setLoading] = useState(() => localStorage.getItem(cacheKey) === null);
  const [error,   setError]   = useState(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!triggered || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loader = CHART_LOADERS[group];
    if (!loader) return;

    let cancelled = false;

    async function fetchCharts() {
      if (localStorage.getItem(cacheKey) === null) {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await loader();

        if (!cancelled) {
          const stale = isCacheStale(cacheKey, result);
          if (stale) {
            saveToCache(cacheKey, result);
            setData(result);
          }

          const allNull = Object.values(result).every(v => v === null);
          if (allNull) setError(`Failed to load ${group} charts.`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || `Failed to load ${group} charts.`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCharts();

    return () => { cancelled = true; };
  }, [triggered, group, cacheKey]);

  return { data, loading, error, sectionRef };
}

export default useCharts;
