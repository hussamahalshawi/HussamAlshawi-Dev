/**
 * OfflineBanner.jsx
 * بانر يظهر لما الـ API ما يرد — مرئي وواضح للزائر
 */
import './OfflineBanner.css';

export default function OfflineBanner({ message }) {
  return (
    <div className="offline-banner">
      <span className="offline-banner__icon">⚠</span>
      <span className="offline-banner__text">{message}</span>
    </div>
  );
}