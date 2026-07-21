/**
 * EducationSection.jsx
 * ─────────────────────────────────────────────────────────
 * Education & Courses dashboard section.
 *
 * Layout (single column):
 *   Top:    Education cards (degrees)
 *   Bottom: Courses grid + inline detail panel
 *
 * Each panel collapses to a summary strip when items > threshold.
 * Course details show inline below the grid (not modal).
 * ─────────────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/EducationSection.css';

/* ── Thresholds — show summary when items exceed ──────────── */
const EDU_SHOW    = 2;
const EDU_TOTAL   = 4;
const COURSE_SHOW = 3;
const COURSE_TOTAL= 6;

/* ── Animation variants ─────────────────────────────────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CARD_TRANSITION = {
  duration: 0.5,
  ease:     [0.4, 0, 0.2, 1],
};

/* ── Theme colors ───────────────────────────────────────────── */
const COLORS = {
  dark:  ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'],
  light: ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'],
};

/* ── Helpers ────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

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

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function EducationSection({ education, courses }) {
  const { isDark } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const eduList    = education?.education || [];
  const courseList = courses?.courses || [];
  const courseCategories = courses?.categories || [];

  const [activeCat, setActiveCat] = useState('All');

  const filteredCourses = useMemo(() => {
    if (activeCat === 'All') return courseList;
    return courseList.filter(c => c.category === activeCat);
  }, [courseList, activeCat]);

  return (
    <section id="education" className="education-section" aria-label="Education & Courses">

      <motion.div
        className="edu-panel"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.0 }}
      >
        <EducationContent eduList={eduList} colors={colors} />
      </motion.div>

      <motion.div
        className="edu-panel"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: 0.05 }}
      >
        <CoursesContent
          courseList={courseList}
          filteredCourses={filteredCourses}
          courseCategories={courseCategories}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          colors={colors}
        />
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB: EducationContent
   ══════════════════════════════════════════════════════════════ */
