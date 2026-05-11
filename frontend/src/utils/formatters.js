/**
 * formatters.js
 * ─────────────────────────────────────────────────────────
 * Pure utility functions for formatting data in the UI.
 * Rules:
 *   - No side effects — input in, output out
 *   - No API calls or state mutations
 *   - Every function handles null/undefined gracefully
 *   - All functions are individually exported for tree-shaking
 *
 * Functions:
 *   formatYear        — ISO date string → "2023"
 *   formatDateRange   — Two ISO dates → "2021 — Present"
 *   truncate          — Long string → truncated with ellipsis
 *   formatExperience  — Years number → "5+" or "5.2"
 *   scoreToBand       — Score 0–100 → band label string
 *   calcProgress      — current/target → clamped percentage
 *   getInitials       — Full name → "HA"
 *   formatScore       — Score number → "92%"
 *   pluralize         — Count + word → "1 Project" or "5 Projects"
 *   safeGet           — Object + dot path → nested value safely
 * ─────────────────────────────────────────────────────────
 */

import { SKILL_BANDS } from './constants'; // Import band config for scoreToBand

/* ══════════════════════════════════════════════════════════
   formatYear
   Converts an ISO date string to a 4-digit year string.
══════════════════════════════════════════════════════════ */
/**
 * Extracts the year from an ISO date string.
 * @param   {string|null} isoString - ISO 8601 date string e.g. "2023-06-15T00:00:00Z"
 * @returns {string}                - "2023" or "—" if input is missing/invalid
 *
 * @example
 * formatYear("2023-06-15")  // → "2023"
 * formatYear(null)           // → "—"
 * formatYear("bad-date")    // → "—"
 */
export function formatYear(isoString) {
  if (!isoString) return '—';                   // Guard: handle null or undefined
  try {
    return new Date(isoString)
      .getFullYear()                            // Extract year as number
      .toString();                              // Convert to string for display
  } catch {
    return '—';                                 // Fallback if Date parsing fails
  }
}

/* ══════════════════════════════════════════════════════════
   formatDateRange
   Builds a human-readable date range for experience cards.
══════════════════════════════════════════════════════════ */
/**
 * Formats a start/end date pair into a readable range string.
 * @param   {string|null} startIso  - Start date ISO string
 * @param   {string|null} endIso    - End date ISO string
 * @param   {boolean}     isCurrent - If true, shows "Present" instead of end year
 * @returns {string}                - "2021 — Present" or "2019 — 2021" or "—"
 *
 * @example
 * formatDateRange("2021-01-01", null, true)         // → "2021 — Present"
 * formatDateRange("2019-01-01", "2021-06-01", false) // → "2019 — 2021"
 * formatDateRange(null, null, false)                 // → "—"
 */
export function formatDateRange(startIso, endIso, isCurrent = false) {
  const start = formatYear(startIso);                         // Format start year
  const end   = isCurrent ? 'Present' : formatYear(endIso);  // "Present" if current role

  if (start === '—' && end === '—') return '—';  // Both missing — return dash
  if (end   === '—') return start;               // Only start available
  return `${start} — ${end}`;                    // Full range with em dash separator
}

/* ══════════════════════════════════════════════════════════
   truncate
   Shortens long text with ellipsis for card descriptions.
══════════════════════════════════════════════════════════ */
/**
 * Truncates a string to a maximum character count.
 * @param   {string} text  - The input text to truncate
 * @param   {number} limit - Maximum characters before truncation (default: 150)
 * @returns {string}       - Original or truncated string ending with "..."
 *
 * @example
 * truncate("Hello World", 5)  // → "Hello..."
 * truncate("Short", 100)      // → "Short"
 * truncate(null)               // → ""
 */
export function truncate(text, limit = 150) {
  if (!text) return '';                          // Guard: empty input
  if (text.length <= limit) return text;         // No truncation needed
  return text.slice(0, limit).trimEnd() + '...'; // Trim whitespace before ellipsis
}

