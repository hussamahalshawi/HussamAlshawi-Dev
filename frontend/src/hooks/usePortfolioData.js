/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Cache-first + Auto Cache Busting + Background Polling:
 *
 *   On load:
 *     1. Show cache instantly
 *     2. Phase 1 await → hide loader
 *     3. Phase 2 background fetch
 *
 *   After load (polling):
 *     Every 20s → fetch all APIs silently
 *     If hash changed → bust cache → update UI automatically
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import profileService                        from '../services/profileService';
import analyticsService                      from '../services/analyticsService';
import skillsService                         from '../services/skillsService';
import projectsService                       from '../services/projectsService';
import languagesService                      from '../services/languagesService'; // Languages API
import {
  CACHE_KEYS,
  saveToCache,
  loadFromCacheAny,
  isCacheStale,
} from '../utils/cache';

/* ── Polling interval — how often to check for changes ──────────── */
const POLL_INTERVAL_MS = 20_000; // 20 seconds — adjust as needed

/** API task definitions */
const API_TASKS = [
  {
    key:   'profile',
    label: 'Profile',
    fetch: () => profileService.getPublicProfile(),
    phase: 1,
  },
  {
    key:   'analytics',
    label: 'Analytics',
    fetch: async () => {
      const [counts, skills, progress] = await Promise.all([
        analyticsService.getAnalyticsCounts(),
        analyticsService.getAnalyticsSkills(),
        analyticsService.getAnalyticsProgress(),
      ]);
      return { ...counts, ...skills, ...progress };
    },
    phase: 2,
  },
  {
    key:   'skills',
    label: 'Skills',
    fetch: () => skillsService.getPublicSkills(),
    phase: 2,
  },
  {
    key:   'projects',
    label: 'Projects',
    fetch: () => projectsService.getProjects(),
    phase: 2,
  },
  {
    key:   'skillsSummary',
    label: 'Skills Summary',
    fetch: () => skillsService.getSkillsSummary(),
    phase: 2,
  },
  {
    key:   'languages',
    label: 'Languages',
    fetch: () => languagesService.getLanguages(),
    phase: 2,
  },
];

export function usePortfolioData() {

  /* ── Load ALL cached data synchronously as initial state ─────── */
  const [data, setData] = useState(() =>
    API_TASKS.reduce((acc, task) => {
      acc[task.key] = loadFromCacheAny(CACHE_KEYS[task.key]) ?? null;
      return acc;
    }, {})
  );

  /* ── Show loader only if Phase 1 cache is missing ────────────── */
  const [loading, setLoading] = useState(() => {
    const phase1Tasks = API_TASKS.filter(t => t.phase === 1);
    const allCached   = phase1Tasks.every(t => {
      const cached = loadFromCacheAny(CACHE_KEYS[t.key]);
      return cached !== null;
    });
    return !allCached;
  });

  const [error,    setError]    = useState(null);
  const [progress, setProgress] = useState(0);

  /* ── Ref to hold the polling timer ──────────────────────────── */
  const pollTimerRef = useRef(null);                             // Stores setInterval ID

  /* ── Ref to prevent overlapping poll calls ───────────────────── */
  const isPollingRef = useRef(false);                            // True while poll runs

  /**
   * processSingleTask — fetches one API and updates UI if data changed.
   * @param {object}  task         - One entry from API_TASKS
   * @param {boolean} showProgress - Whether to advance progress dots
   */
  const processSingleTask = useCallback(async (task, showProgress = false) => {
    try {
      const freshData = await task.fetch();                      // Call the API

      const stale = isCacheStale(CACHE_KEYS[task.key], freshData); // Compare hash

      if (stale) {
        saveToCache(CACHE_KEYS[task.key], freshData);            // Update cache
        setData(prev => ({ ...prev, [task.key]: freshData }));   // Update UI
        console.log(`[Data] 🔄 ${task.label} changed — UI updated`);
      } else {
        console.log(`[Data] ✓ ${task.label} unchanged`);
      }

    } catch (err) {
      console.warn(`[Data] ✗ ${task.label} failed:`, err.message);
    } finally {
      if (showProgress) setProgress(prev => prev + 1);           // Advance loader dot
    }
  }, []);

  /**
   * pollForChanges — silently checks all APIs for changes.
   * Runs on interval after initial load completes.
   * Skips if a poll is already in progress.
   */
  const pollForChanges = useCallback(async () => {
    if (isPollingRef.current) return;                            // Skip overlapping polls
    isPollingRef.current = true;                                 // Lock

    console.log('[Poll] 🔍 Checking for data changes...');

    /* Check all APIs silently — one timeout won't block future polls */
    await Promise.allSettled(
      API_TASKS.map(task => processSingleTask(task, false))      // Silent for all
    );

    isPollingRef.current = false;                                // Unlock
  }, [processSingleTask]);

  /**
   * fetchAll — initial load with loader for Phase 1.
   * Phase 2 runs in background after loader hides.
   */
  const fetchAll = useCallback(async () => {
    const phase1Tasks = API_TASKS.filter(t => t.phase === 1);
    const phase2Tasks = API_TASKS.filter(t => t.phase === 2);

    const hasPhase1Cache = phase1Tasks.every(
      t => localStorage.getItem(CACHE_KEYS[t.key]) !== null
    );

    if (!hasPhase1Cache) {
      setLoading(true);
      setProgress(0);
    }

    setError(null);

    /* ── PHASE 1: await both critical APIs ── */
    await Promise.all(
      phase1Tasks.map(task => processSingleTask(task, !hasPhase1Cache))
    );

    /* Check if anything loaded at all */
    const hasAnyData = phase1Tasks.some(
      t => localStorage.getItem(CACHE_KEYS[t.key]) !== null
    );

    if (!hasAnyData) {
      setError('Backend is offline');
    }

    setLoading(false);                                           // Page opens here

    /* ── PHASE 2: background, no await ── */
    phase2Tasks.forEach(task => processSingleTask(task, false));

  }, [processSingleTask]);

  /* ── Start polling after initial load ───────────────────────── */
  useEffect(() => {
    fetchAll().then(() => {

      /* Clear any existing timer before starting new one */
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      /* Start polling every POLL_INTERVAL_MS */
      pollTimerRef.current = setInterval(() => {
        pollForChanges();                                        // Silent background check
      }, POLL_INTERVAL_MS);

      console.log(`[Poll] ✓ Started — checking every ${POLL_INTERVAL_MS / 1000}s`);
    });

    /* Cleanup: stop polling when component unmounts */
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);                     // Stop the interval
        console.log('[Poll] ✗ Stopped — component unmounted');
      }
    };
  }, [fetchAll, pollForChanges]);

  return { data, loading, error, progress, refetch: fetchAll };
}