function EducationContent({ eduList, colors }) {
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = eduList.length > EDU_TOTAL;
  const visibleEdu = shouldCollapse && !expanded ? eduList.slice(0, EDU_SHOW) : eduList;

  const totalSkills = useMemo(() => {
    const all = new Set();
    eduList.forEach(e => (e.skills_learned || []).forEach(sk => all.add(sk)));
    return all.size;
  }, [eduList]);

  const institutions = useMemo(() => {
    return [...new Set(eduList.map(e => e.institution).filter(Boolean))];
  }, [eduList]);

  return (
    <>
      <div className="edu-panel__header">
        <div className="edu-panel__header-row">
          <span className="edu-panel__title">Education</span>
          <span className="edu-panel__badge">{eduList.length}</span>
        </div>
        <span className="edu-panel__sub">
          {totalSkills} skills learned{institutions.length > 0 ? ` · ${institutions.length} institution${institutions.length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <div className="edu-degree__list">
        {visibleEdu.map((edu, i) => (
          <div className="edu-degree-card" key={edu.id || i}>
            <div className="edu-degree-card__accent" style={{ background: colors[i % colors.length] }} />
            <div className="edu-degree-card__body">
              <h4 className="edu-degree-card__name">
                {edu.degree}{edu.major ? ` in ${edu.major}` : ''}
              </h4>
              <span className="edu-degree-card__inst">{edu.institution}</span>
              {edu.grade && <span className="edu-degree-card__grade">Grade: {edu.grade}</span>}
              {edu.description && <p className="edu-degree-card__desc">{edu.description}</p>}
              {edu.skills_learned?.length > 0 && (
                <div className="edu-degree-card__skills">
                  {edu.skills_learned.slice(0, 4).map((sk, si) => (
                    <span className="edu-degree-card__skill-tag" key={si}>{sk}</span>
                  ))}
                  {edu.skills_learned.length > 4 && (
                    <span className="edu-degree-card__skill-more">+{edu.skills_learned.length - 4}</span>
                  )}
                </div>
              )}
              <span className="edu-degree-card__date">
                {edu.start_date && fmtDate(edu.start_date)}
                {edu.end_date && ` — ${fmtDate(edu.end_date)}`}
              </span>
            </div>
          </div>
        ))}
        {eduList.length === 0 && <div className="edu-empty">No education records yet</div>}
      </div>

      {shouldCollapse && !expanded && (
        <div className="edu-summary">
          <div className="edu-summary__bar">
            {institutions.map((inst, i) => {
              const count = eduList.filter(e => e.institution === inst).length;
              return (
                <div key={inst} className="edu-summary__item">
                  <span className="edu-summary__label">{inst}</span>
                  <div className="edu-summary__track">
                    <div className="edu-summary__fill" style={{ width: `${(count / eduList.length) * 100}%`, background: colors[i % colors.length] }} />
                  </div>
                  <span className="edu-summary__count" style={{ color: colors[i % colors.length] }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className="edu-summary__remaining">
            +{eduList.length - EDU_SHOW} more qualification{eduList.length - EDU_SHOW !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {shouldCollapse && (
        <button className="edu-toggle" onClick={() => setExpanded(prev => !prev)} aria-expanded={expanded}>
          {expanded ? 'Show less' : `Show all ${eduList.length}`}
          <svg className={`edu-toggle__icon ${expanded ? 'edu-toggle__icon--up' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB: CoursesContent
   ══════════════════════════════════════════════════════════════ */
function CoursesContent({ courseList, filteredCourses, courseCategories, activeCat, setActiveCat, colors }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const detailRef = useRef(null);

  const selectCourse = useCallback((course) => {
    setSelectedCourse(prev => prev?.id === course.id ? null : course);
  }, []);

  const closeDetail = useCallback(() => setSelectedCourse(null), []);

  /* Scroll to detail panel when selected */
  useEffect(() => {
    if (selectedCourse && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedCourse]);

  const shouldCollapse = courseList.length > COURSE_TOTAL;
  const visibleCourses = shouldCollapse && !expanded ? filteredCourses.slice(0, COURSE_SHOW) : filteredCourses;

  const catStats = useMemo(() => {
    const map = {};
    courseList.forEach(c => {
      const cat = c.category || 'Other';
      if (!map[cat]) map[cat] = 0;
      map[cat]++;
    });
    return map;
  }, [courseList]);

  const totalSkills = useMemo(() => {
    const all = new Set();
    courseList.forEach(c => (c.acquired_skills || []).forEach(sk => all.add(sk)));
    return all.size;
  }, [courseList]);

  const catColors = useMemo(() => {
    const map = {};
    courseCategories.forEach((cat, i) => { map[cat] = colors[i % colors.length]; });
    return map;
  }, [courseCategories, colors]);

  const accentFor = useCallback((course, i) => catColors[course.category] || colors[i % colors.length], [catColors, colors]);

  return (
    <>
      <div className="edu-panel__header">
        <div className="edu-panel__header-row">
          <span className="edu-panel__title">Courses</span>
          <span className="edu-panel__badge">{courseList.length}</span>
        </div>
        <span className="edu-panel__sub">
          {totalSkills} skills acquired{courseCategories.length > 0 ? ` · ${courseCategories.length} categories` : ''}
        </span>
      </div>

      <div className="edu-courses__filters">
        <button className={`edu-filter-btn ${activeCat === 'All' ? 'edu-filter-btn--active' : ''}`} onClick={() => setActiveCat('All')}>All</button>
        {courseCategories.map(cat => (
          <button key={cat} className={`edu-filter-btn ${activeCat === cat ? 'edu-filter-btn--active' : ''}`} onClick={() => setActiveCat(cat)}>{cat}</button>
        ))}
      </div>

      <div className="edu-courses__grid">
        {visibleCourses.map((course, i) => {
          const accentColor = accentFor(course, i);
          const isSelected = selectedCourse?.id === course.id;
          return (
            <div
              className={`edu-course-card ${isSelected ? 'edu-course-card--selected' : ''}`}
              key={course.id || i}
              onClick={() => selectCourse(course)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCourse(course); } }}
            >
              <div className="edu-course-card__icon" style={{ background: accentColor + '18' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="edu-course-card__body">
                <h4 className="edu-course-card__name">{course.course_name}</h4>
                <span className="edu-course-card__org">{course.organization}</span>
                {course.category && <span className="edu-course-card__cat">{course.category}</span>}
                {course.acquired_skills?.length > 0 && (
                  <div className="edu-course-card__skills">
                    {course.acquired_skills.slice(0, 3).map((sk, si) => (
                      <span className="edu-course-card__skill-tag" key={si}>{sk}</span>
                    ))}
                    {course.acquired_skills.length > 3 && (
                      <span className="edu-course-card__skill-more">+{course.acquired_skills.length - 3}</span>
                    )}
                  </div>
                )}
                <button className="edu-course-card__details-btn" onClick={(e) => { e.stopPropagation(); selectCourse(course); }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {isSelected ? 'Hide Details' : 'View Details'}
                </button>
              </div>
            </div>
          );
        })}
        {filteredCourses.length === 0 && <div className="edu-empty">No courses found</div>}
      </div>

      {/* ── INLINE COURSE DETAIL PANEL ────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedCourse && (
          <CourseDetailPanel
            key={selectedCourse.id}
            course={selectedCourse}
            colors={colors}
            catColors={catColors}
            onClose={closeDetail}
            detailRef={detailRef}
          />
        )}
      </AnimatePresence>

      {shouldCollapse && !expanded && (
        <div className="edu-summary">
          <div className="edu-summary__bar">
            {Object.entries(catStats).map(([cat, count], i) => (
              <div key={cat} className="edu-summary__item">
                <span className="edu-summary__label">{cat}</span>
                <div className="edu-summary__track">
                  <div className="edu-summary__fill" style={{ width: `${(count / courseList.length) * 100}%`, background: catColors[cat] || colors[i % colors.length] }} />
                </div>
                <span className="edu-summary__count" style={{ color: catColors[cat] || colors[i % colors.length] }}>{count}</span>
              </div>
            ))}
          </div>
          <div className="edu-summary__remaining">
            +{courseList.length - COURSE_SHOW} more course{courseList.length - COURSE_SHOW !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {shouldCollapse && (
        <button className="edu-toggle" onClick={() => setExpanded(prev => !prev)} aria-expanded={expanded}>
          {expanded ? 'Show less' : `Show all ${courseList.length} courses`}
          <svg className={`edu-toggle__icon ${expanded ? 'edu-toggle__icon--up' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB: CourseDetailPanel
   Inline detail view — renders below the course grid.
   ══════════════════════════════════════════════════════════════ */
function CourseDetailPanel({ course, colors, catColors, onClose, detailRef }) {
  const [activeImg, setActiveImg] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);

  const images = [
    ...(course?.course_images || []),
    ...(course?.certificate_image ? [course.certificate_image] : []),
  ];
  const hasImages = images.length > 0;
  const hasVideo = !!course?.course_video;
  const accentColor = catColors[course.category] || colors[0];

  /* Gallery nav */
  const nextImg = useCallback(() => {
    if (images.length <= 1) return;
    setImgZoom(1);
    setActiveImg(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const prevImg = useCallback(() => {
    if (images.length <= 1) return;
    setImgZoom(1);
    setActiveImg(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  /* Keyboard nav */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [nextImg, prevImg]);

  /* Reset on course change */
  useEffect(() => {
    setActiveImg(0);
    setImgZoom(1);
  }, [course?.id]);

  return (
    <motion.div
      className="edu-detail"
      ref={detailRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Close button */}
      <button className="edu-detail__close" onClick={onClose} aria-label="Close details">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Gallery */}
      {hasImages && (
        <div className="edu-detail__gallery">
          <div className="edu-detail__gallery-main">
            <img
              src={images[activeImg]}
              alt={`${course.course_name} — ${activeImg + 1}`}
              className="edu-detail__gallery-img"
              style={{ transform: `scale(${imgZoom})` }}
              draggable={false}
            />
            {images.length > 1 && (
              <>
                <button className="edu-detail__arrow edu-detail__arrow--left" onClick={prevImg} aria-label="Previous">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button className="edu-detail__arrow edu-detail__arrow--right" onClick={nextImg} aria-label="Next">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <div className="edu-detail__counter">
                  <span>{activeImg + 1}</span>/<span>{images.length}</span>
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="edu-detail__thumbs">
              {images.map((img, i) => (
                <button key={i} className={`edu-detail__thumb ${i === activeImg ? 'edu-detail__thumb--active' : ''}`} onClick={() => { setActiveImg(i); setImgZoom(1); }}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video (only if no images) */}
      {hasVideo && !hasImages && (
        <div className="edu-detail__video">
          <iframe src={course.course_video} title={`${course.course_name} video`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )}

      {/* Header */}
      <div className="edu-detail__header">
        <div className="edu-detail__header-top">
          <div className="edu-detail__icon" style={{ background: accentColor + '18' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          {course.category && <span className="edu-detail__category">{course.category}</span>}
          {course.credential_url && (
            <a className="edu-detail__credential" href={course.credential_url} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Credential
            </a>
          )}
        </div>
        <h3 className="edu-detail__name">{course.course_name}</h3>
        {course.organization && (
          <div className="edu-detail__org">
            <span className="edu-detail__org-label">Organization</span>
            <span className="edu-detail__org-value">{course.organization}</span>
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="edu-detail__info-grid">
        {course.start_date && (
          <div className="edu-detail__info-card">
            <div className="edu-detail__info-icon">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="edu-detail__info-content">
              <span className="edu-detail__info-label">Duration</span>
              <span className="edu-detail__info-value">{fmtDate(course.start_date)}{course.end_date && ` — ${fmtDate(course.end_date)}`}</span>
              <span className="edu-detail__info-sub">{calcDuration(course.start_date, course.end_date)}</span>
            </div>
          </div>
        )}
        {course.acquired_skills?.length > 0 && (
          <div className="edu-detail__info-card">
            <div className="edu-detail__info-icon">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div className="edu-detail__info-content">
              <span className="edu-detail__info-label">Skills Learned</span>
              <span className="edu-detail__info-value">{course.acquired_skills.length} technologies</span>
            </div>
          </div>
        )}
      </div>

      {/* Project summary */}
      {course.project_summary && (
        <div className="edu-detail__section">
          <h4 className="edu-detail__section-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Project Summary
          </h4>
          <p className="edu-detail__section-text">{course.project_summary}</p>
        </div>
      )}

      {/* Skills */}
      {course.acquired_skills?.length > 0 && (
        <div className="edu-detail__section">
          <h4 className="edu-detail__section-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Skills Acquired
          </h4>
          <div className="edu-detail__skills">
            {course.acquired_skills.map((sk, i) => (
              <span
                key={i}
                className="edu-detail__skill-tag"
                style={{
                  color: colors[i % colors.length],
                  background: colors[i % colors.length] + '14',
                  borderColor: colors[i % colors.length] + '30',
                }}
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
