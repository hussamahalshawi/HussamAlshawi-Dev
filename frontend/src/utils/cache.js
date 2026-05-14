/**
 * cache.js
 * ─────────────────────────────────────────────────────────
 * localStorage cache utility for portfolio API responses.
 * Each API has its own key and expiry duration.
 * Stale data is shown immediately while fresh data loads.
 * ─────────────────────────────────────────────────────────
 */

/* ── Cache key per API ───────────────────────────────────────────── */
export const CACHE_KEYS = {
  profile:       'ha_cache_profile',       // Profile API cache key
  analytics:     'ha_cache_analytics',     // Analytics API cache key
  skills:        'ha_cache_skills',        // Skills API cache key
  projects:      'ha_cache_projects',      // Projects API cache key
  skillsSummary: 'ha_cache_skills_summary',// Skills summary cache key
};

/* ── Cache expiry durations (ms) ─────────────────────────────────── */
const CACHE_TTL = {
  profile:       1000 * 60 * 60 * 24,     // 24 hours — profile rarely changes
  analytics:     1000 * 60 * 60 * 6,      // 6 hours  — analytics change occasionally
  skills:        1000 * 60 * 60 * 12,     // 12 hours — skills change rarely
  projects:      1000 * 60 * 60 * 6,      // 6 hours  — projects change occasionally
  skillsSummary: 1000 * 60 * 60 * 12,     // 12 hours — summary mirrors skills
};

/**
 * saveToCache — saves API response with a timestamp.
 * @param {string} key   - One of CACHE_KEYS values
 * @param {*}      data  - API response data to store
 */
export function saveToCache(key, data) {
  try {
    const entry = {
      data,                                // The actual API response
      savedAt: Date.now(),                 // Timestamp for expiry check
    };
    localStorage.setItem(key, JSON.stringify(entry)); // Serialize and store
  } catch (err) {
    console.warn(`[Cache] Failed to save ${key}:`, err); // Storage full or blocked
  }
}

/**
 * loadFromCache — reads cached data if it exists and is not expired.
 * @param   {string} key      - One of CACHE_KEYS values
 * @param   {string} ttlKey   - Key to look up TTL duration
 * @returns {*|null}          - Cached data or null if missing/expired
 */
export function loadFromCache(key, ttlKey) {
  try {
    const raw = localStorage.getItem(key);           // Read raw string
    if (!raw) return null;                           // Nothing cached yet

    const entry = JSON.parse(raw);                   // Parse JSON
    const age   = Date.now() - entry.savedAt;        // How old is this cache?
    const ttl   = CACHE_TTL[ttlKey] || 1000 * 60 * 60; // Default 1 hour if key missing

    if (age > ttl) {                                 // Cache is expired
      localStorage.removeItem(key);                  // Clean up expired entry
      return null;                                   // Treat as no cache
    }

    return entry.data;                               // Return fresh cached data
  } catch (err) {
    console.warn(`[Cache] Failed to load ${key}:`, err); // Corrupted JSON
    localStorage.removeItem(key);                    // Remove corrupted entry
    return null;
  }
}

/**
 * loadFromCacheAny — reads cached data regardless of expiry.
 * Used to show stale data while fresh data is loading.
 * @param   {string} key - One of CACHE_KEYS values
 * @returns {*|null}     - Any cached data or null if nothing saved
 */
export function loadFromCacheAny(key) {
  try {
    const raw = localStorage.getItem(key);           // Read raw string
    if (!raw) return null;                           // Nothing ever cached

    const entry = JSON.parse(raw);                   // Parse JSON
    return entry.data;                               // Return data ignoring expiry
  } catch (err) {
    console.warn(`[Cache] Failed to read ${key}:`, err); // Corrupted entry
    localStorage.removeItem(key);                    // Remove corrupted entry
    return null;
  }
}

/**
 * clearAllCache — removes all portfolio cache entries.
 * Call this on logout or manual refresh.
 */
export function clearAllCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);                    // Remove each key individually
  });
  console.log('[Cache] All portfolio cache cleared'); // Dev feedback
}