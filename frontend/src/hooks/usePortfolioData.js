/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Cache-first + Auto Cache Busting strategy:
 *
 *   On every load:
 *     1. Show cached data instantly (no loader)
 *     2. Fetch fresh data in background (no timeout)
 *     3. Compare versions — if changed bust cache + update UI
 *     4. If no cache exists → show loader → await Phase 1 only
 *
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import profileService                        from '../services/profileService';
import analyticsService                      from '../services/analyticsService';
import skillsService                         from '../services/skillsService';
import projectsService                       from '../services/projectsService';
import {
  CACHE_KEYS,
  saveToCache,
  loadFromCacheAny,
  isCacheStale,
} from '../utils/cache';

/** API task definitions — key maps to CACHE_KEYS */
const API_TASKS = [
  {
    key:     'profile',                              // Maps to CACHE_KEYS.profile
    label:   'Profile',                             // For console logs
    fetch:   () => profileService.getPublicProfile(), // API call
    phase:   1,                                     // Phase 1 = critical (awaited)
  },
  {
    key:     'analytics',
    label:   'Analytics',
    fetch:   () => analyticsService.getAnalytics(),
    phase:   1,                                     // Phase 1 = critical (awaited)
  },
  {
    key:     'skills',
    label:   'Skills',
    fetch:   () => skillsService.getPublicSkills(),
    phase:   2,                                     // Phase 2 = background
  },
  {
    key:     'projects',
    label:   'Projects',
    fetch:   () => projectsService.getProjects(),
    phase:   2,                                     // Phase 2 = background
  },
  {
    key:     'skillsSummary',
    label:   'Skills Summary',
    fetch:   () => skillsService.getSkillsSummary(),
    phase:   2,                                     // Phase 2 = background
  },
];

export function usePortfolioData() {

  /* ── Load ALL cached data synchronously as initial state ─────────
     Page renders immediately with cached data on reload.            */
  const [data, setData] = useState(() =>
    API_TASKS.reduce((acc, task) => {
      acc[task.key] = loadFromCacheAny(CACHE_KEYS[task.key]); // Load each from cache
      return acc;
    }, {})
  );

  /* ── Show loader only if Phase 1 cache is missing ────────────────
     If profile + analytics are both cached, skip loader entirely.   */
  const [loading, setLoading] = useState(() => {
    const phase1Tasks = API_TASKS.filter(t => t.phase === 1); // Get phase 1 tasks
    const allCached   = phase1Tasks.every(                    // Check all are cached
      t => localStorage.getItem(CACHE_KEYS[t.key]) !== null
    );
    return !allCached;                                        // True = show loader
  });

  const [error,    setError]    = useState(null);
  const [progress, setProgress] = useState(0);

  /**
   * processSingleTask — fetches one API, checks version, updates if stale.
   * Works the same for both Phase 1 and Phase 2.
   * @param {object} task       - One entry from API_TASKS
   * @param {boolean} showProgress - Whether to advance the progress dots
   */
  const processSingleTask = useCallback(async (task, showProgress = false) => {
    try {
      const freshData = await task.fetch();                   // Fetch from API

      /* Compare version with cached version */
      const stale = isCacheStale(CACHE_KEYS[task.key], freshData);

      if (stale) {
        /* Data changed — update cache and update UI */
        saveToCache(CACHE_KEYS[task.key], freshData);         // Save new version
        setData(prev => ({ ...prev, [task.key]: freshData })); // Update UI reactively
        console.log(`[Data] 🔄 ${task.label} updated — cache busted`);
      } else {
        console.log(`[Data] ✓ ${task.label} unchanged — cache valid`);
      }

    } catch (err) {
      /* API failed — keep existing cache, log warning */
      console.warn(`[Data] ✗ ${task.label} failed — keeping cache:`, err.message);
    } finally {
      if (showProgress) setProgress(prev => prev + 1);        // Advance loader dot
    }
  }, []);

  const fetchAll = useCallback(async () => {

    /* Check Phase 1 cache status */
    const phase1Tasks = API_TASKS.filter(t => t.phase === 1);
    const phase2Tasks = API_TASKS.filter(t => t.phase === 2);
    const hasPhase1Cache = phase1Tasks.every(
      t => localStorage.getItem(CACHE_KEYS[t.key]) !== null
    );

    /* Show loader only on first visit (no Phase 1 cache) */
    if (!hasPhase1Cache) {
      setLoading(true);
      setProgress(0);
    }

    setError(null);

    /* ═══════════════════════════════════════════════════
       PHASE 1 — await Phase 1 tasks sequentially
       Each one checks version and updates UI if stale.
       Loader stays visible until both finish.
    ═══════════════════════════════════════════════════ */
    await Promise.all(
      phase1Tasks.map(task =>
        processSingleTask(task, !hasPhase1Cache)               // Show progress if loading
      )
    );

    /* Check if Phase 1 produced any data at all */
    const phase1HasData = phase1Tasks.some(
      t => localStorage.getItem(CACHE_KEYS[t.key]) !== null   // Cache exists after fetch
    );

    if (!phase1HasData) {
      setError('Backend is offline');                          // Nothing cached + API failed
    }

    /* ── Release loader — page opens here ── */
    setLoading(false);

    /* ═══════════════════════════════════════════════════
       PHASE 2 — no await — runs in background
       Each task independently checks version + updates UI.
    ═══════════════════════════════════════════════════ */
    phase2Tasks.forEach(task => {
      processSingleTask(task, false);                          // Silent — no progress dots
    });

  }, [processSingleTask]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, progress, refetch: fetchAll };
}