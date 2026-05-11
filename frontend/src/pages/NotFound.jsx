/**
 * NotFound.jsx — 404 Page
 * Geometric animated 404 without external dependencies.
 */
import '../styles/pages/NotFound.css';

/** SVG geometric 404 illustration */
const Geometric404 = () => (
  <svg
    className="not-found__geo-svg"
    viewBox="0 0 400 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left "4" */}
    <path
      className="geo-path pulse-1"
      d="M40 140V60L100 140H120V60"
      stroke="#c8ff57" strokeWidth="4" strokeLinecap="square"
    />
    {/* Middle "0" (hexagon) */}
    <path
      className="geo-path pulse-2"
      d="M160 100L180 60H220L240 100L220 140H180L160 100Z"
      stroke="#c8ff57" strokeWidth="4"
    />
    {/* Right "4" */}
    <path
      className="geo-path pulse-3"
      d="M280 140V60L340 140H360V60"
      stroke="#c8ff57" strokeWidth="4" strokeLinecap="square"
    />
    {/* Dashed base line */}
    <line
      x1="20" y1="160" x2="380" y2="160"
      stroke="#c8ff57" strokeWidth="1"
      strokeOpacity="0.3" strokeDasharray="10 5"
    />
  </svg>
);

/** 404 page — no framer-motion, no missing components */
export default function NotFound() {
  return (
    <div className="not-found">

      {/* Vignette overlay */}
      <div className="not-found__vignette" />

      <div className="not-found__content">

        {/* Geometric visual */}
        <div className="not-found__geo-container">
          <Geometric404 />
        </div>

        {/* Status text */}
        <h2 className="not-found__status">CONNECTION LOST</h2>
        <p className="not-found__msg">The requested node is unavailable.</p>

        {/* CTA button — no Button component needed */}
        <div className="not-found__actions">
          <a href="/" className="btn btn--primary btn--lg">
            RE-ESTABLISH HOME
          </a>
        </div>

      </div>
    </div>
  );
}