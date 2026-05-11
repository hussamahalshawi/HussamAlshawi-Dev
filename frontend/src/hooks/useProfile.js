/**
 * useProfile.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching only the profile data.
 * Use this in components that ONLY need profile info
 * (e.g. Navbar avatar, ContactSection).
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import profileService          from '../services/profileService';   // Profile API calls

/**
 * @returns {{ profile, loading, error }}
 */
export function useProfile() {
  const [profile, setProfile] = useState(null);   // Profile object from API
  const [loading, setLoading] = useState(true);   // Fetching state
  const [error,   setError]   = useState(null);   // Error message or null

  useEffect(() => {
    let cancelled = false;                         // Prevent state update after unmount

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const data = await profileService.getPublicProfile(); // GET /portfolio/profile
        if (!cancelled) setProfile(data);                     // Only set if still mounted
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load profile.'); // Set error msg
      } finally {
        if (!cancelled) setLoading(false);         // Always hide loader
      }
    }

    fetch();
    return () => { cancelled = true; };            // Cleanup
  }, []);

  return { profile, loading, error };
}