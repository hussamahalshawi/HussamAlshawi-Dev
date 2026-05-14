/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Cache-first loading strategy:
 *   1. Load cached data instantly → no loader if cache exists
 *   2. Always fetch fresh data in background
 *   3. Update state when fresh data arrives
 *   4. Save every successful response to cache
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';           // React hooks
import profileService                        from '../services/profileService';
import analyticsService                      from '../services/analyticsService';
import skillsService                         from '../services/skillsService';
import projectsService                       from '../services/projectsService';
import {
  CACHE_KEYS,
  saveToCache,
  loadFromCacheAny,                                                  // Ignore expiry — show stale
} from '../utils/cache';                                             // Cache utility

/** Default empty state */
const INITIAL_STATE = {
  profile:       null,
  analytics:     null,
  skills:        null,
  projects:      null,
  skillsSummary: null,
};

/**
 * usePortfolioData — cache-first strategy with background refresh.
 * @returns {{ data, loading, error, progress, refetch }}
 */
export function usePortfolioData() {

  /* ── Load cached data as initial state ──────────────────────────── */
  /* This runs synchronously before first render — no flicker */
  const [data, setData] = useState(() => ({
    profile:       loadFromCacheAny(CACHE_KEYS.profile),       // Instant from cache
    analytics:     loadFromCacheAny(CACHE_KEYS.analytics),     // Instant from cache
    skills:        loadFromCacheAny(CACHE_KEYS.skills),        // Instant from cache
    projects:      loadFromCacheAny(CACHE_KEYS.projects),      // Instant from cache
    skillsSummary: loadFromCacheAny(CACHE_KEYS.skillsSummary), // Instant from cache
  }));

  /* ── Loading is false immediately if ANY cache exists ───────────── */
  const [loading,  setLoading]  = useState(() => {
    const hasAnyCache = Object.values(CACHE_KEYS).some(          // Check all keys
      key => localStorage.getItem(key) !== null                  // True if key exists
    );
    return !hasAnyCache;                                         // False = skip loader
  });

  const [error,    setError]    = useState(null);                // Global error
  const [progress, setProgress] = useState(0);                   // Loader progress 0→5

  const fetchAll = useCallback(async () => {

    /* Only show loader if there is NO cache at all */
    const hasAnyCache = Object.values(CACHE_KEYS).some(
      key => localStorage.getItem(key) !== null
    );

    if (!hasAnyCache) {
      setLoading(true);                                          // First ever visit
      setProgress(0);                                            // Reset dots
    }

    setError(null);                                              // Always clear errors

    /* Define all 5 tasks */
    const tasks = [
      profileService.getPublicProfile(),    // Task 0: Profile
      analyticsService.getAnalytics(),      // Task 1: Analytics
      skillsService.getPublicSkills(),      // Task 2: Skills
      projectsService.getProjects(),        // Task 3: Projects
      skillsService.getSkillsSummary(),     // Task 4: Summary
    ];

    const taskNames = ['Profile', 'Analytics', 'Skills', 'Projects', 'Summary'];

    /* Advance progress only when loader is visible */
    tasks.forEach((task, index) => {
      task.finally(() => {
        console.log(`[Loader] ✓ ${taskNames[index]} loaded`);   // Dev feedback
        if (!hasAnyCache) setProgress(prev => prev + 1);        // Dots only if loading
      });
    });

    /* Wait for ALL APIs */
    const [profileRes, analyticsRes, skillsRes, projectsRes, summaryRes] =
      await Promise.allSettled(tasks);

    /* ── Process each result — save to cache if successful ─────────── */
    const newData = {};                                          // Build fresh data object

    if (profileRes.status === 'fulfilled') {
      newData.profile = profileRes.value;                       // Use fresh data
      saveToCache(CACHE_KEYS.profile, profileRes.value);        // Save to cache
    } else {
      newData.profile = loadFromCacheAny(CACHE_KEYS.profile);   // Fall back to cache
      console.warn('[Data] Profile failed — using cached version');
    }

    if (analyticsRes.status === 'fulfilled') {
      newData.analytics = analyticsRes.value;
      saveToCache(CACHE_KEYS.analytics, analyticsRes.value);
    } else {
      newData.analytics = loadFromCacheAny(CACHE_KEYS.analytics);
      console.warn('[Data] Analytics failed — using cached version');
    }

    if (skillsRes.status === 'fulfilled') {
      newData.skills = skillsRes.value;
      saveToCache(CACHE_KEYS.skills, skillsRes.value);
    } else {
      newData.skills = loadFromCacheAny(CACHE_KEYS.skills);
      console.warn('[Data] Skills failed — using cached version');
    }

    if (projectsRes.status === 'fulfilled') {
      newData.projects = projectsRes.value;
      saveToCache(CACHE_KEYS.projects, projectsRes.value);
    } else {
      newData.projects = loadFromCacheAny(CACHE_KEYS.projects);
      console.warn('[Data] Projects failed — using cached version');
    }

    if (summaryRes.status === 'fulfilled') {
      newData.skillsSummary = summaryRes.value;
      saveToCache(CACHE_KEYS.skillsSummary, summaryRes.value);
    } else {
      newData.skillsSummary = loadFromCacheAny(CACHE_KEYS.skillsSummary);
      console.warn('[Data] Summary failed — using cached version');
    }

    /* ── Check if everything is null (no cache + all APIs failed) ─── */
    const allFailed = Object.values(newData).every(v => v === null);
    if (allFailed) {
      const firstRejection = [profileRes, analyticsRes, skillsRes, projectsRes, summaryRes]
        .find(r => r.status === 'rejected');
      const isOffline = firstRejection?.reason?.isNetworkError;
      setError(isOffline ? 'Backend is offline' : 'Failed to load portfolio data');
    }

    setData(newData);    // Update UI with fresh or fallback data
    setLoading(false);   // Hide loader regardless
  }, []);

  useEffect(() => {
    fetchAll();          // Run on mount
  }, [fetchAll]);

  return { data, loading, error, progress, refetch: fetchAll };
}