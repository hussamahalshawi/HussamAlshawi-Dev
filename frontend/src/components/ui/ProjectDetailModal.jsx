/**
 * ProjectDetailModal.jsx
 * ─────────────────────────────────────────────────────────
 * Premium full-screen modal for detailed project view.
 *
 * Features:
 *   - Animated image gallery with thumbnail navigation
 *   - Full project details (description, role, skills, dates)
 *   - Video embed support
 *   - GitHub / Live Demo links
 *   - framer-motion AnimatePresence for mount/unmount
 *   - Escape key + click backdrop to close
 *   - Body scroll lock when open
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/ProjectDetail.css';

/* ── Theme colors ───────────────────────────────────────────── */
const COLORS = {
  dark: ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'],
  light: ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'],
};

/* ── Project type icons ─────────────────────────────────────── */
const TYPE_ICONS = {
  'Web App':      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  'Mobile App':   'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01',
  'Desktop':      'M20 3H4a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM8 21h8',
  'CLI Tool':     'M4 17l6-6-6-6M12 19h8',
  'API':          'M4 6h16M4 10h16M4 14h16M4 18h16',
  'Library':      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5',
};

function ProjectIcon({ type, color, size = 22 }) {
  const path = TYPE_ICONS[type] || TYPE_ICONS['Web App'];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

/* ── Duration helper ────────────────────────────────────────── */
function calcDuration(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (months < 1) return 'Less than a month';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m > 1 ? 's' : ''}`;
  if (m === 0) return `${y} year${y > 1 ? 's' : ''}`;
  return `${y} year${y > 1 ? 's' : ''} ${m} month${m > 1 ? 's' : ''}`;
}

/* ── Format date ────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/* ══════════════════════════════════════════════════════════════
   BACKDROP + PANEL VARIANTS
   ══════════════════════════════════════════════════════════════ */
const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const panelVariants = {
  hidden:  { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.95, y: 20 },
};

const panelTransition = {
  type: 'spring',
  damping: 28,
  stiffness: 300,
  mass: 0.8,
};

/* ── Stagger children ───────────────────────────────────────── */
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ProjectDetailModal({ project, isOpen, onClose }) {
  const { isDark } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [activeImg, setActiveImg] = useState(0);

  /* ── Gesture refs ─────────────────────────────────────────── */
  const swipeLock = useRef(false);
  const touchStartX = useRef(null);
  const lastTap = useRef(0);
  const pinchDist = useRef(null);
  const panelTouchStartY = useRef(null);

  /* ── Zoom state ───────────────────────────────────────────── */
  const [imgZoom, setImgZoom] = useState(1);

  const images = project?.media?.project_images || [];
  const hasImages = images.length > 0;
  const hasVideo = !!project?.media?.project_video;

  /* ── Gallery navigation ───────────────────────────────────── */
  const nextImg = useCallback(() => {
    if (images.length <= 1) return;
    setImgZoom(1);
    setActiveImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const prevImg = useCallback(() => {
    if (images.length <= 1) return;
    setImgZoom(1);
    setActiveImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  /* ── 1. Touchpad swipe (two-finger horizontal) ────────────── */
  const handleWheel = useCallback((e) => {
    if (swipeLock.current) return;
    if (Math.abs(e.deltaX) < 15 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    swipeLock.current = true;
    if (e.deltaX > 0) nextImg();
    else prevImg();
    setTimeout(() => { swipeLock.current = false; }, 350);
  }, [nextImg, prevImg]);

  /* ── 2. Touch swipe left/right (gallery) ──────────────────── */
  const handleGalleryTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  }, []);

  const handleGalleryTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) nextImg();
    else prevImg();
  }, [nextImg, prevImg]);

  /* ── 3. Double-tap to zoom ────────────────────────────────── */
  const handleDoubleTap = useCallback((e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      e.preventDefault();
      setImgZoom((prev) => (prev > 1 ? 1 : 2.2));
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, []);

  /* ── 4. Pinch-to-zoom (two-finger on mobile) ─────────────── */
  const handlePinchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handlePinchMove = useCallback((e) => {
    if (e.touches.length !== 2 || pinchDist.current === null) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scale = dist / pinchDist.current;
    setImgZoom((prev) => Math.min(Math.max(prev * scale, 0.5), 4));
    pinchDist.current = dist;
  }, []);

  const handlePinchEnd = useCallback(() => {
    pinchDist.current = null;
    setImgZoom((prev) => {
      if (prev < 1) return 1;
      if (prev > 3) return 3;
      return prev;
    });
  }, []);

  /* ── 5. Swipe-down to close modal ─────────────────────────── */
  const handlePanelTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      panelTouchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handlePanelTouchEnd = useCallback((e) => {
    if (panelTouchStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - panelTouchStartY.current;
    panelTouchStartY.current = null;
    if (diff > 120) handleClose();
  }, []);

  /* ── Close handlers ─────────────────────────────────────── */
  const handleClose = useCallback(() => {
    setImgZoom(1);
    setActiveImg(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
      if (e.key === '+' || e.key === '=') setImgZoom((z) => Math.min(z + 0.3, 4));
      if (e.key === '-') setImgZoom((z) => Math.max(z - 0.3, 0.5));
      if (e.key === '0') setImgZoom(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose, nextImg, prevImg]);

  /* ── Reset on project change ─────────────────────────────── */
  useEffect(() => {
    setActiveImg(0);
    setImgZoom(1);
  }, [project?.id]);

  if (!project) return null;

  const accentColor = colors[0];

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="pd-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25 }}
          onClick={handleClose}
        >
          <motion.div
            className="pd-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handlePanelTouchStart}
            onTouchEnd={handlePanelTouchEnd}
          >
            {/* ── Close button ───────────────────────────────── */}
            <motion.button
              className="pd-close"
              onClick={handleClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.button>

            <motion.div className="pd-content" variants={containerVariants} initial="hidden" animate="visible">
              {/* ── Hero Gallery ──────────────────────────────── */}
              {hasImages && (
                <motion.div className="pd-gallery" variants={itemVariants}>
                  <div
                    className={`pd-gallery__main ${imgZoom > 1 ? 'pd-gallery__main--zoomed' : ''}`}
                    onWheel={handleWheel}
                    onTouchStart={(e) => { handleGalleryTouchStart(e); handlePinchStart(e); }}
                    onTouchMove={handlePinchMove}
                    onTouchEnd={(e) => { handleGalleryTouchEnd(e); handlePinchEnd(); }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImg}
                        src={images[activeImg]}
                        alt={`${project.project_name} — ${activeImg + 1}`}
                        className="pd-gallery__img"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: imgZoom }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        onDoubleClick={handleDoubleTap}
                        draggable={false}
                      />
                    </AnimatePresence>

                    {/* Zoom indicator */}
                    {imgZoom > 1 && (
                      <motion.div
                        className="pd-gallery__zoom-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                        {Math.round(imgZoom * 100)}%
                      </motion.div>
                    )}

                    {/* Image counter */}
                    {images.length > 1 && (
                      <div className="pd-gallery__counter">
                        <span className="pd-gallery__counter-num">{activeImg + 1}</span>
                        <span className="pd-gallery__counter-sep">/</span>
                        <span className="pd-gallery__counter-total">{images.length}</span>
                      </div>
                    )}

                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          className="pd-gallery__arrow pd-gallery__arrow--left"
                          onClick={prevImg}
                          aria-label="Previous image"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <button
                          className="pd-gallery__arrow pd-gallery__arrow--right"
                          onClick={nextImg}
                          aria-label="Next image"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="pd-gallery__thumbs">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          className={`pd-gallery__thumb ${i === activeImg ? 'pd-gallery__thumb--active' : ''}`}
                          onClick={() => setActiveImg(i)}
                          aria-label={`View image ${i + 1}`}
                        >
                          <img src={img} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Video Embed ──────────────────────────────── */}
              {hasVideo && !hasImages && (
                <motion.div className="pd-video" variants={itemVariants}>
                  <iframe
                    src={project.media.project_video}
                    title={`${project.project_name} video`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </motion.div>
              )}

              {/* ── Header ───────────────────────────────────── */}
              <motion.div className="pd-header" variants={itemVariants}>
                <div className="pd-header__top">
                  <div className="pd-header__icon" style={{ background: accentColor + '18' }}>
                    <ProjectIcon type={project.project_type} color={accentColor} size={24} />
                  </div>
                  <div className="pd-header__meta">
                    <span className="pd-header__type">{project.project_type}</span>
                    {project.end_date === null && (
                      <span className="pd-header__badge">
                        <span className="pd-header__badge-dot" />
                        Active
                      </span>
                    )}
                  </div>
                  {project.category && (
                    <span className="pd-header__category">{project.category}</span>
                  )}
                </div>

                <h2 className="pd-header__name">{project.project_name}</h2>

                {project.my_role && (
                  <div className="pd-header__role">
                    <span className="pd-header__role-label">Role</span>
                    <span className="pd-header__role-value">{project.my_role}</span>
                  </div>
                )}
              </motion.div>

              {/* ── Info Grid ────────────────────────────────── */}
              <motion.div className="pd-info-grid" variants={itemVariants}>
                {project.start_date && (
                  <div className="pd-info-card">
                    <div className="pd-info-card__icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="pd-info-card__content">
                      <span className="pd-info-card__label">Duration</span>
                      <span className="pd-info-card__value">
                        {fmtDate(project.start_date)}
                        {project.end_date && ` — ${fmtDate(project.end_date)}`}
                        {!project.end_date && ' — Present'}
                      </span>
                      <span className="pd-info-card__sub">
                        {calcDuration(project.start_date, project.end_date)}
                      </span>
                    </div>
                  </div>
                )}

                {project.skills_used?.length > 0 && (
                  <div className="pd-info-card">
                    <div className="pd-info-card__icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <div className="pd-info-card__content">
                      <span className="pd-info-card__label">Tech Stack</span>
                      <span className="pd-info-card__value">{project.skills_used.length} technologies</span>
                    </div>
                  </div>
                )}

                {project.github_url && (
                  <a className="pd-info-card pd-info-card--link" href={project.github_url} target="_blank" rel="noopener noreferrer">
                    <div className="pd-info-card__icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                    </div>
                    <div className="pd-info-card__content">
                      <span className="pd-info-card__label">Source Code</span>
                      <span className="pd-info-card__value">View on GitHub</span>
                    </div>
                    <svg className="pd-info-card__arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                )}

                {project.live_url && (
                  <a className="pd-info-card pd-info-card--link" href={project.live_url} target="_blank" rel="noopener noreferrer">
                    <div className="pd-info-card__icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className="pd-info-card__content">
                      <span className="pd-info-card__label">Live Demo</span>
                      <span className="pd-info-card__value">Visit live site</span>
                    </div>
                    <svg className="pd-info-card__arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                )}
              </motion.div>

              {/* ── Description ──────────────────────────────── */}
              {project.description && (
                <motion.div className="pd-section" variants={itemVariants}>
                  <h3 className="pd-section__title">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                    </svg>
                    About this project
                  </h3>
                  <p className="pd-section__text">{project.description}</p>
                </motion.div>
              )}

              {/* ── Skills Used ──────────────────────────────── */}
              {project.skills_used?.length > 0 && (
                <motion.div className="pd-section" variants={itemVariants}>
                  <h3 className="pd-section__title">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Technologies Used
                  </h3>
                  <div className="pd-skills">
                    {project.skills_used.map((sk, i) => (
                      <motion.span
                        key={i}
                        className="pd-skill-tag"
                        style={{
                          '--tag-color': colors[i % colors.length],
                          '--tag-bg': colors[i % colors.length] + '14',
                          '--tag-border': colors[i % colors.length] + '30',
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      >
                        {sk}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
