/**
 * EducationSection.jsx
 * ─────────────────────────────────────────────────────────
 * Education & Courses dashboard section.
 *
 * Layout:
 *   Left: Education cards (degrees, certifications)
 *   Right: Courses grid (auto-fill)
 *
 * Data: education + courses from usePortfolioData
 * ─────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/EducationSection.css';

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
  dark: ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'],
  light: ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'],
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function EducationSection({ education, courses }) {
  const { isDark } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const eduList = education?.education || [];
  const courseList = courses?.courses || [];
  const courseCategories = courses?.categories || [];

  /* ── Course filter ────────────────────────────────────────── */
  const [activeCat, setActiveCat] = useState('All');

  const filteredCourses = useMemo(() => {
    if (activeCat === 'All') return courseList;
    return courseList.filter(c => c.category === activeCat);
  }, [courseList, activeCat]);

  /* ════════════════════════════════════════════════════════════
     EDUCATION CARDS (LEFT)
     ════════════════════════════════════════════════════════════ */
  const EducationCards = () => (
    <motion.div
      className="edu-panel edu-degree"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.0 }}
    >
      <div className="edu-panel__header">
        <span className="edu-panel__title">Education</span>
        <span className="edu-panel__sub">{eduList.length} qualification{eduList.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="edu-degree__list">
        {eduList.map((edu, i) => (
          <div className="edu-degree-card" key={edu.id || i}>
            <div className="edu-degree-card__accent" style={{ background: colors[i % colors.length] }} />
            <div className="edu-degree-card__body">
              <h4 className="edu-degree-card__name">{edu.degree}{edu.major ? ` in ${edu.major}` : ''}</h4>
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
                {edu.start_date && new Date(edu.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                {edu.end_date && ` — ${new Date(edu.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
              </span>
            </div>
          </div>
        ))}

        {eduList.length === 0 && (
          <div className="edu-empty">No education records yet</div>
        )}
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     COURSES GRID (RIGHT)
     ════════════════════════════════════════════════════════════ */
  const CoursesGrid = () => (
    <motion.div
      className="edu-panel edu-courses"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.05 }}
    >
      <div className="edu-panel__header">
        <span className="edu-panel__title">Courses</span>
        <span className="edu-panel__sub">{courseList.length} completed</span>
      </div>

      <div className="edu-courses__filters">
        <button
          className={`edu-filter-btn ${activeCat === 'All' ? 'edu-filter-btn--active' : ''}`}
          onClick={() => setActiveCat('All')}
        >
          All
        </button>
        {courseCategories.map(cat => (
          <button
            key={cat}
            className={`edu-filter-btn ${activeCat === cat ? 'edu-filter-btn--active' : ''}`}
            onClick={() => setActiveCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="edu-courses__grid">
        {filteredCourses.map((course, i) => {
          const accentColor = colors[i % colors.length];
          return (
            <div className="edu-course-card" key={course.id || i}>
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
                {course.credential_url && (
                  <a className="edu-course-card__link" href={course.credential_url} target="_blank" rel="noopener noreferrer">
                    View credential →
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredCourses.length === 0 && (
          <div className="edu-empty">No courses found</div>
        )}
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <section id="education" className="education-section" aria-label="Education & Courses">
      <div className="edu-grid">
        <EducationCards />
        <CoursesGrid />
      </div>
    </section>
  );
}