/* ══════════════════════════════════════════════════════════
   formatExperience
   Formats years of experience for display in profile stats.
══════════════════════════════════════════════════════════ */
/**
 * Formats a numeric years value for display.
 * Whole numbers get a "+" suffix; decimals show as-is.
 * @param   {number|null} years - Years of experience
 * @returns {string}            - "5+" for integers, "5.2" for decimals, "—" if missing
 *
 * @example
 * formatExperience(5)    // → "5+"
 * formatExperience(5.2)  // → "5.2"
 * formatExperience(null) // → "—"
 */
export function formatExperience(years) {
  if (!years && years !== 0) return '—';         // Guard: null/undefined (not zero)
  const n = parseFloat(years);                   // Ensure numeric type
  return Number.isInteger(n)
    ? `${n}+`                                    // "5+" for whole numbers
    : `${n}`;                                    // "5.2" for decimal values
}

/* ══════════════════════════════════════════════════════════
   scoreToBand
   Maps a skill score (0–100) to its proficiency band label.
══════════════════════════════════════════════════════════ */
/**
 * Converts a numeric score to a proficiency band label.
 * Uses SKILL_BANDS from constants.js as the source of truth.
 * @param   {number} score - Skill score from 0 to 100
 * @returns {string}       - "Expert" | "Advanced" | "Intermediate" | "Beginner"
 *
 * @example
 * scoreToBand(92) // → "Expert"
 * scoreToBand(65) // → "Advanced"
 * scoreToBand(50) // → "Intermediate"
 * scoreToBand(20) // → "Beginner"
 */
export function scoreToBand(score) {
  if (score >= SKILL_BANDS.expert.min)       return SKILL_BANDS.expert.label;       // 80–100
  if (score >= SKILL_BANDS.advanced.min)     return SKILL_BANDS.advanced.label;     // 60–79
  if (score >= SKILL_BANDS.intermediate.min) return SKILL_BANDS.intermediate.label; // 40–59
  return SKILL_BANDS.beginner.label;                                                 // 0–39
}

/* ══════════════════════════════════════════════════════════
   getBandColor
   Returns the CSS color for a given score band.
══════════════════════════════════════════════════════════ */
/**
 * Maps a numeric score to its corresponding band color.
 * Uses SKILL_BANDS from constants.js as the source of truth.
 * @param   {number} score - Skill score from 0 to 100
 * @returns {string}       - CSS hex color string
 *
 * @example
 * getBandColor(92) // → "#C8FF57" (lime — expert)
 * getBandColor(65) // → "#00E5FF" (cyan — advanced)
 */
export function getBandColor(score) {
  if (score >= SKILL_BANDS.expert.min)       return SKILL_BANDS.expert.color;       // Lime
  if (score >= SKILL_BANDS.advanced.min)     return SKILL_BANDS.advanced.color;     // Cyan
  if (score >= SKILL_BANDS.intermediate.min) return SKILL_BANDS.intermediate.color; // Violet
  return SKILL_BANDS.beginner.color;                                                 // Gold
}

/* ══════════════════════════════════════════════════════════
   calcProgress
   Calculates a clamped percentage from current/target values.
══════════════════════════════════════════════════════════ */
/**
 * Calculates a progress percentage clamped between 0 and 100.
 * @param   {number} current - Current value
 * @param   {number} target  - Target/maximum value
 * @returns {number}         - Integer percentage 0–100
 *
 * @example
 * calcProgress(75, 100) // → 75
 * calcProgress(50, 40)  // → 100  (clamped at max)
 * calcProgress(0, 0)    // → 0    (safe division by zero)
 */
export function calcProgress(current, target) {
  if (!target || target === 0) return 0;         // Guard: avoid division by zero
  return Math.min(                               // Clamp result at 100
    Math.round((current / target) * 100),        // Calculate percentage
    100
  );
}

/* ══════════════════════════════════════════════════════════
   getInitials
   Extracts two-character initials from a full name.
══════════════════════════════════════════════════════════ */
/**
 * Returns the first letter of the first and last name in uppercase.
 * Used for avatar fallback when no image is available.
 * @param   {string|null} fullName - e.g. "Hussam Alshawi"
 * @returns {string}               - "HA" or "??" if name is missing
 *
 * @example
 * getInitials("Hussam Alshawi") // → "HA"
 * getInitials("Hussam")         // → "H"
 * getInitials(null)              // → "??"
 */
