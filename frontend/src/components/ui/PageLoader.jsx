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
/**
 * PageLoader.jsx
 * ─────────────────────────────────────────────────────────
 * Updated: Now relies on real-time API progress instead of a timer.
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { LOADER_MESSAGES }      from '../../utils/constants';
import '../../styles/components/PageLoader.css';

/**
 * PageLoader — Animated overlay driven by data fetching progress.
 *
 * @param {object}  props
 * @param {boolean} [props.visible=true]   - Visibility toggle
 * @param {number}  [props.progress=0]    - Number of completed API requests
 * @param {string}  [props.className='']   - Extra CSS class
 */
export default function PageLoader({
  visible  = true,
  progress = 0, // Received from usePortfolioData (e.g., 0, 1, 2, 3...)
  className = '',
}) {
  /* ── Current message index ──────────────────────────────────── */
  // We no longer use setInterval. msgIndex is now directly tied to progress.
  const [msgIndex, setMsgIndex] = useState(0);

  /* ── Sync internal index with external progress ─────────────── */
  useEffect(() => {
    if (visible) {
      // Ensure the index doesn't exceed the available messages
      const nextIndex = Math.min(progress, LOADER_MESSAGES.length - 1);
      setMsgIndex(nextIndex);
    }
  }, [progress, visible]);

  /* ── Current message text ───────────────────────────────────── */
  const currentMessage = LOADER_MESSAGES[msgIndex]
    || LOADER_MESSAGES[LOADER_MESSAGES.length - 1];

  /* ── Build class list ───────────────────────────────────────── */
  const classes = [
    'page-loader',
    !visible ? 'page-loader--hidden' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio content"
      aria-busy={visible}
    >
      {/* ── Triple ring spinner (Keep existing design) ── */}
      <div className="page-loader__spinner" aria-hidden="true">
        <div className="loader-ring loader-ring--1" />
        <div className="loader-ring loader-ring--2" />
        <div className="loader-ring loader-ring--3" />
        <div className="loader-ring__center" aria-hidden="true" />
      </div>

      {/* ── Text block: message + progress dots ── */}
      <div className="page-loader__text">
        {/* Key forces re-mount for animation when progress changes */}
        <p className="page-loader__message" key={msgIndex} aria-live="assertive">
          {currentMessage}
        </p>

        {/* Progress dots row */}
        <div
          className="page-loader__dots"
          role="progressbar"
          aria-valuenow={msgIndex + 1}
          aria-valuemin={1}
          aria-valuemax={LOADER_MESSAGES.length}
        >
          {LOADER_MESSAGES.map((_, i) => {
            const isDone   = i < msgIndex;
            const isActive = i === msgIndex;

            return (
              <div
                key={i}
                className={[
                  'loader-dot',
                  isDone   ? 'loader-dot--done'   : '',
                  isActive ? 'loader-dot--active' : '',
                ].filter(Boolean).join(' ')}
                aria-hidden="true"
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