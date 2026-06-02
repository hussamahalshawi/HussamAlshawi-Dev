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
  const [portfolioData, setPortfolioData] = useState(() =>
    loadFromCacheAny(CACHE_KEYS.portfolio)
  );
  const [loading, setLoading] = useState(() =>
    localStorage.getItem(CACHE_KEYS.portfolio) === null
  );
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);

  const checkForUpdates = useCallback(async () => {
    try {
      console.log('[Portfolio] Fetching /charts/portfolio/summary...');
      const freshData = await analyticsService.getPortfolioSummary();
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
