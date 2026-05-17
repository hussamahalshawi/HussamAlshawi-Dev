/**
 * useIntersectionLoader.js
 * ─────────────────────────────────────────────────────────
 * Shared utility hook — fires a one-time trigger when a
 * referenced DOM element enters the viewport.
 *
 * Used by all section hooks to lazy-load API data only
 * when the section becomes visible — avoids loading
 * everything on mount.
 *
 * Usage:
 *   const ref       = useRef(null);
 *   const triggered = useIntersectionLoader(ref);
 *   useEffect(() => { if (triggered) fetchData(); }, [triggered]);
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';          // React primitives

/**
 * useIntersectionLoader
 * Observes a DOM ref and returns true once it intersects the viewport.
 * The observer disconnects immediately after the first trigger — one-shot only.
 *
 * @param   {React.RefObject} ref       - Ref attached to the section element
 * @param   {number}          threshold - Intersection ratio to trigger (default 0.1)
 * @returns {boolean}                   - False until section enters viewport, then true forever
 */
export function useIntersectionLoader(ref, threshold = 0.1) {

  /* ── Trigger state — false until section enters viewport ── */
  const [triggered, setTriggered] = useState(false);  // Starts false — flips once to true

  useEffect(() => {

    /* Guard: if already triggered, skip creating a new observer */
    if (triggered) return;                             // One-shot — never re-observe

    /* Guard: if ref not attached to DOM yet, skip */
    const el = ref?.current;                           // Read current DOM element
    if (!el) return;                                   // Element not mounted yet

    /* Create IntersectionObserver — fires callback when element is visible */
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;                       // Only one element observed

        if (entry.isIntersecting) {                    // Element crossed the threshold
          setTriggered(true);                          // Flip trigger — fires API load
          observer.disconnect();                       // One-shot: stop observing immediately
        }
      },
      {
        threshold,                                     // Ratio of element visible before firing
        rootMargin: '0px 0px -50px 0px',              // Trigger slightly before bottom edge
      }
    );

    observer.observe(el);                              // Start watching the element

    /* Cleanup: disconnect observer if component unmounts before trigger */
    return () => observer.disconnect();

  }, [ref, triggered, threshold]);                     // Re-run if ref or threshold changes

  return triggered;                                    // Expose trigger state to calling hook
}

export default useIntersectionLoader;                  // Default export for convenient importing