export function getInitials(fullName) {
  if (!fullName) return '??';                    // Fallback for missing name
  const parts = fullName.trim().split(' ');      // Split on spaces
  const first = parts[0]?.[0] || '';             // First char of first name
  const last  = parts[1]?.[0] || '';             // First char of last name (optional)
  return (first + last).toUpperCase();           // Combine and uppercase
}

/* ══════════════════════════════════════════════════════════
   formatScore
   Formats a raw skill score as a percentage string.
══════════════════════════════════════════════════════════ */
/**
 * Converts a numeric score to a display percentage string.
 * @param   {number|null} score - Score from 0 to 100
 * @returns {string}            - "92%" or "0%" for missing values
 *
 * @example
 * formatScore(92)   // → "92%"
 * formatScore(null) // → "0%"
 */
export function formatScore(score) {
  return `${Math.round(score || 0)}%`;           // Safe rounding with null fallback
}

/* ══════════════════════════════════════════════════════════
   pluralize
   Returns a properly pluralized label with its count.
══════════════════════════════════════════════════════════ */
/**
 * Pluralizes a word based on a count value.
 * @param   {number} count    - The quantity to check
 * @param   {string} singular - Singular form e.g. "Project"
 * @param   {string} plural   - Plural form (defaults to singular + "s")
 * @returns {string}          - "1 Project" or "5 Projects"
 *
 * @example
 * pluralize(1, "Project")           // → "1 Project"
 * pluralize(5, "Project")           // → "5 Projects"
 * pluralize(3, "Category", "Categories") // → "3 Categories"
 */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`; // Standard pluralization rule
}

/* ══════════════════════════════════════════════════════════
   safeGet
   Safely reads a nested object value using dot notation.
══════════════════════════════════════════════════════════ */
/**
 * Accesses a deeply nested object value without throwing errors.
 * Useful for optional API response fields that may be missing.
 * @param   {object} obj      - The source object to read from
 * @param   {string} path     - Dot-notation path e.g. "social.github"
 * @param   {*}      fallback - Default value if path not found (default: null)
 * @returns {*}               - The value at path, or fallback
 *
 * @example
 * safeGet({ social: { github: "url" } }, "social.github") // → "url"
 * safeGet({ social: {} }, "social.twitter", "—")          // → "—"
 * safeGet(null, "any.path", "default")                     // → "default"
 */
export function safeGet(obj, path, fallback = null) {
  return path
    .split('.')                                  // Split "social.github" → ["social","github"]
    .reduce(
      (acc, key) => (acc != null ? acc[key] : fallback), // Walk object depth-first
      obj
    ) ?? fallback;                               // Final null/undefined check
}

/* ══════════════════════════════════════════════════════════
   capitalizeFirst
   Capitalizes the first character of a string.
══════════════════════════════════════════════════════════ */
/**
 * Capitalizes only the first letter of a string.
 * @param   {string|null} str - Input string
 * @returns {string}          - String with first letter uppercased
 *
 * @example
 * capitalizeFirst("hello world") // → "Hello world"
 * capitalizeFirst(null)           // → ""
 */
export function capitalizeFirst(str) {
  if (!str) return '';                           // Guard: empty/null input
  return str.charAt(0).toUpperCase()            // Uppercase first character
    + str.slice(1);                              // Append rest unchanged
}

/* ══════════════════════════════════════════════════════════
   clamp
   Clamps a number between a minimum and maximum value.
══════════════════════════════════════════════════════════ */
/**
 * Restricts a number to a given range.
 * @param   {number} value - The number to clamp
 * @param   {number} min   - Minimum allowed value
 * @param   {number} max   - Maximum allowed value
 * @returns {number}       - Value clamped between min and max
 *
 * @example
 * clamp(150, 0, 100) // → 100
 * clamp(-5,  0, 100) // → 0
 * clamp(50,  0, 100) // → 50
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);    // Nested min/max for range clamping
}