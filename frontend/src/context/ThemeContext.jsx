/**
 * ThemeContext.jsx
 * ─────────────────────────────────────────────────────────
 * Global theme context — manages dark / light mode state.
 * Persists the user's preference in localStorage.
 * Applies the active theme as a data-attribute on <html>
 * so that CSS variables can switch automatically.
 *
 * Usage:
 *   1. Wrap your app with <ThemeProvider> in main.jsx
 *   2. In any component: const { theme, toggleTheme } = useTheme()
 * ─────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect } from 'react'; // React primitives

/* ── Constants ───────────────────────────────────────────────── */
const STORAGE_KEY = 'ha-dev-theme';         // localStorage key for persistence
const DARK        = 'dark';                  // Dark theme identifier string
const LIGHT       = 'light';                 // Light theme identifier string

/* ── Context creation ────────────────────────────────────────── */
// Creates the context object; default value is null (populated by provider)
const ThemeContext = createContext(null);

/* ═══════════════════════════════════════════════════════════════
   ThemeProvider — wraps the entire app tree
═══════════════════════════════════════════════════════════════ */
/**
 * Provides theme state and toggle function to all child components.
 * @param {{ children: React.ReactNode }} props
 */
export function ThemeProvider({ children }) {

  /* ── Initial theme: read from localStorage or default to dark ── */
  const [theme, setTheme] = useState(() => {
    // Try to read previously saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    // Return saved value if valid, otherwise fall back to dark
    return saved === LIGHT || saved === DARK ? saved : DARK;
  });

  /* ── Apply theme to <html> element whenever theme changes ─────── */
  useEffect(() => {
    const root = document.documentElement;              // Get the <html> element

    root.setAttribute('data-theme', theme);             // Set data-theme="dark" or "light"

    localStorage.setItem(STORAGE_KEY, theme);           // Persist preference for next visit
  }, [theme]);                                          // Re-run whenever theme value changes

  /* ── Toggle function: flips between dark and light ──────────── */
  const toggleTheme = () => {
    setTheme(prev => (prev === DARK ? LIGHT : DARK));   // Switch to opposite theme
  };

  /* ── Derived boolean for convenience ────────────────────────── */
  const isDark  = theme === DARK;                       // true when dark mode is active
  const isLight = theme === LIGHT;                      // true when light mode is active

  /* ── Context value exposed to consumers ─────────────────────── */
  const value = {
    theme,          // Current theme string: 'dark' | 'light'
    isDark,         // Boolean: is dark mode active?
    isLight,        // Boolean: is light mode active?
    toggleTheme,    // Function: call to toggle between modes
    DARK,           // Constant exported for comparisons
    LIGHT,          // Constant exported for comparisons
  };

  return (
    // Provide context value to all children in the tree
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════
   useTheme — custom hook for consuming the context
═══════════════════════════════════════════════════════════════ */
/**
 * Hook to access theme state and toggle function.
 * Must be used inside a component wrapped by ThemeProvider.
 * @returns {{ theme, isDark, isLight, toggleTheme, DARK, LIGHT }}
 * @throws {Error} if used outside ThemeProvider
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);                  // Read context value

  // Guard: throw a helpful error if hook is used outside provider
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }

  return ctx;                                           // Return the full context value
}

// Default export the provider for convenient importing
export default ThemeProvider;