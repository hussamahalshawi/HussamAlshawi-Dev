/**
 * usePortfolioData.js
 * ─────────────────────────────────────────────────────────
 * Cache-first + Auto Cache Busting + Background Polling:
 *
 *   On load:
 *     1. Show cache instantly
 *     2. Phase 1 await (profile only) → hide loader
 *     3. Phase 2 background fetch (all other sections in parallel)
 *
 *   After load (polling):
 *     Every 5min → fetch all APIs silently
 *     If hash changed → bust cache → update UI automatically
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import profileService                        from '../services/profileService';
import analyticsService                      from '../services/analyticsService';
import skillsService                         from '../services/skillsService';
import projectsService                       from '../services/projectsService';
import languagesService                      from '../services/languagesService';
import experienceService                     from '../services/experienceService';
import achievementsService                   from '../services/achievementsService';
import chartsService                         from '../services/chartsService';
import educationService                      from '../services/educationService';
import goalsService                          from '../services/goalsService';
import feedbackService                       from '../services/feedbackService';
import {
  CACHE_KEYS,
  saveToCache,
  loadFromCacheAny,
  isCacheStale,
} from '../utils/cache';

const IS_DEV = import.meta.env.DEV;

/* ── Polling interval — how often to check for changes ──────────── */
const POLL_INTERVAL_MS = 300_000; // 5 minutes — portfolio data rarely changes

/**
 * API task definitions.
 * Phase 1 = loaded BEFORE the page opens (blocking).
 * Phase 2 = loaded in background AFTER the page opens (non-blocking).
 */
const API_TASKS = [
  /* ═══════ PHASE 1 — Critical: page won't open until these are ready ═══════ */
  {
    key:   'profile',
    label: 'Profile',
    fetch: () => profileService.getPublicProfile(),
    phase: 1,
  },

  /* ═══════ PHASE 2 — Background: loads after page opens ═══════ */
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
  {
    key:   'portfolioSummary',
    label: 'Portfolio Summary',
    fetch: () => analyticsService.getPortfolioSummary(),
    phase: 2,
  },
  {
    key:   'skillsCharts',
    label: 'Skills Charts',
    fetch: () => chartsService.composite.allSkillsCharts(),
    phase: 2,
  },
  {
    key:   'goalsCharts',
    label: 'Goals Charts',
    fetch: () => chartsService.composite.allGoalsCharts(),
    phase: 2,
  },
  {
    key:   'experience',
    label: 'Experience',
    fetch: () => experienceService.getExperience(),
    phase: 2,
  },
  {
    key:   'achievements',
    label: 'Achievements',
    fetch: () => achievementsService.getAchievements(),
    phase: 2,
  },
  {
    key:   'careerCharts',
    label: 'Career Charts',
    fetch: () => chartsService.composite.allCareerCharts(),
    phase: 2,
  },
  {
    key:   'education',
    label: 'Education',
    fetch: () => educationService.getEducation(),
    phase: 2,
  },
  {
    key:   'courses',
    label: 'Courses',
    fetch: () => educationService.getCourses(),
    phase: 2,
  },
  {
    key:   'selfStudy',
    label: 'Self Study',
    fetch: () => educationService.getSelfStudy(),
    phase: 2,
  },
  {
    key:   'goals',
    label: 'Goals',
    fetch: () => goalsService.getPublicGoals(),
    phase: 2,
  },
  {
    key:   'goalsStats',
    label: 'Goals Stats',
    fetch: () => goalsService.getGoalsStats(),
    phase: 2,
  },
  {
    key:   'feedback',
    label: 'Feedback',
    fetch: () => feedbackService.getFeaturedTestimonials(),
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
  const pollTimerRef = useRef(null);

  /* ── Ref to prevent overlapping poll calls ───────────────────── */
  const isPollingRef = useRef(false);

  /**
   * processSingleTask — fetches one API and updates UI if data changed.
   * @param {object}  task         - One entry from API_TASKS
   * @param {boolean} showProgress - Whether to advance progress dots
   */
  const processSingleTask = useCallback(async (task, showProgress = false) => {
    try {
      const freshData = await task.fetch();

      const stale = isCacheStale(CACHE_KEYS[task.key], freshData);

      if (stale) {
        saveToCache(CACHE_KEYS[task.key], freshData);
        setData(prev => ({ ...prev, [task.key]: freshData }));
        if (IS_DEV) console.log(`[Data] ${task.label} changed — UI updated`);
      } else {
        if (IS_DEV) console.log(`[Data] ${task.label} unchanged`);
      }

    } catch (err) {
      if (IS_DEV) console.warn(`[Data] ${task.label} failed:`, err.message);
    } finally {
      if (showProgress) setProgress(prev => prev + 1);
    }
  }, []);

  /**
   * pollForChanges — silently checks all APIs for changes.
   * Runs on interval after initial load completes.
   */
  const pollForChanges = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    if (IS_DEV) console.log('[Poll] Checking for data changes...');

    await Promise.allSettled(
      API_TASKS.map(task => processSingleTask(task, false))
    );

    isPollingRef.current = false;
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

    /* ── PHASE 1: await profile only — page opens fast ── */
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

    setLoading(false);  // ← Page opens here — profile ready, charts load in parallel

    /* ── PHASE 2: ALL data in parallel — no await ── */
    phase2Tasks.forEach(task => processSingleTask(task, false));

  }, [processSingleTask]);

  /* ── Start polling after initial load ───────────────────────── */
  useEffect(() => {
    fetchAll().then(() => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      pollTimerRef.current = setInterval(() => {
        pollForChanges();
      }, POLL_INTERVAL_MS);

      if (IS_DEV) console.log(`[Poll] Started — checking every ${POLL_INTERVAL_MS / 1000}s`);
    });

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        if (IS_DEV) console.log('[Poll] Stopped — component unmounted');
      }
    };
  }, [fetchAll, pollForChanges]);

  return { data, loading, error, progress, refetch: fetchAll };
}
