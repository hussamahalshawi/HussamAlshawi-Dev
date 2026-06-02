/**
 * cache.js
 * ─────────────────────────────────────────────────────────
 * localStorage cache utility with automatic cache busting.
 * Uses a hash of the full response to detect any change.
 * ─────────────────────────────────────────────────────────
 */

/* ── Cache keys per API ──────────────────────────────────────────── */
export const CACHE_KEYS = {
  profile:       'ha_cache_profile',
  analytics:     'ha_cache_analytics',
  skills:        'ha_cache_skills',
  projects:      'ha_cache_projects',
  skillsSummary: 'ha_cache_skills_summary',
  languages:     'ha_cache_languages',
  portfolio:     'ha_cache_portfolio',
};

/* ═══════════════════════════════════════════════════════
   HASH UTILITY
   Converts any object to a stable numeric fingerprint.
   Same data = same hash. Any change = different hash.
═══════════════════════════════════════════════════════ */
/**
 * hashData — converts data to a stable string fingerprint.
 * Uses JSON.stringify with sorted keys for consistency.
 * Then applies a simple djb2 hash for a short number.
 * @param   {*}      data - Any API response
 * @returns {string}      - Hash string e.g. "2847392847"
 */
function hashData(data) {
  try {
    /* Sort keys for stable JSON regardless of insertion order */
    const stable = JSON.stringify(data, Object.keys(data || {}).sort());

    /* djb2 hash algorithm — fast and collision-resistant enough */
    let hash = 5381;                                           // djb2 starting seed
    for (let i = 0; i < stable.length; i++) {
      hash = (hash * 33) ^ stable.charCodeAt(i);              // hash * 33 XOR char code
      hash = hash & hash;                                      // Convert to 32-bit integer
    }

    return String(Math.abs(hash));                             // Always positive string
  } catch (err) {
    console.warn('[Cache] Hash failed:', err);
    return String(Date.now());                                 // Fallback: always different
  }
}

/**
 * saveToCache — saves API response with its hash fingerprint.
 * @param {string} key  - One of CACHE_KEYS values
 * @param {*}      data - API response data to store
 */
export function saveToCache(key, data) {
  try {
    const entry = {
      data,                                                    // Full API response
      savedAt: Date.now(),                                     // When saved
      hash:    hashData(data),                                 // Fingerprint of data
    };
    localStorage.setItem(key, JSON.stringify(entry));          // Serialize and store
    console.log(`[Cache] ✓ Saved ${key} | hash: ${entry.hash}`);
  } catch (err) {
    console.warn(`[Cache] Failed to save ${key}:`, err);
  }
}

/**
 * loadFromCacheAny — reads cached data regardless of expiry.
 * Used to show stale data instantly while fresh data loads.
 * @param   {string} key - One of CACHE_KEYS values
 * @returns {*|null}     - Cached data or null if nothing saved
 */
export function loadFromCacheAny(key) {
  try {
    const raw = localStorage.getItem(key);                     // Read raw string
    if (!raw) return null;                                     // Nothing cached yet

    const entry = JSON.parse(raw);                             // Parse JSON
    return entry.data;                                         // Return data only
  } catch (err) {
    console.warn(`[Cache] Failed to read ${key}:`, err);
    localStorage.removeItem(key);                              // Remove corrupted entry
    return null;
  }
}

/**
 * isCacheStale — compares fresh API response hash with cached hash.
 * Returns true if ANY part of the data has changed.
 * @param   {string} key       - One of CACHE_KEYS values
 * @param   {*}      freshData - New API response to compare
 * @returns {boolean}          - True = data changed, update needed
 */
export function isCacheStale(key, freshData) {
  try {
    const raw = localStorage.getItem(key);                     // Read cached entry
    if (!raw) return true;                                     // No cache = always stale

    const entry       = JSON.parse(raw);                       // Parse entry
    const cachedHash  = entry.hash;                            // Saved hash
    const freshHash   = hashData(freshData);                   // Hash of new data

    const isStale = cachedHash !== freshHash;                  // Different = stale

    console.log(
      `[Cache] ${isStale ? '🔄 STALE' : '✓ FRESH'} ${key}`,
      `| cached: ${cachedHash}`,
      `| fresh:  ${freshHash}`
    );

    return isStale;
  } catch (err) {
    console.warn(`[Cache] Stale check failed for ${key}:`, err);
    return true;                                               // Treat as stale on error
  }
}

/**
 * clearAllCache — removes all portfolio cache entries.
 */
export function clearAllCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);                              // Remove each key
  });
  console.log('[Cache] All portfolio cache cleared');
}