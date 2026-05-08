/**
 * usePortfolioData.js
 * Hook مركزي يجلب كل البيانات بالتوازي مع fallback نظيف
 */
import { useState, useEffect } from 'react';
import profileService   from '../services/profileService';
import analyticsService from '../services/analyticsService';
import skillsService    from '../services/skillsService';
import projectsService  from '../services/projectsService';

/** الحالة الافتراضية — تظهر لو الـ API وقع */
const FALLBACK = {
  profile:   null,
  analytics: null,
  skills:    null,
  projects:  null,
};

export function usePortfolioData() {
  const [data,    setData]    = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);   // null = ok, string = مشكلة

  useEffect(() => {
    let cancelled = false;                          // cleanup لو الـ component اتشال

    async function fetchAll() {
      setLoading(true);
      setError(null);

      // ── نشغّل كل الطلبات بالتوازي ─────────────────────────────
      const results = await Promise.allSettled([
        profileService.getPublicProfile(),
        analyticsService.getAnalytics(),
        skillsService.getPublicSkills(),
        projectsService.getProjects(),
      ]);

      if (cancelled) return;

      // ── نفصل النجاح عن الفشل لكل طلب ─────────────────────────
      const [profileRes, analyticsRes, skillsRes, projectsRes] = results;

      const newData = {
        profile:   profileRes.status   === 'fulfilled' ? profileRes.value   : null,
        analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
        skills:    skillsRes.status    === 'fulfilled' ? skillsRes.value    : null,
        projects:  projectsRes.status  === 'fulfilled' ? projectsRes.value  : null,
      };

      // ── لو كل شيء فشل → error state ──────────────────────────
      const allFailed = Object.values(newData).every(v => v === null);
      if (allFailed) {
        const firstError = results.find(r => r.status === 'rejected');
        setError(
          firstError?.reason?.isNetworkError
            ? 'Backend is offline. Showing demo data.'
            : 'Failed to load portfolio data.'
        );
      }

      setData(newData);
      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };             // cleanup
  }, []);

  return { data, loading, error };
}