/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Cache-first + Priority Loading:
 *   Phase 1: Profile + Analytics → await → hide loader → save cache
 *   Phase 2: Skills + Projects + Summary → no await → save cache silently
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
} from '../utils/cache';

/** Default empty state */
const INITIAL_STATE = {
  profile:       null,
  analytics:     null,
  skills:        null,
  projects:      null,
  skillsSummary: null,
};

export function usePortfolioData() {

  /* ── Load ALL cached data as initial state synchronously ─────────
     Every key loads from cache instantly before first render.
     Phase 2 sections show cached data immediately on reload.        */
  const [data, setData] = useState(() => ({
    profile:       loadFromCacheAny(CACHE_KEYS.profile),
    analytics:     loadFromCacheAny(CACHE_KEYS.analytics),
    skills:        loadFromCacheAny(CACHE_KEYS.skills),
    projects:      loadFromCacheAny(CACHE_KEYS.projects),
    skillsSummary: loadFromCacheAny(CACHE_KEYS.skillsSummary),
  }));

  /* ── Show loader only if Phase 1 cache is missing ────────────────
     If profile + analytics are cached, skip the loader entirely.    */
  const [loading, setLoading] = useState(() => {
    const hasPhase1Cache =
      localStorage.getItem(CACHE_KEYS.profile)   !== null &&  // Profile cached
      localStorage.getItem(CACHE_KEYS.analytics) !== null;    // Analytics cached
    return !hasPhase1Cache;                                    // false = skip loader
  });

  const [error,    setError]    = useState(null);
  const [progress, setProgress] = useState(0);

  const fetchAll = useCallback(async () => {

    /* Check if Phase 1 is already cached — determines loader visibility */
    const hasPhase1Cache =
      localStorage.getItem(CACHE_KEYS.profile)   !== null &&
      localStorage.getItem(CACHE_KEYS.analytics) !== null;

    if (!hasPhase1Cache) {
      setLoading(true);                                        // Show loader first visit
      setProgress(0);                                          // Reset progress dots
    }

    setError(null);

    /* ═══════════════════════════════════════════════════
       PHASE 1 — await these two before opening the page
       Profile + Analytics = enough for OverviewSection
    ═══════════════════════════════════════════════════ */
    const phase1Tasks = [
      profileService.getPublicProfile(),                       // Critical task 0
      analyticsService.getAnalytics(),                         // Critical task 1
    ];

    /* Advance progress dots in real time */
    phase1Tasks.forEach((task, i) => {
      const names = ['Profile', 'Analytics'];
      task.finally(() => {
        console.log(`[Phase 1] ✓ ${names[i]} loaded`);
        if (!hasPhase1Cache) setProgress(prev => prev + 1);   // Only if loader visible
      });
    });

    /* ── AWAIT Phase 1 — page stays on loader until here ── */
    const [profileRes, analyticsRes] = await Promise.allSettled(phase1Tasks);

    /* Save Phase 1 to cache or fall back to existing cache */
    const phase1Data = {
      profile: profileRes.status === 'fulfilled'
        ? (saveToCache(CACHE_KEYS.profile, profileRes.value), profileRes.value)
        : loadFromCacheAny(CACHE_KEYS.profile),                // Use cache if API failed

      analytics: analyticsRes.status === 'fulfilled'
        ? (saveToCache(CACHE_KEYS.analytics, analyticsRes.value), analyticsRes.value)
        : loadFromCacheAny(CACHE_KEYS.analytics),              // Use cache if API failed
    };

    /* Show error only if Phase 1 has no data at all — no API + no cache */
    const phase1Failed = !phase1Data.profile && !phase1Data.analytics;
    if (phase1Failed) {
      const isOffline = [profileRes, analyticsRes]
        .find(r => r.status === 'rejected')?.reason?.isNetworkError;
      setError(isOffline ? 'Backend is offline' : 'Failed to load portfolio data');
    }

    /* Update state with Phase 1 data and open the page */
    setData(prev => ({ ...prev, ...phase1Data }));
    setLoading(false);                                         // ← Page opens HERE

    /* ═══════════════════════════════════════════════════
       PHASE 2 — NO await — runs silently after page opens
       Skills + Projects + Summary load in the background
    ═══════════════════════════════════════════════════ */
    Promise.allSettled([
      skillsService.getPublicSkills(),                         // Background task 0
      projectsService.getProjects(),                           // Background task 1
      skillsService.getSkillsSummary(),                        // Background task 2
    ]).then(([skillsRes, projectsRes, summaryRes]) => {

      const phase2Data = {
        skills: skillsRes.status === 'fulfilled'
          ? (saveToCache(CACHE_KEYS.skills, skillsRes.value), skillsRes.value)
          : loadFromCacheAny(CACHE_KEYS.skills),               // Use cache if failed

        projects: projectsRes.status === 'fulfilled'
          ? (saveToCache(CACHE_KEYS.projects, projectsRes.value), projectsRes.value)
          : loadFromCacheAny(CACHE_KEYS.projects),             // Use cache if failed

        skillsSummary: summaryRes.status === 'fulfilled'
          ? (saveToCache(CACHE_KEYS.skillsSummary, summaryRes.value), summaryRes.value)
          : loadFromCacheAny(CACHE_KEYS.skillsSummary),        // Use cache if failed
      };

      console.log('[Phase 2] ✓ Background data loaded');
      setData(prev => ({ ...prev, ...phase2Data }));           // Merge into existing state
    });
    /* No catch — allSettled never rejects */

  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, progress, refetch: fetchAll };
}