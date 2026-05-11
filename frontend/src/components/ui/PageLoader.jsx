/**
 * PageLoader.jsx
 * ─────────────────────────────────────────────────────────
 * Full-screen animated loading overlay shown while the
 * initial portfolio data is being fetched (before React
 * has data to render).
 *
 * Features:
 *   - Triple concentric ring spinner (cyan / blue / violet)
 *   - Cycling messages from LOADER_MESSAGES constant
 *   - Progress dots that advance with message index
 *   - Brand watermark at bottom
 *   - Smooth fade-out via CSS transition when hidden
 *
 * Usage:
 *   <PageLoader visible />          — Show loader
 *   <PageLoader visible={false} />  — Fade out loader
 *
 * In Home.jsx:
 *   if (loading) return <PageLoader visible />;
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';   // React hooks
import { LOADER_MESSAGES }             from '../../utils/constants'; // Message array
import '../../styles/components/PageLoader.css';        // Component styles

/* ── Message cycle interval in ms ────────────────────────────── */
const MESSAGE_INTERVAL = 900; // Advance to next message every 900ms

/**
 * PageLoader — Animated full-screen loading overlay.
 *
 * @param {object}  props
 * @param {boolean} [props.visible=true]   - Whether the loader is currently visible
 * @param {string}  [props.className='']   - Extra CSS class for the overlay div
 *
 * @returns {JSX.Element}
 */
export default function PageLoader({
  visible   = true,   // Controls opacity/visibility via CSS class
  className = '',     // Optional extra class
}) {

  /* ── Current message index ──────────────────────────────────── */
  const [msgIndex, setMsgIndex] = useState(0);           // Starts at first message

  /* ── Ref to hold the interval ID for cleanup ────────────────── */
  const intervalRef = useRef(null);                      // Interval reference

  /* ── Cycle through messages while visible ───────────────────── */
  useEffect(() => {
    if (!visible) return;                                // Skip if not visible

    /* Start cycling messages at MESSAGE_INTERVAL */
    intervalRef.current = setInterval(() => {
      setMsgIndex(prev => {
        const next = prev + 1;                           // Advance index
        /* Stop at last message — don't loop back */
        return next < LOADER_MESSAGES.length ? next : prev;
      });
    }, MESSAGE_INTERVAL);

    /* Cleanup interval on unmount or when visible changes */
    return () => clearInterval(intervalRef.current);
  }, [visible]);                                         // Re-run when visible changes

  /* ── Reset index when loader becomes visible again ──────────── */
  useEffect(() => {
    if (visible) setMsgIndex(0);                         // Reset to first message
  }, [visible]);

  /* ── Current message text ───────────────────────────────────── */
  const currentMessage = LOADER_MESSAGES[msgIndex]       // Get message at current index
    || LOADER_MESSAGES[LOADER_MESSAGES.length - 1];      // Fallback to last message

  /* ── Build class list ───────────────────────────────────────── */
  const classes = [
    'page-loader',                                       // Base class always present
    !visible ? 'page-loader--hidden' : '',               // Hidden class triggers fade-out
    className,                                           // Any extra classes
  ]
    .filter(Boolean)                                     // Remove empty strings
    .join(' ');                                          // Combine into single string

  return (
    <div
      className={classes}
      role="status"                                      /* ARIA: loading region */
      aria-live="polite"                                 /* Announce updates to screen readers */
      aria-label="Loading portfolio content"             /* Accessible description */
      aria-busy={visible}                                /* true while loading */
    >

      {/* ── Triple ring spinner ── */}
      <div className="page-loader__spinner" aria-hidden="true">

        {/* Ring 1 — outer, cyan, clockwise */}
        <div className="loader-ring loader-ring--1" />

        {/* Ring 2 — middle, blue, counter-clockwise */}
        <div className="loader-ring loader-ring--2" />

        {/* Ring 3 — inner, violet, fastest clockwise */}
        <div className="loader-ring loader-ring--3" />

        {/* Center pulsing glow dot */}
        <div className="loader-ring__center" aria-hidden="true" />
      </div>

      {/* ── Text block: message + progress dots ── */}
      <div className="page-loader__text">

        {/* Cycling message — key forces re-mount = re-animation */}
        <p
          className="page-loader__message"
          key={msgIndex}                                 /* Re-animate when message changes */
          aria-live="assertive"                          /* Announce message to screen reader */
        >
          {currentMessage}
        </p>

        {/* Progress dots row */}
        <div
          className="page-loader__dots"
          role="progressbar"                             /* ARIA: progress indicator */
          aria-valuenow={msgIndex + 1}                   /* Current step */
          aria-valuemin={1}                              /* Min step */
          aria-valuemax={LOADER_MESSAGES.length}         /* Max steps */
          aria-label={`Loading step ${msgIndex + 1} of ${LOADER_MESSAGES.length}`}
        >
          {LOADER_MESSAGES.map((_, i) => {
            /* Determine dot state */
            const isDone   = i < msgIndex;              // Completed step
            const isActive = i === msgIndex;             // Current step

            return (
              <div
                key={i}
                className={[
                  'loader-dot',                          /* Base dot class */
                  isDone   ? 'loader-dot--done'   : '',  /* Green if completed */
                  isActive ? 'loader-dot--active' : '',  /* Cyan if active */
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"                       /* Decorative — progressbar handles accessibility */
              />
            );
          })}
        </div>
      </div>

      {/* ── Brand watermark ── */}
      <div className="page-loader__brand" aria-hidden="true">
        HA<em>.</em>Dev
      </div>
    </div>
  );
}