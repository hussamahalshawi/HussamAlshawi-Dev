/**
 * useProfile.js
 * ─────────────────────────────────────────────────────────
 * Focused hook for fetching only the profile data.
 * Use this in components that ONLY need profile info
 * (e.g. Navbar avatar, ContactSection).
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';               // React hooks
import profileService           from '../services/profileService'; // Profile API calls

/**
 * useProfile — fetches the public profile data once on mount.
 *
 * @returns {{
 *   profile: object|null, - Profile object from API or null
 *   loading: boolean,     - True while fetching
 *   error:   string|null  - Error message or null
 * }}
 */
export function useProfile() {

  const [profile, setProfile] = useState(null);   // Profile object from API
  const [loading, setLoading] = useState(true);   // Fetching state
  const [error,   setError]   = useState(null);   // Error message or null

  useEffect(() => {
    let cancelled = false;                         // Prevent state update after unmount

    /* Named fetchProfile to avoid shadowing the browser's global fetch() */
    async function fetchProfile() {
      setLoading(true);                            // Show loading indicator
      setError(null);                              // Clear previous errors

      try {
        /* GET /portfolio/profile — returns the public profile object */
        const data = await profileService.getPublicProfile();
        if (!cancelled) setProfile(data);          // Only update if still mounted
      } catch (err) {
        /* Set error message — use API error or generic fallback */
        if (!cancelled) setError(err.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);         // Always hide loader
      }
    }

    fetchProfile();                                // Execute fetch on mount

    /* Cleanup: mark as cancelled if component unmounts before fetch completes */
    return () => { cancelled = true; };
  }, []);                                          // Empty deps — run once on mount

  return { profile, loading, error };
}