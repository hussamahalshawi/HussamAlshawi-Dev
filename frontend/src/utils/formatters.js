/**
 * formatters.js
 * ─────────────────────────────────────────────────────────
 * Pure utility functions for formatting data in the UI.
 * No side effects — input → output only.
 * ─────────────────────────────────────────────────────────
 */

/**
 * Formats an ISO date string to a readable year.
 * @param {string|null} isoString - ISO date string from API
 * @returns {string} - "2023" or "—" if missing
 */
export function formatYear(isoString) {
  if (!isoString) return '—';                        // Handle null/undefined
  try {
    return new Date(isoString).getFullYear().toString(); // Extract year only
  } catch {
    return '—';                                      // Fallback on bad date
  }
}

/**
 * Formats a date range for experience / education cards.
 * @param {string|null} startIso - Start date ISO string
 * @param {string|null} endIso   - End date ISO string
 * @param {boolean} isCurrent    - If true, shows "Present" instead of end year
 * @returns {string} - "2021 — Present" or "2019 — 2021"
 */
export function formatDateRange(startIso, endIso, isCurrent = false) {
  const start = formatYear(startIso);                // Format start year
  const end   = isCurrent ? 'Present' : formatYear(endIso); // "Present" if current
  if (start === '—' && end === '—') return '—';     // Both missing
  if (end === '—') return start;                     // Only start available
  return `${start} — ${end}`;                        // Full range
}

/**
 * Truncates a string to a maximum character count with ellipsis.
 * @param {string} text   - Input text
 * @param {number} limit  - Max characters (default 150)
 * @returns {string}
 */
export function truncate(text, limit = 150) {
  if (!text) return '';                              // Guard: empty string
  if (text.length <= limit) return text;             // No truncation needed
  return text.slice(0, limit).trimEnd() + '...';    // Trim and append ellipsis
}

/**
 * Formats a number with a + suffix for "experience years" display.
 * @param {number} years - Experience years from API
 * @returns {string} - "5+" or "5.2"
 */
export function formatExperience(years) {
  if (!years && years !== 0) return '—';            // Handle null/undefined
  const n = parseFloat(years);                       // Ensure numeric
  return Number.isInteger(n) ? `${n}+` : `${n}`;   // "5+" for whole, "5.2" for decimal
}

/**
 * Converts a score (0–100) to a proficiency band label.
 * @param {number} score
 * @returns {string} - "Expert" | "Advanced" | "Intermediate" | "Beginner"
 */
export function scoreToBand(score) {
  if (score >= 80) return 'Expert';                  // 80-100
  if (score >= 60) return 'Advanced';               // 60-79
  if (score >= 40) return 'Intermediate';           // 40-59
  return 'Beginner';                                 // 0-39
}

/**
 * Formats a progress percentage for display.
 * Clamps between 0 and 100.
 * @param {number} current
 * @param {number} target
 * @returns {number} - Integer percentage 0-100
 */
export function calcProgress(current, target) {
  if (!target || target === 0) return 0;             // Avoid division by zero
  return Math.min(Math.round((current / target) * 100), 100); // Clamp at 100
}

/**
 * Returns initials from a full name (max 2 chars).
 * @param {string} fullName - e.g. "Hussam Alshawi"
 * @returns {string} - "HA"
 */
export function getInitials(fullName) {
  if (!fullName) return '??';                        // Fallback
  const parts = fullName.trim().split(' ');          // Split by space
  const first = parts[0]?.[0] || '';                // First char of first name
  const last  = parts[1]?.[0] || '';                // First char of last name
  return (first + last).toUpperCase();              // Uppercase initials
}

/**
 * Formats a skill score as a percentage string.
 * @param {number} score - 0–100
 * @returns {string} - "92%"
 */
export function formatScore(score) {
  return `${Math.round(score || 0)}%`;              // Safe rounding
}

/**
 * Pluralizes a word based on count.
 * @param {number} count
 * @param {string} singular - e.g. "Project"
 * @param {string} plural   - e.g. "Projects" (optional, adds 's' by default)
 * @returns {string} - "1 Project" or "5 Projects"
 */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`; // Standard pluralization
}

/**
 * Safely accesses a nested object value.
 * @param {object} obj  - Source object
 * @param {string} path - Dot-notation path e.g. "social.github"
 * @param {*} fallback  - Value if path not found
 * @returns {*}
 */
export function safeGet(obj, path, fallback = null) {
  return path                                        // Start with path string
    .split('.')                                      // Split "social.github" → ["social","github"]
    .reduce((acc, key) =>                            // Walk the object
      acc != null ? acc[key] : fallback,             // Return fallback if missing
      obj
    ) ?? fallback;                                   // Final null check
}