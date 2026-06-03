import { useState, useEffect, useCallback, useRef } from 'react';
import analyticsService from '../services/analyticsService';
import {
  CACHE_KEYS,
  saveToCache,
  loadFromCacheAny,
  isCacheStale,
} from '../utils/cache';

const POLL_INTERVAL_MS = 20_000;

export function usePortfolio() {
  const [portfolioData, setPortfolioData] = useState(() => {
    const cached = loadFromCacheAny(CACHE_KEYS.portfolio);
    const valid = !!(cached && (
      Array.isArray(cached.skills_with_sources) ||
      Array.isArray(cached.goals) ||
      Array.isArray(cached.skills_by_type)
    ));
    console.log('[usePortfolio] Init:', { hasCached: !!cached, valid });
    return valid ? cached : null;
  });
  const [loading, setLoading] = useState(() => {
    const cached = loadFromCacheAny(CACHE_KEYS.portfolio);
    const valid = !!(cached && (
      Array.isArray(cached.skills_with_sources) ||
      Array.isArray(cached.goals) ||
      Array.isArray(cached.skills_by_type)
    ));
    return !valid;
  });
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);

  const checkForUpdates = useCallback(async () => {
    try {
      console.log('[Portfolio] Fetching split endpoints...');
      const [skills, goals, timeline, sources] = await Promise.all([
        analyticsService.getPortfolioSkills(),
        analyticsService.getPortfolioGoals(),
        analyticsService.getPortfolioTimeline(),
        analyticsService.getPortfolioSources(),
      ]);
      const freshData = { ...skills, ...goals, ...timeline, ...sources };
      console.log('[Portfolio] ✓ Received data:', freshData ? 'ok' : 'empty');
      const stale = isCacheStale(CACHE_KEYS.portfolio, freshData);
      if (stale) {
        saveToCache(CACHE_KEYS.portfolio, freshData);
        setPortfolioData(freshData);
      }
    } catch (err) {
      console.warn('[Portfolio] ✗ API failed:', err.message || err);
      const hasCache = localStorage.getItem(CACHE_KEYS.portfolio) !== null;
      if (!hasCache) {
        setError(err.message || 'Unknown error');
        setPortfolioData(null);
      }
    }
  }, []);

  useEffect(() => {
    const hasCache = localStorage.getItem(CACHE_KEYS.portfolio) !== null;

    if (!hasCache) {
      setLoading(true);
      setError(null);
    }

    checkForUpdates().then(() => {
      if (!hasCache) setLoading(false);
    });

    pollTimerRef.current = setInterval(() => {
      checkForUpdates();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkForUpdates]);

  return { portfolioData, loading, error };
}
