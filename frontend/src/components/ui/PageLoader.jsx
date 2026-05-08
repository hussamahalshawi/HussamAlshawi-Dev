/**
 * PageLoader.jsx
 * ─────────────────────────────────────────────────────────
 * Full-page loading screen shown while the portfolio API
 * is fetching initial data. Matches the dark theme.
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { LOADER_MESSAGES }     from '../../utils/constants'; // Loading message sequence

/**
 * @param {object}  props
 * @param {boolean} [props.visible=true] - Controls show/hide with fade
 */
export default function PageLoader({ visible = true }) {
  const [msgIndex, setMsgIndex] = useState(0);   // Current message index

  // Cycle through loader messages every 600ms
  useEffect(() => {
    if (!visible) return;                         // Stop if hidden

    const interval = setInterval(() => {
      setMsgIndex(prev =>
        prev < LOADER_MESSAGES.length - 1        // Don't go past last message
          ? prev + 1
          : prev
      );
    }, 600);

    return () => clearInterval(interval);         // Cleanup on unmount
  }, [visible]);

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9000,
        background:     '#0A0B0F',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '1.5rem',
        opacity:        visible ? 1 : 0,
        visibility:     visible ? 'visible' : 'hidden',
        transition:     'opacity 0.6s ease, visibility 0.6s ease',
        pointerEvents:  visible ? 'all' : 'none',
      }}
    >
      {/* Spinning ring */}
      <div
        style={{
          width:        '72px',
          height:       '72px',
          border:       '1px solid #2E3347',
          borderTop:    '1px solid #C8FF57',
          borderRight:  '1px solid #00E5FF',
          borderRadius: '50%',
          animation:    'spin 1s linear infinite',
        }}
      />

      {/* Cycling message */}
      <span
        style={{
          fontFamily:    "'Space Mono', monospace",
          fontSize:      '0.76rem',
          letterSpacing: '0.2em',
          color:         '#7A83A8',
          textTransform: 'uppercase',
        }}
      >
        {LOADER_MESSAGES[msgIndex]}
      </span>

      {/* Logo */}
      <span
        style={{
          position:    'absolute',
          bottom:      '2.5rem',
          fontFamily:  "'Bebas Neue', sans-serif",
          fontSize:    '1.2rem',
          letterSpacing: '0.08em',
          color:       '#353A52',
        }}
      >
        HA<em style={{ color: '#C8FF57', fontStyle: 'normal' }}>.</em>Dev
      </span>
    </div>
  );
}